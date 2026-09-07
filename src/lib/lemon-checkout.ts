import { createHmac, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import {
  MEMBERSHIP_USD_CENTS,
  hasLemonConfigured,
  lemonSessionId,
  paymentIdFromLemonSession,
} from "@/lib/membership";
import { fulfillAccountPayment } from "@/lib/stripe-checkout";
import type { CreateAccountCheckoutInput, CreateCheckoutResult } from "@/lib/stripe-checkout";

const LEMON_API = "https://api.lemonsqueezy.com/v1";

function lemonApiKey(): string | undefined {
  const value = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  return value || undefined;
}

function lemonStoreId(): string | undefined {
  const value = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
  return value || undefined;
}

function lemonVariantId(): string | undefined {
  const value = process.env.LEMON_SQUEEZY_VARIANT_ID?.trim();
  return value || undefined;
}

function lemonWebhookSecret(): string | undefined {
  const value = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
  return value || undefined;
}

function lemonTestMode(): boolean {
  const raw = process.env.LEMON_SQUEEZY_TEST_MODE?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

type LemonCheckoutResponse = {
  data?: {
    id?: string;
    attributes?: {
      url?: string;
    };
  };
};

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string | number>;
  };
  data?: {
    type?: string;
    id?: string;
    attributes?: {
      status?: string;
      total?: number;
      total_usd?: number;
      test_mode?: boolean;
    };
  };
};

export async function createLemonCheckoutForPayment(
  input: CreateAccountCheckoutInput,
  paymentId: number,
  origin: string,
): Promise<CreateCheckoutResult> {
  if (!hasLemonConfigured()) {
    return { ok: false, error: "Lemon Squeezy is not configured." };
  }

  const apiKey = lemonApiKey();
  const storeId = lemonStoreId();
  const variantId = lemonVariantId();
  if (!apiKey || !storeId || !variantId) {
    return { ok: false, error: "Lemon Squeezy credentials are incomplete." };
  }

  const sessionId = lemonSessionId(paymentId);
  const body = {
    data: {
      type: "checkouts",
      attributes: {
        custom_price: MEMBERSHIP_USD_CENTS,
        test_mode: lemonTestMode(),
        product_options: {
          name: "Wahid · ʿAḍīd membership",
          description: `One dollar to join The ʿAḍud as @${input.username}.`,
          redirect_url: `${origin}/?checkout=success&session_id=${encodeURIComponent(sessionId)}`,
        },
        checkout_data: {
          custom: {
            payment_id: String(paymentId),
            account_id: String(input.accountId),
            username: input.username,
            country: input.country,
            ref_slug: input.ref ?? "",
          },
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };

  const response = await fetch(`${LEMON_API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[lemon] checkout create failed:", response.status, detail);
    return { ok: false, error: "Could not create Lemon Squeezy checkout." };
  }

  const payload = (await response.json()) as LemonCheckoutResponse;
  const checkoutId = payload.data?.id;
  const url = payload.data?.attributes?.url;
  if (!checkoutId || !url) {
    return { ok: false, error: "Lemon Squeezy did not return a checkout URL." };
  }

  const sql = await getSql();
  await sql`
    update membership_payments
    set stripe_session_id = ${sessionId}, lemon_checkout_id = ${checkoutId}
    where id = ${paymentId}
  `;

  return { ok: true, url, sessionId, mode: "lemon" };
}

export async function fulfillLemonOrder(
  paymentId: number,
  orderId: string,
  stamp: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await fulfillAccountPayment(paymentId, stamp);
  if (!result.ok) return result;

  const sql = await getSql();
  await sql`
    update membership_payments
    set lemon_order_id = ${orderId}
    where id = ${paymentId}
  `;

  return { ok: true };
}

export async function handleLemonWebhook(rawBody: string, signature: string | null): Promise<Response> {
  const secret = lemonWebhookSecret();
  if (!secret) {
    return new Response("Lemon Squeezy webhook not configured", { status: 503 });
  }
  if (!signature) {
    return new Response("Missing X-Signature header", { status: 400 });
  }

  const digest = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"), "utf8");
  const expected = Buffer.from(signature, "utf8");
  if (digest.length !== expected.length || !timingSafeEqual(digest, expected)) {
    console.error("[lemon] webhook signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (eventName !== "order_created") {
    return new Response(JSON.stringify({ received: true, skipped: eventName }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const status = payload.data?.attributes?.status;
  if (status !== "paid") {
    return new Response(JSON.stringify({ received: true, skipped: "not_paid" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const custom = payload.meta?.custom_data ?? {};
  const paymentId = Number(custom.payment_id ?? 0);
  const orderId = payload.data?.id ?? "";
  if (!paymentId || !orderId) {
    console.error("[lemon] webhook missing payment_id or order id");
    return new Response("Missing payment metadata", { status: 400 });
  }

  const result = await fulfillLemonOrder(paymentId, orderId, "lemon-webhook");
  if (!result.ok) {
    console.error("[lemon] fulfill failed:", result.error);
    return new Response(result.error ?? "Fulfillment failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function completeLemonCheckoutSession(
  sessionId: string,
  _stamp: string,
): Promise<{ ok: boolean; status: "pending" | "completed" | "missing"; username?: string; error?: string }> {
  const paymentId = paymentIdFromLemonSession(sessionId);
  if (!paymentId) return { ok: false, status: "missing", error: "Invalid Lemon session." };

  const sql = await getSql();
  const rows = await sql<{ status: string; donation_id: number | null; username: string | null }>`
    select status, donation_id, username from membership_payments where id = ${paymentId} limit 1
  `;
  const row = rows[0];
  if (!row) return { ok: false, status: "missing", error: "Checkout session not found." };
  if (row.status === "completed" && row.donation_id) {
    return { ok: true, status: "completed", username: row.username ?? undefined };
  }

  return { ok: false, status: "pending", username: row.username ?? undefined };
}
