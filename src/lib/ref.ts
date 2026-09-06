/** Session key for soft `?ref=` attribution — no accounts, no PII. */
export const REF_STORAGE_KEY = "waahid-ref";

/** Deterministic short slug from a wallet (for share links only). */
export function refSlug(wallet: string): string {
  const normalized = wallet.trim();
  let h = 5381;
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) + h) ^ normalized.charCodeAt(i);
  }
  return Math.abs(h).toString(36).slice(0, 8);
}

export function isRefSlug(value: string): boolean {
  return /^[a-z0-9]{4,12}$/i.test(value);
}

/** Persist `?ref=` from the landing URL for the next join on this device. */
export function captureRefFromSearch(search: string): void {
  if (typeof window === "undefined") return;
  try {
    const ref = new URLSearchParams(search).get("ref")?.trim().toLowerCase();
    if (!ref || !isRefSlug(ref)) return;
    sessionStorage.setItem(REF_STORAGE_KEY, ref);
  } catch {
    /* ignore */
  }
}

export function getStoredRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const ref = sessionStorage.getItem(REF_STORAGE_KEY)?.trim().toLowerCase();
    return ref && isRefSlug(ref) ? ref : null;
  } catch {
    return null;
  }
}
