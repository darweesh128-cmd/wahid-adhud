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
  (import.meta.env?.VITE_MEMBERSHIP_CHECKOUT_V2 ?? "") !== "false";

/** Server-side mirror of the v2 checkout flag. Default ON unless explicitly false. */
export function isMembershipCheckoutV2Enabled(): boolean {
  const raw =
    process.env.MEMBERSHIP_CHECKOUT_V2 ?? process.env.VITE_MEMBERSHIP_CHECKOUT_V2 ?? "";
  if (raw === "false") return false;
  if (raw === "true") return true;
  return true;
}

export type MembershipProvider = "suby" | "stripe" | "mock";

/**
 * Live payment provider for the $1 membership path.
 * `MEMBERSHIP_PROVIDER=suby|stripe|mock` — when unset, auto-selects suby → stripe → mock.
 */
export function resolveMembershipProvider(): MembershipProvider | null {
  const raw = process.env.MEMBERSHIP_PROVIDER?.trim().toLowerCase();
  if (raw === "suby" || raw === "stripe" || raw === "mock") return raw;
  return null;
}

/**
 * Stripe secret for checkout. Product ships on **test mode** (`sk_test_*`) or mock.
 * `sk_live_*` is ignored unless `ALLOW_STRIPE_LIVE=true` (legacy Stripe path only).
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

/** Suby merchant API key (`sk_live_*` or `sk_sandbox_*`). */
export function resolveSubyApiKey(): string | undefined {
  const value = process.env.SUBY_API_KEY?.trim();
  return value || undefined;
}

/** Suby one-time product id (`pro_…`) or omit and use ad-hoc price (v3). */
export function resolveSubyProductId(): string | undefined {
  const value = process.env.SUBY_PRODUCT_ID?.trim();
  return value || undefined;
}

export function hasSubyConfigured(): boolean {
  return Boolean(resolveSubyApiKey());
}

/**
 * Built-in simulator when v2 is on but no live provider keys are configured.
 * Force with `MEMBERSHIP_CHECKOUT_MOCK=true`.
 */
export function isMockCheckoutEnabled(): boolean {
  if (!isMembershipCheckoutV2Enabled()) return false;
  const explicit = resolveMembershipProvider();
  if (explicit === "mock") return true;
  if (explicit === "suby" || explicit === "stripe") return false;
  if (envTruthy("MEMBERSHIP_CHECKOUT_MOCK")) return true;
  if (process.env.MEMBERSHIP_CHECKOUT_MOCK === "false") return false;
  return !hasSubyConfigured() && !hasStripeSecret();
}

export type CheckoutMode = "suby" | "stripe" | "mock" | "off";

export function checkoutMode(): CheckoutMode {
  if (!isMembershipCheckoutV2Enabled()) return "off";

  const explicit = resolveMembershipProvider();
  if (explicit === "mock") return "mock";
  if (explicit === "suby") return hasSubyConfigured() ? "suby" : "off";
  if (explicit === "stripe") {
    if (hasStripeSecret() && !envTruthy("MEMBERSHIP_CHECKOUT_MOCK")) return "stripe";
    return isMockCheckoutEnabled() ? "mock" : "off";
  }

  if (hasSubyConfigured() && !envTruthy("MEMBERSHIP_CHECKOUT_MOCK")) return "suby";
  if (hasStripeSecret() && !envTruthy("MEMBERSHIP_CHECKOUT_MOCK")) return "stripe";
  if (isMockCheckoutEnabled()) return "mock";
  return "off";
}

export function checkoutAvailable(): boolean {
  const mode = checkoutMode();
  return mode === "suby" || mode === "stripe" || mode === "mock";
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

/** Suby checkout refs: v3 `cs_…` sessions or legacy v2 `pay_…` payments. */
export function isSubySessionId(sessionId: string): boolean {
  return sessionId.startsWith("cs_") || sessionId.startsWith("pay_");
}
