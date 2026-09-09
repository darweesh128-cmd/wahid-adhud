import { SHARE_COPY, type Lang } from "@/lib/i18n";
import { refSlug } from "@/lib/ref";

export function pageOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/** Join landing URL; optional `ref` is a short wallet hash slug (not the wallet). */
export function pageUrl(ref?: string | null): string {
  const origin = pageOrigin();
  if (!origin) return "/";
  const base = `${origin}/`;
  if (!ref) return base;
  return `${base}?ref=${encodeURIComponent(ref)}`;
}

export function inviteRef(wallet?: string | null): string | null {
  if (!wallet?.trim()) return null;
  return refSlug(wallet);
}

export function shareTitle(lang: Lang = "en"): string {
  return lang === "ar" ? "واحد · عائلة العضد" : "Wahid · The ʿAḍud";
}

export function shareMessage(lang: Lang = "en", ref?: string | null): string {
  return `${SHARE_COPY[lang]}\n\n${pageUrl(ref)}`;
}

export function whatsappHref(lang: Lang = "en", ref?: string | null): string {
  return `https://wa.me/?text=${encodeURIComponent(shareMessage(lang, ref))}`;
}

export const X_PROFILE_HREF = "https://x.com/Adudadid";
export const TIKTOK_PROFILE_HREF = "https://www.tiktok.com/@adud5959";

export function xHref(lang: Lang = "en", ref?: string | null): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage(lang, ref))}`;
}

export async function nativeShare(lang: Lang = "en", ref?: string | null): Promise<"shared" | "copied" | "closed"> {
  const text = shareMessage(lang, ref);
  const url = pageUrl(ref);
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: shareTitle(lang), text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "closed";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return "copied";
  }
}
