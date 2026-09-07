import Stripe from "stripe";
import { getSql } from "@/lib/db";
import {
  MEMBERSHIP_USD_CENTS,
  checkoutMode,
  hasStripeSecret,
  isLemonSessionId,
  isMembershipCheckoutV2Enabled,
  isMockCheckoutEnabled,
  isMockSessionId,
  mockSessionId,
  paymentIdFromLemonSession,
  paymentIdFromMockSession,
  resolveStripeSecretKey,
} from "@/lib/membership";
import { activateAccountMembership, cardCheckoutAmountUsdt } from "@/lib/membership-activate";
import { isCountry } from "@/lib/pool";
import { loadSnapshot } from "@/lib/pool-snapshot";

type PaymentRow = {
  id: number;
  stripe_session_id: string | null;
  payout_wallet: string | null;
  country: string;
  status: string;
  donation_id: number | null;
  account_id: number | null;
  username: string | null;
  ref_slug: string | null;
};

function stripeSecretKey(): string | undefined {
  return resolveStripeSecretKey();
}

function stripeWebhookSecret(): string | undefined {
  const value = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return value || undefined;
}

function stripePriceId(): string | undefined {
  const value = process.env.STRIPE_PRICE_ID?.trim();
  return value || undefined;
}

export function getStripeClient(): Stripe | null {
  const key = stripeSecretKey();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export function stripeCheckoutConfigured(): boolean {
  return hasStripeSecret();
}

export function checkoutAvailable(): boolean {
  const mode = checkoutMode();
  return mode === "stripe" || mode === "mock" || mode === "lemon";
}

function appOrigin(requestOrigin?: string): string {
  const fromEnv = process.env.BETTER_AUTH_URL?.trim() || process.env.VITE_PUBLIC_HOSTNAME?.trim();
  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv.replace(/\/$/, "") : `https://${fromEnv}`;
  }
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return "http://localhost:8080";
}

export type CreateAccountCheckoutInput = {
  accountId: number;
  username: string;
  country: string;
  setupToken: string;
  ref: string | null;
  stamp: string;
  origin?: string;
};

export type CreateCheckoutResult =
  | { ok: true; url: string; sessionId: string; mode: "stripe" | "mock" | "lemon" }
  | { ok: false; error: string };

async function insertPendingPayment(input: CreateAccountCheckoutInput): Promise<number | null> {
  const sql = await getSql();
  const pending = await sql<{ id: number }>`
    insert into membership_payments (
      account_id, username, country, amount_cents, currency, status, ref_slug, client_stamp
    )
    values (
      ${input.accountId},
      ${input.username},
      ${input.country},
      ${MEMBERSHIP_USD_CENTS},
      'usd',
      'pending',
      ${input.ref},
      ${input.stamp}
    )
    returning id
  `;
  return pending[0]?.id ?? null;
}

export async function createMembershipCheckoutForAccount(
  input: CreateAccountCheckoutInput,
): Promise<CreateCheckoutResult> {
  if (!isMembershipCheckoutV2Enabled()) {
    return { ok: false, error: "Card checkout is not enabled yet." };
  }
  if (!checkoutAvailable()) {
    return { ok: false, error: "Checkout is not configured." };
  }
  if (!isCountry(input.country)) {
    return { ok: false, error: "Pick a valid country." };
  }

  const sql = await getSql();
  const accountRows = await sql<{ id: number; username: string; status: string; setup_token: string }>`
    select id, username, status, setup_token
    from adhud_accounts
    where id = ${input.accountId} and setup_token = ${input.setupToken}
    limit 1
  `;
  const account = accountRows[0];
  if (!account) return { ok: false, error: "Account not found or session expired." };
  if (account.status === "active") {
    return { ok: false, error: "This account is already active." };
  }

  const paymentId = await insertPendingPayment(input);
  if (!paymentId) return { ok: false, error: "Could not start checkout." };

  const origin = appOrigin(input.origin);
  const mode = checkoutMode();

  if (mode === "lemon") {
    const { createLemonCheckoutForPayment } = await import("@/lib/lemon-checkout");
    return createLemonCheckoutForPayment(input, paymentId, origin);
  }

  if (mode === "mock") {
    const sessionId = mockSessionId(paymentId);
    await sql`
      update membership_payments
      set stripe_session_id = ${sessionId}
      where id = ${paymentId}
    `;
    const url = `${origin}/checkout/mock?pid=${paymentId}&token=${encodeURIComponent(input.setupToken)}`;
    return { ok: true, url, sessionId, mode: "mock" };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured. Set STRIPE_SECRET_KEY or use mock mode." };
  }

  const priceId = stripePriceId();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "usd",
            unit_amount: MEMBERSHIP_USD_CENTS,
            product_data: {
              name: "Wahid · ʿAḍīd membership",
              description: `One dollar to join The ʿAḍud as @${input.username}.`,
            },
          },
          quantity: 1,
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled#join`,
    client_reference_id: String(paymentId),
    metadata: {
      account_id: String(input.accountId),
      username: input.username,
      country: input.country,
      ref_slug: input.ref ?? "",
      payment_id: String(paymentId),
    },
  });

  if (!session.url || !session.id) {
    return { ok: false, error: "Stripe did not return a checkout URL." };
  }

  await sql`
    update membership_payments
    set stripe_session_id = ${session.id}
    where id = ${paymentId}
  `;

  return { ok: true, url: session.url, sessionId: session.id, mode: "stripe" };
}

export async function fulfillAccountPayment(
  paymentId: number,
  stamp: string,
): Promise<{ ok: true; username: string; donationId?: number } | { ok: false; error: string }> {
  const sql = await getSql();
  const existing = await sql<PaymentRow>`
    select id, stripe_session_id, payout_wallet, country, status, donation_id, account_id, username, ref_slug
    from membership_payments
    where id = ${paymentId}
    limit 1
    for update
  `;
  const payment = existing[0];
  if (!payment) return { ok: false, error: "Payment not found." };
  if (payment.status === "completed" && payment.donation_id) {
    return { ok: true, username: payment.username ?? "" };
  }

  const accountId = Number(payment.account_id ?? 0);
  const username = (payment.username ?? "").trim();
  if (!accountId || !username) {
    return { ok: false, error: "Payment is missing account metadata." };
  }

  const ref = payment.ref_slug;
  const activation = await activateAccountMembership(
    {
      accountId,
      username,
      country: payment.country,
      ref,
      stamp,
      amountUsdt: cardCheckoutAmountUsdt,
    },
    loadSnapshot,
  );
  if (!activation.ok) return activation;

  await sql`
    update membership_payments
    set
      status = 'completed',
      donation_id = ${activation.donationId ?? null},
      stripe_payment_intent_id = ${isMockCheckoutEnabled() ? `mock_pi_${paymentId}` : null},
      completed_at = now()
    where id = ${payment.id}
  `;

  return { ok: true, username, donationId: activation.donationId };
}

export async function completeMockCheckout(
  paymentId: number,
  setupToken: string,
  stamp: string,
): Promise<{ ok: true; sessionId: string; username: string } | { ok: false; error: string }> {
  if (!isMockCheckoutEnabled()) {
    return { ok: false, error: "Mock checkout is not enabled." };
  }
  const sql = await getSql();
  const rows = await sql<{ account_id: number | null; setup_token: string | null }>`
    select p.account_id, a.setup_token
    from membership_payments p
    join adhud_accounts a on a.id = p.account_id
    where p.id = ${paymentId}
    limit 1
  `;
  const row = rows[0];
  if (!row?.account_id || row.setup_token !== setupToken) {
    return { ok: false, error: "Invalid checkout session." };
  }

  const result = await fulfillAccountPayment(paymentId, stamp);
  if (!result.ok) return result;
  return { ok: true, sessionId: mockSessionId(paymentId), username: result.username };
}

export async function completeCheckoutSession(sessionId: string, stamp: string): Promise<{
  ok: boolean;
  status: "pending" | "completed" | "failed" | "missing";
  username?: string;
  error?: string;
}> {
  if (isLemonSessionId(sessionId)) {
    const { completeLemonCheckoutSession } = await import("@/lib/lemon-checkout");
    const result = await completeLemonCheckoutSession(sessionId, stamp);
    return { ok: result.ok, status: result.status, username: result.username, error: result.error };
  }

  if (isMockSessionId(sessionId)) {
    const paymentId = paymentIdFromMockSession(sessionId);
    if (!paymentId) return { ok: false, status: "missing", error: "Invalid mock session." };
    const sql = await getSql();
    const rows = await sql<PaymentRow>`
      select id, status, donation_id, username from membership_payments where id = ${paymentId} limit 1
    `;
    const row = rows[0];
    if (!row) return { ok: false, status: "missing", error: "Checkout session not found." };
    if (row.status === "completed" && row.donation_id) {
      return { ok: true, status: "completed", username: row.username ?? undefined };
    }
    return { ok: false, status: "pending", username: row.username ?? undefined };
  }

  const sql = await getSql();
  const rows = await sql<PaymentRow>`
    select id, stripe_session_id, payout_wallet, country, status, donation_id, account_id, username
    from membership_payments
    where stripe_session_id = ${sessionId}
    limit 1
  `;
  const row = rows[0];
  if (!row) return { ok: false, status: "missing", error: "Checkout session not found." };
  if (row.status === "completed" && row.donation_id) {
    return { ok: true, status: "completed", username: row.username ?? undefined };
  }

  const stripe = getStripeClient();
  if (!stripe) return { ok: false, status: "pending", error: "Stripe is not configured." };

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return { ok: false, status: "pending", username: row.username ?? undefined };
  }

  const result = await fulfillPaidCheckoutSession(session, stamp);
  if (!result.ok) return { ok: false, status: "failed", error: result.error };
  return { ok: true, status: "completed", username: row.username ?? undefined };
}

export async function handleStripeWebhook(rawBody: string, signature: string | null): Promise<Response> {
  const secret = stripeWebhookSecret();
  const stripe = getStripeClient();
  if (!secret || !stripe) {
    return new Response("Stripe webhook not configured", { status: 503 });
  }
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe] webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await fulfillPaidCheckoutSession(session, "stripe-webhook");
    if (!result.ok) {
      console.error("[stripe] fulfill failed:", result.error);
      return new Response(result.error ?? "Fulfillment failed", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function fulfillPaidCheckoutSession(
  session: Stripe.Checkout.Session,
  stamp: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (session.payment_status !== "paid") {
    return { ok: false, error: "Checkout session is not paid." };
  }

  const paymentId = Number(session.metadata?.payment_id ?? session.client_reference_id ?? 0);
  if (!paymentId) return { ok: false, error: "Missing payment id in session." };

  const result = await fulfillAccountPayment(paymentId, stamp);
  if (!result.ok) return result;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  if (paymentIntentId) {
    const sql = await getSql();
    await sql`
      update membership_payments set stripe_payment_intent_id = ${paymentIntentId} where id = ${paymentId}
    `;
  }

  return { ok: true };
}
