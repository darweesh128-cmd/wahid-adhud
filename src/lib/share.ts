import { SHARE_COPY, type Lang } from "@/lib/i18n";

export function pageUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/`;
}

export function shareTitle(lang: Lang = "ar"): string {
  return lang === "ar" ? "واحد · عائلة العضد" : "Wahid · The Adhud";
}

export function shareMessage(lang: Lang = "ar"): string {
  return `${SHARE_COPY[lang]}\n\n${pageUrl()}`;
}

export function whatsappHref(lang: Lang = "ar"): string {
  return `https://wa.me/?text=${encodeURIComponent(shareMessage(lang))}`;
}

export function xHref(lang: Lang = "ar"): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage(lang))}`;
}

export async function nativeShare(lang: Lang = "ar"): Promise<"shared" | "copied" | "closed"> {
  const text = shareMessage(lang);
  const url = pageUrl();
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
