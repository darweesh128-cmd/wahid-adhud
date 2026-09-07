import { getSql } from "@/lib/db";
import {
  checkoutMode,
  MEMBERSHIP_USD_CENTS,
} from "@/lib/membership";
import { activateAccountMembership, cardCheckoutAmountUsdt } from "@/lib/membership-activate";
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

export type FulfillPaymentOptions = {
  externalPaymentId?: string | null;
};

export async function fulfillAccountPayment(
  paymentId: number,
  stamp: string,
  options: FulfillPaymentOptions = {},
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

  const mode = checkoutMode();
  const externalId =
    options.externalPaymentId ??
    (mode === "mock" ? `mock_pi_${paymentId}` : null);

  await sql`
    update membership_payments
    set
      status = 'completed',
      donation_id = ${activation.donationId ?? null},
      stripe_payment_intent_id = ${externalId},
      completed_at = now()
    where id = ${payment.id}
  `;

  return { ok: true, username, donationId: activation.donationId };
}

export async function insertPendingMembershipPayment(input: {
  accountId: number;
  username: string;
  country: string;
  ref: string | null;
  stamp: string;
}): Promise<number | null> {
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

export function appOrigin(requestOrigin?: string): string {
  const fromEnv = process.env.BETTER_AUTH_URL?.trim() || process.env.VITE_PUBLIC_HOSTNAME?.trim();
  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv.replace(/\/$/, "") : `https://${fromEnv}`;
  }
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return "http://localhost:8080";
}

export type PaymentRowStatus = Pick<PaymentRow, "id" | "status" | "donation_id" | "username">;

export async function loadMembershipPaymentBySession(sessionId: string): Promise<PaymentRow | null> {
  const sql = await getSql();
  const rows = await sql<PaymentRow>`
    select id, stripe_session_id, payout_wallet, country, status, donation_id, account_id, username, ref_slug
    from membership_payments
    where stripe_session_id = ${sessionId}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function loadMembershipPaymentById(paymentId: number): Promise<PaymentRowStatus | null> {
  const sql = await getSql();
  const rows = await sql<PaymentRowStatus>`
    select id, status, donation_id, username from membership_payments where id = ${paymentId} limit 1
  `;
  return rows[0] ?? null;
}

export async function setMembershipPaymentSessionId(paymentId: number, sessionId: string): Promise<void> {
  const sql = await getSql();
  await sql`
    update membership_payments
    set stripe_session_id = ${sessionId}
    where id = ${paymentId}
  `;
}
