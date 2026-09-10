/** Public Adhud surfaces are offline while the message is rewritten. */

function flagOn(value: unknown): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function isPublicHidden(env: Record<string, string | undefined> = process.env): boolean {
  if (flagOn(env.PUBLIC_HIDDEN) || flagOn(env.VITE_PUBLIC_HIDDEN)) return true;
  try {
    return flagOn(import.meta.env?.VITE_PUBLIC_HIDDEN);
  } catch {
    return false;
  }
}
