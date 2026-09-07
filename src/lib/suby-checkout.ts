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
import { verifySubyWebhookSignature as verifySignature } from "@/lib/suby-webhook-verify";

const DEFAULT_SUBY_API_BASE = "https://api.suby.fi";

type SubyEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
};

type SubyCreatePaymentData = {
  paymentId: string;
  paymentUrl: string;
};

type SubyPaymentRecord = {
  id: string;
  status: string;
};

type SubyWebhookEvent = {
  id: string;
  type: string;
  createdAt: string;
  data: {
    payment: {
      id: string;
      status: string;
    };
    context: {
      externalRef: string | null;
      metadata: Record<string, unknown> | null;
      successUrl: string | null;
      cancelUrl: string | null;
    };
  };
};

const SUBY_PAID_STATUSES = new Set([
  "SUCCEEDED",
  "SUCCESS",
  "SETTLED",
  "PAID",
  "COMPLETED",
  "CHECKOUT_SUCCESS",
]);

const SUBY_FULFILL_EVENTS = new Set(["CHECKOUT_SUCCESS", "PAYMENT_SUCCESS"]);

function subyApiBase(): string {
  const raw = process.env.SUBY_API_BASE_URL?.trim();
  return (raw || DEFAULT_SUBY_API_BASE).replace(/\/$/, "");
}

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

async function subyRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const apiKey = resolveSubyApiKey();
  if (!apiKey) return { ok: false, error: "Suby API key is not configured." };

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
  if (!response.ok || !payload?.success || !payload.data) {
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

export async function createSubyPayment(
  input: CreateSubyCheckoutInput,
): Promise<{ ok: true; url: string; sessionId: string } | { ok: false; error: string }> {
  if (!isMembershipCheckoutV2Enabled() || checkoutMode() !== "suby") {
    return { ok: false, error: "Suby checkout is not enabled." };
  }
  const productId = resolveSubyProductId();
  if (!productId) {
    return { ok: false, error: "Suby product id is not configured (SUBY_PRODUCT_ID)." };
  }

  const created = await subyRequest<SubyCreatePaymentData>("POST", "/api/payment/create", {
    productId,
    externalRef: String(input.paymentId),
    metadata: {
      payment_id: String(input.paymentId),
      account_id: String(input.accountId),
      username: input.username,
      country: input.country,
      ref_slug: input.ref ?? "",
    },
    successUrl: `${input.origin}/?checkout=success&session_id={PAYMENT_ID}`,
    cancelUrl: `${input.origin}/?checkout=cancelled#join`,
  });
  if (!created.ok) return created;

  const sessionId = created.data.paymentId;
  const url = created.data.paymentUrl.includes("{PAYMENT_ID}")
    ? created.data.paymentUrl.replace("{PAYMENT_ID}", sessionId)
    : created.data.paymentUrl;
  return { ok: true, url, sessionId };
}

function paymentIdFromSubyEvent(event: SubyWebhookEvent): number | null {
  const fromRef = Number(event.data.context.externalRef ?? 0);
  if (Number.isFinite(fromRef) && fromRef > 0) return fromRef;
  const meta = event.data.context.metadata ?? {};
  const fromMeta = Number(meta.payment_id ?? 0);
  return Number.isFinite(fromMeta) && fromMeta > 0 ? fromMeta : null;
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

  let event: SubyWebhookEvent;
  try {
    event = JSON.parse(rawBody) as SubyWebhookEvent;
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

  const paymentId = paymentIdFromSubyEvent(event);
  if (!paymentId) {
    console.error("[suby] webhook missing payment id:", event.id);
    return new Response("Missing payment reference", { status: 400 });
  }

  const result = await fulfillAccountPayment(paymentId, "suby-webhook", {
    externalPaymentId: event.data.payment.id,
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

  const payment = await subyRequest<SubyPaymentRecord>("GET", `/api/payment/${sessionId}`);
  if (!payment.ok) return payment;
  if (!subyPaymentLooksPaid(payment.data.status)) {
    return { ok: false, error: "Payment is not completed yet." };
  }

  const result = await fulfillAccountPayment(row.id, stamp, { externalPaymentId: sessionId });
  if (!result.ok) return result;
  return { ok: true };
}
