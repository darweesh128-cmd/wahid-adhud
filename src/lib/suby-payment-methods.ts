/** Suby v2 product / checkout payment rails (see Suby docs: paymentMethods on product create). */
export type SubyPaymentMethod = "CARD" | "CRYPTO";

export type SubyProductPaymentConfig = {
  paymentMethods?: SubyPaymentMethod[];
};

const DEFAULT_MEMBERSHIP_PAYMENT_METHODS: SubyPaymentMethod[] = ["CARD"];

/**
 * Payment methods sent on Suby checkout (v2 `POST /api/payment/create`, best-effort)
 * and enforced on auto-provisioned membership products.
 * Default `CARD` only — customer pays by card / Apple Pay / Google Pay; merchant receives USDC.
 * Override with `SUBY_PAYMENT_METHODS=CARD` or `CARD,CRYPTO` (comma-separated).
 */
export function resolveSubyPaymentMethods(): SubyPaymentMethod[] {
  const raw = process.env.SUBY_PAYMENT_METHODS?.trim();
  if (!raw) return DEFAULT_MEMBERSHIP_PAYMENT_METHODS;

  const parsed = raw
    .split(/[,\s]+/)
    .map((part) => part.trim().toUpperCase())
    .filter((part): part is SubyPaymentMethod => part === "CARD" || part === "CRYPTO");

  return parsed.length > 0 ? parsed : DEFAULT_MEMBERSHIP_PAYMENT_METHODS;
}

export function subyProductSupportsPaymentMethods(
  product: SubyProductPaymentConfig,
  required: SubyPaymentMethod[],
): boolean {
  const enabled = new Set(product.paymentMethods ?? []);
  return required.every((method) => enabled.has(method));
}

export function subyProductIsCardFirst(product: SubyProductPaymentConfig): boolean {
  const methods = product.paymentMethods ?? [];
  if (!methods.includes("CARD")) return false;
  if (!methods.includes("CRYPTO")) return true;
  return methods.indexOf("CARD") < methods.indexOf("CRYPTO");
}
