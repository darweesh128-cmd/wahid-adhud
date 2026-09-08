import { MEMBERSHIP_USD_CENTS } from "@/lib/membership";
import {
  resolveSubyPaymentMethods,
  subyProductIsCardFirst,
  subyProductSupportsPaymentMethods,
  type SubyPaymentMethod,
} from "@/lib/suby-payment-methods";

export type SubyApiVersion = "v3" | "v2";

export type { SubyPaymentMethod } from "@/lib/suby-payment-methods";
export {
  resolveSubyPaymentMethods,
  subyProductIsCardFirst,
  subyProductSupportsPaymentMethods,
} from "@/lib/suby-payment-methods";

const DEFAULT_V3_BASE = "https://api.beta.suby.fi";
const DEFAULT_V2_BASE = "https://api.suby.fi";

export type SubyProduct = {
  id: string;
  name: string;
  status: string;
  isCustomPrice?: boolean;
  priceCents?: string | null;
  currency?: string | null;
  paymentMethods?: SubyPaymentMethod[];
};

export function resolveSubyApiVersion(): SubyApiVersion {
  const raw = process.env.SUBY_API_VERSION?.trim().toLowerCase();
  return raw === "v3" ? "v3" : "v2";
}

export function subyApiBase(): string {
  const override = process.env.SUBY_API_BASE_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  return resolveSubyApiVersion() === "v2" ? DEFAULT_V2_BASE : DEFAULT_V3_BASE;
}

type SubyEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
};

export async function subyRequest<T>(
  method: "GET" | "POST",
  path: string,
  apiKey: string,
  body?: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const url = `${subyApiBase()}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Suby-Api-Key": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as SubyEnvelope<T> | null;
  const okStatus = response.status === 200 || response.status === 201;
  if (!okStatus || !payload?.success || !payload.data) {
    const message =
      payload?.error?.message ??
      (typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: string }).message)
        : undefined) ??
      `Suby API error (${response.status})`;
    return { ok: false, error: message };
  }

  return { ok: true, data: payload.data };
}

/** Ad-hoc $1 price when `SUBY_PRODUCT_ID` is not set. */
export function resolveSubyPriceCents(): number {
  const raw = process.env.SUBY_PRICE_CENTS?.trim();
  if (raw) {
    const cents = Number(raw);
    if (Number.isFinite(cents) && cents > 0) return Math.round(cents);
  }
  return MEMBERSHIP_USD_CENTS;
}

export async function getSubyProduct(
  productId: string,
  apiKey: string,
): Promise<{ ok: true; data: SubyProduct } | { ok: false; error: string }> {
  return subyRequest<SubyProduct>("GET", `/api/product/${productId}`, apiKey);
}

type CreateSubyProductInput = {
  name: string;
  description?: string;
  paymentMethods: SubyPaymentMethod[];
  isCustomPrice?: boolean;
  priceCents?: string;
  currency?: "USD" | "EUR";
};

export async function createSubyProduct(
  input: CreateSubyProductInput,
  apiKey: string,
): Promise<{ ok: true; data: SubyProduct } | { ok: false; error: string }> {
  const body: Record<string, unknown> = {
    name: input.name,
    platform: "WEB",
    paymentMethods: input.paymentMethods,
    frequencyInDays: null,
  };
  if (input.description) body.description = input.description;
  if (input.isCustomPrice) {
    body.isCustomPrice = true;
  } else {
    body.priceCents = input.priceCents ?? String(resolveSubyPriceCents());
    body.currency = input.currency ?? "USD";
  }

  return subyRequest<SubyProduct>("POST", "/api/product/create", apiKey, body);
}

let cachedCardMembershipProductId: string | null = null;

/**
 * Resolve a Suby product id whose `paymentMethods` include CARD (and exclude CRYPTO when
 * `resolveSubyPaymentMethods()` is CARD-only). Suby v2 binds methods to the product;
 * `/api/payment/create` does not override them in the public OpenAPI, but we still send
 * `paymentMethods` on create as a forward-compatible hint.
 */
export async function resolveSubyMembershipProductId(
  apiKey: string,
  configuredProductId?: string,
): Promise<
  { ok: true; productId: string; isCustomPrice: boolean } | { ok: false; error: string }
> {
  const required = resolveSubyPaymentMethods();
  const needsCardOnly = required.length === 1 && required[0] === "CARD";

  const acceptProduct = (product: SubyProduct) => {
    const cardOk = subyProductSupportsPaymentMethods(product, required);
    const cryptoExcluded = !needsCardOnly || !(product.paymentMethods ?? []).includes("CRYPTO");
    return cardOk && cryptoExcluded && (!needsCardOnly || subyProductIsCardFirst(product));
  };

  if (configuredProductId) {
    const existing = await getSubyProduct(configuredProductId, apiKey);
    if (existing.ok && acceptProduct(existing.data)) {
      return {
        ok: true,
        productId: existing.data.id,
        isCustomPrice: Boolean(existing.data.isCustomPrice),
      };
    }
    if (existing.ok) {
      console.warn(
        "[suby] SUBY_PRODUCT_ID paymentMethods=%j — need %j (card-first, no crypto default). Provisioning card product.",
        existing.data.paymentMethods ?? [],
        required,
      );
    } else {
      console.warn("[suby] could not load SUBY_PRODUCT_ID:", existing.error);
    }
  }

  if (cachedCardMembershipProductId) {
    const cached = await getSubyProduct(cachedCardMembershipProductId, apiKey);
    if (cached.ok && acceptProduct(cached.data)) {
      return {
        ok: true,
        productId: cached.data.id,
        isCustomPrice: Boolean(cached.data.isCustomPrice),
      };
    }
    cachedCardMembershipProductId = null;
  }

  const override = process.env.SUBY_CARD_PRODUCT_ID?.trim();
  if (override) {
    const cardProduct = await getSubyProduct(override, apiKey);
    if (cardProduct.ok && acceptProduct(cardProduct.data)) {
      cachedCardMembershipProductId = override;
      return {
        ok: true,
        productId: override,
        isCustomPrice: Boolean(cardProduct.data.isCustomPrice),
      };
    }
    console.warn("[suby] SUBY_CARD_PRODUCT_ID invalid or missing CARD:", override);
  }

  const created = await createSubyProduct(
    {
      name: "Wahid · ʿAḍīd membership ($1 card)",
      description: "One-time $1 USD membership — card / Apple Pay / Google Pay (MoR checkout).",
      paymentMethods: required,
      isCustomPrice: true,
    },
    apiKey,
  );
  if (!created.ok) {
    return {
      ok: false,
      error:
        created.error +
        ' Configure a CARD-only product in the Suby dashboard (paymentMethods: ["CARD"]) and set SUBY_PRODUCT_ID or SUBY_CARD_PRODUCT_ID.',
    };
  }

  cachedCardMembershipProductId = created.data.id;
  console.info("[suby] using CARD membership product:", created.data.id);
  return { ok: true, productId: created.data.id, isCustomPrice: true };
}
