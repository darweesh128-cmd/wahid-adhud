/** $1 USD membership price for the v2 card checkout path. */
export const MEMBERSHIP_USD_CENTS = 100;

/** Pool credit applied when a member joins via $1 card checkout. */
export const MEMBERSHIP_UNIT_USDT = 1;

const TRUTHY = new Set(["true", "1", "yes"]);

function envTruthy(key: string): boolean {
  const raw = process.env[key]?.trim().toLowerCase();
  return raw ? TRUTHY.has(raw) : false;
}

/**
 * When true, show the $1 account + card checkout path alongside legacy 5 USDT.
 * Set `VITE_MEMBERSHIP_CHECKOUT_V2=true` in deploy env (and `.grok/app-env.json` for local builds).
 */
export const membershipCheckoutV2 =
  import.meta.env.VITE_MEMBERSHIP_CHECKOUT_V2 === "true";

/** Server-side mirror of the v2 checkout flag. */
export function isMembershipCheckoutV2Enabled(): boolean {
  const raw =
    process.env.MEMBERSHIP_CHECKOUT_V2 ?? process.env.VITE_MEMBERSHIP_CHECKOUT_V2 ?? "";
  return raw === "true";
}

/**
 * Stripe secret for checkout. Product ships on **test mode** (`sk_test_*`) or mock.
 * `sk_live_*` is ignored unless `ALLOW_STRIPE_LIVE=true` (CEO-requested go-live only).
 */
export function resolveStripeSecretKey(): string | undefined {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  if (!value) return undefined;
  if (value.startsWith("sk_live_") && !envTruthy("ALLOW_STRIPE_LIVE")) {
    return undefined;
  }
  return value;
}

/** True when a usable Stripe **test** secret is configured. */
export function hasStripeSecret(): boolean {
  return Boolean(resolveStripeSecretKey());
}

/**
 * Built-in simulator when v2 is on but Stripe is not configured yet.
 * Force with `MEMBERSHIP_CHECKOUT_MOCK=true`; otherwise auto when no `STRIPE_SECRET_KEY`.
 */
export function isMockCheckoutEnabled(): boolean {
  if (!isMembershipCheckoutV2Enabled()) return false;
  if (envTruthy("MEMBERSHIP_CHECKOUT_MOCK")) return true;
  if (envTruthy("MEMBERSHIP_CHECKOUT_MOCK") === false && process.env.MEMBERSHIP_CHECKOUT_MOCK === "false") {
    return false;
  }
  return !hasStripeSecret();
}

export type CheckoutMode = "stripe" | "mock" | "off";

export function checkoutMode(): CheckoutMode {
  if (!isMembershipCheckoutV2Enabled()) return "off";
  if (hasStripeSecret() && !envTruthy("MEMBERSHIP_CHECKOUT_MOCK")) return "stripe";
  if (isMockCheckoutEnabled()) return "mock";
  return "off";
}

export function mockSessionId(paymentId: number): string {
  return `mock_cs_${paymentId}`;
}

export function isMockSessionId(sessionId: string): boolean {
  return sessionId.startsWith("mock_cs_");
}

export function paymentIdFromMockSession(sessionId: string): number | null {
  if (!isMockSessionId(sessionId)) return null;
  const id = Number(sessionId.slice("mock_cs_".length));
  return Number.isFinite(id) && id > 0 ? id : null;
}
