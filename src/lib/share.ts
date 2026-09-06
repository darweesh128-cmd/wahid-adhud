export const SHARE_TITLE = "Wahid · The Adhud";

export const SHARE_BODY = `You may be fine today.
Someone else is not.

Pay $1 USDT.
Become an Adhud.

Do not join to take.
Join because you are someone's arm.

Wahid · The Adhud`;

export function pageUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/`;
}

export function shareMessage(): string {
  return `${SHARE_BODY}\n\n${pageUrl()}`;
}

export function whatsappHref(): string {
  return `https://wa.me/?text=${encodeURIComponent(shareMessage())}`;
}

export function xHref(): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage())}`;
}

export async function nativeShare(): Promise<"shared" | "copied" | "closed"> {
  const text = shareMessage();
  const url = pageUrl();
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: SHARE_TITLE, text, url });
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
