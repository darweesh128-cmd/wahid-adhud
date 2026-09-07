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
 * Default ON for production; set `VITE_MEMBERSHIP_CHECKOUT_V2=false` to disable.
 */
export const membershipCheckoutV2 =
  import.meta.env.VITE_MEMBERSHIP_CHECKOUT_V2 !== "false";

/** Server-side mirror of the v2 checkout flag. Default ON unless explicitly false. */
export function isMembershipCheckoutV2Enabled(): boolean {
  const raw =
    process.env.MEMBERSHIP_CHECKOUT_V2 ?? process.env.VITE_MEMBERSHIP_CHECKOUT_V2 ?? "";
  if (raw === "false") return false;
  if (raw === "true") return true;
  return true;
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

/** True when Lemon Squeezy API credentials are configured for live checkout. */
export function hasLemonConfigured(): boolean {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID?.trim();
  return Boolean(apiKey && storeId && variantId);
}

/**
 * Optional override: `lemon`, `stripe`, or `mock`.
 * When unset, auto-selects lemon → stripe → mock.
 */
export function paymentProviderOverride(): "lemon" | "stripe" | "mock" | null {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (raw === "lemon" || raw === "stripe" || raw === "mock") return raw;
  return null;
}

export type CheckoutMode = "lemon" | "stripe" | "mock" | "off";

export function checkoutMode(): CheckoutMode {
  if (!isMembershipCheckoutV2Enabled()) return "off";
  const override = paymentProviderOverride();
  if (override === "mock") return "mock";
  if (override === "stripe") {
    if (hasStripeSecret()) return "stripe";
    if (isMockCheckoutEnabled()) return "mock";
    return "off";
  }
  if (override === "lemon") {
    if (hasLemonConfigured()) return "lemon";
    return "off";
  }
  if (hasLemonConfigured()) return "lemon";
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

const LEMON_SESSION_PREFIX = "lemon_cs_";

export function lemonSessionId(paymentId: number): string {
  return `${LEMON_SESSION_PREFIX}${paymentId}`;
}

export function isLemonSessionId(sessionId: string): boolean {
  return sessionId.startsWith(LEMON_SESSION_PREFIX);
}

export function paymentIdFromLemonSession(sessionId: string): number | null {
  if (!isLemonSessionId(sessionId)) return null;
  const id = Number(sessionId.slice(LEMON_SESSION_PREFIX.length));
  return Number.isFinite(id) && id > 0 ? id : null;
}
