import { getSql } from "@/lib/db";
import {
  checkoutMode,
  hasSubyConfigured,
  isMembershipCheckoutV2Enabled,
  isSubySessionId,
  resolveSubyApiKey,
  resolveSubyProductId,
} from "@/lib/membership";
import { fulfillAccountPayment } from "@/lib/membership-fulfill";
import { resolveSubyApiVersion, resolveSubyMembershipProductId, resolveSubyPaymentMethods, resolveSubyPriceCents, subyRequest } from "@/lib/suby-api";
import { verifySubyWebhookSignature as verifySignature } from "@/lib/suby-webhook-verify";

type SubyV2CreatePaymentData = {
  paymentId: string;
  paymentUrl: string;
};

type SubyV3CheckoutSession = {
  id: string;
  url: string;
  status: string;
};

type SubyWebhookPayload = {
  id: string;
  type: string;
  data: Record<string, unknown> & {
    context?: {
      externalRef?: string | null;
      metadata?: Record<string, unknown> | null;
    };
    payment?: { id?: string };
    metadata?: Record<string, unknown> | null;
    externalRef?: string | null;
    id?: string;
    status?: string;
  };
};

const SUBY_PAID_STATUSES = new Set([
  "SUCCEEDED",
  "SUCCESS",
  "SETTLED",
  "PAID",
  "COMPLETED",
  "CHECKOUT_SUCCESS",
  "AUTHORIZED",
]);

/** Card checkout complete — grant membership on these (v3 + v2). */
const SUBY_FULFILL_EVENTS = new Set([
  "checkout.succeeded",
  "CHECKOUT_SUCCESS",
  "payment.succeeded",
  "PAYMENT_SUCCESS",
]);

function subyWebhookSecret(): string | undefined {
  const value = process.env.SUBY_WEBHOOK_SECRET?.trim();
  return value || undefined;
}

export function verifySubyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
): boolean {
  return verifySignature(rawBody, signatureHeader, timestampHeader, subyWebhookSecret());
}

export function subyCheckoutConfigured(): boolean {
  return hasSubyConfigured();
}

export type CreateSubyCheckoutInput = {
  paymentId: number;
  accountId: number;
  username: string;
  country: string;
  ref: string | null;
  origin: string;
};

function membershipMetadata(input: CreateSubyCheckoutInput): Record<string, string> {
  return {
    payment_id: String(input.paymentId),
    account_id: String(input.accountId),
    username: input.username,
    country: input.country,
    ref_slug: input.ref ?? "",
  };
}

async function createSubyV3CheckoutSession(
  input: CreateSubyCheckoutInput,
  apiKey: string,
): Promise<{ ok: true; url: string; sessionId: string } | { ok: false; error: string }> {
  const productId = resolveSubyProductId();
  const body: Record<string, unknown> = {
    mode: "payment",
    successUrl: `${input.origin}/?checkout=success&pid=${input.paymentId}`,
    cancelUrl: `${input.origin}/?checkout=cancelled#join`,
    metadata: membershipMetadata(input),
    displayName: `Wahid · ʿAḍīd membership (@${input.username})`,
    paymentMethods: resolveSubyPaymentMethods(),
  };

  if (productId) {
    body.productId = productId;
  } else {
    body.amount = resolveSubyPriceCents();
    body.currency = "USD";
  }

  const created = await subyRequest<SubyV3CheckoutSession>(
    "POST",
    "/v3/checkout/sessions",
    apiKey,
    body,
  );
  if (!created.ok) return created;

  return { ok: true, url: created.data.url, sessionId: created.data.id };
}

async function createSubyV2Payment(
  input: CreateSubyCheckoutInput,
  apiKey: string,
): Promise<{ ok: true; url: string; sessionId: string } | { ok: false; error: string }> {
  const product = await resolveSubyMembershipProductId(apiKey, resolveSubyProductId());
  if (!product.ok) return product;

  const paymentMethods = resolveSubyPaymentMethods();
  const body: Record<string, unknown> = {
    productId: product.productId,
    externalRef: String(input.paymentId),
    metadata: membershipMetadata(input),
    successUrl: `${input.origin}/?checkout=success&pid=${input.paymentId}`,
    cancelUrl: `${input.origin}/?checkout=cancelled#join`,
    // Best-effort on v2 payment/create (product.paymentMethods is authoritative; see Suby OpenAPI).
    paymentMethods,
  };

  if (product.isCustomPrice) {
    body.priceCents = String(resolveSubyPriceCents());
    body.currency = "USD";
  }

  const created = await subyRequest<SubyV2CreatePaymentData>("POST", "/api/payment/create", apiKey, body);
  if (!created.ok) return created;

  const sessionId = created.data.paymentId;
  const url = created.data.paymentUrl.includes("{PAYMENT_ID}")
    ? created.data.paymentUrl.replace("{PAYMENT_ID}", sessionId)
    : created.data.paymentUrl;
  return { ok: true, url, sessionId };
}

export async function createSubyPayment(
  input: CreateSubyCheckoutInput,
): Promise<{ ok: true; url: string; sessionId: string } | { ok: false; error: string }> {
  if (!isMembershipCheckoutV2Enabled() || checkoutMode() !== "suby") {
    return { ok: false, error: "Suby checkout is not enabled." };
  }

  const apiKey = resolveSubyApiKey();
  if (!apiKey) return { ok: false, error: "Suby API key is not configured (SUBY_API_KEY)." };

  return resolveSubyApiVersion() === "v2"
    ? createSubyV2Payment(input, apiKey)
    : createSubyV3CheckoutSession(input, apiKey);
}

export function paymentIdFromSubyWebhook(event: SubyWebhookPayload): number | null {
  const data = event.data;
  const metadata =
    data.metadata ??
    data.context?.metadata ??
    (typeof data.payment === "object" && data.payment && "metadata" in data.payment
      ? (data.payment as { metadata?: Record<string, unknown> }).metadata
      : null);

  if (metadata && typeof metadata === "object") {
    const fromMeta = Number(metadata.payment_id ?? 0);
    if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;
  }

  const externalRef = data.externalRef ?? data.context?.externalRef;
  if (externalRef) {
    const fromRef = Number(externalRef);
    if (Number.isFinite(fromRef) && fromRef > 0) return fromRef;
  }

  return null;
}

function subyPaymentLooksPaid(status: string): boolean {
  const normalized = status.trim().toUpperCase();
  return SUBY_PAID_STATUSES.has(normalized) || normalized.includes("SUCCESS");
}

export async function handleSubyWebhook(
  rawBody: string,
  headers: { signature: string | null; timestamp: string | null; event: string | null },
): Promise<Response> {
  if (!subyWebhookSecret()) {
    return new Response("Suby webhook not configured", { status: 503 });
  }
  if (!verifySubyWebhookSignature(rawBody, headers.signature, headers.timestamp)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: SubyWebhookPayload;
  try {
    event = JSON.parse(rawBody) as SubyWebhookPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType = headers.event ?? event.type;
  if (!SUBY_FULFILL_EVENTS.has(eventType)) {
    return new Response(JSON.stringify({ received: true, ignored: eventType }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const paymentId = paymentIdFromSubyWebhook(event);
  if (!paymentId) {
    console.error("[suby] webhook missing payment id:", event.id, eventType);
    return new Response("Missing payment reference", { status: 400 });
  }

  const externalPaymentId =
    (typeof event.data.id === "string" ? event.data.id : null) ??
    event.data.payment?.id ??
    null;

  const result = await fulfillAccountPayment(paymentId, "suby-webhook", {
    externalPaymentId,
  });
  if (!result.ok) {
    console.error("[suby] fulfill failed:", result.error);
    return new Response(result.error ?? "Fulfillment failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function pollSubyV3Session(
  sessionId: string,
  apiKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await subyRequest<SubyV3CheckoutSession>(
    "GET",
    `/v3/checkout/sessions/${sessionId}`,
    apiKey,
  );
  if (!session.ok) return session;
  if (session.data.status !== "COMPLETED") {
    return { ok: false, error: "Payment is not completed yet." };
  }
  return { ok: true };
}

async function pollSubyV2Payment(
  sessionId: string,
  apiKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payment = await subyRequest<{ id: string; status: string }>(
    "GET",
    `/api/payment/${sessionId}`,
    apiKey,
  );
  if (!payment.ok) return payment;
  if (!subyPaymentLooksPaid(payment.data.status)) {
    return { ok: false, error: "Payment is not completed yet." };
  }
  return { ok: true };
}

export async function completeSubyCheckoutSession(
  sessionId: string,
  stamp: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSubySessionId(sessionId)) {
    return { ok: false, error: "Invalid Suby session id." };
  }

  const sql = await getSql();
  const rows = await sql<{ id: number; status: string; donation_id: number | null }>`
    select id, status, donation_id from membership_payments where stripe_session_id = ${sessionId} limit 1
  `;
  const row = rows[0];
  if (!row) return { ok: false, error: "Checkout session not found." };
  if (row.status === "completed" && row.donation_id) return { ok: true };

  const apiKey = resolveSubyApiKey();
  if (!apiKey) return { ok: false, error: "Suby API key is not configured." };

  const polled = sessionId.startsWith("cs_")
    ? await pollSubyV3Session(sessionId, apiKey)
    : await pollSubyV2Payment(sessionId, apiKey);
  if (!polled.ok) return polled;

  const result = await fulfillAccountPayment(row.id, stamp, { externalPaymentId: sessionId });
  if (!result.ok) return result;
  return { ok: true };
}
