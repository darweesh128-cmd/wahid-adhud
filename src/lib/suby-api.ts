import { MEMBERSHIP_USD_CENTS } from "@/lib/membership";

export type SubyApiVersion = "v3" | "v2";

const DEFAULT_V3_BASE = "https://api.beta.suby.fi";
const DEFAULT_V2_BASE = "https://api.suby.fi";

export function resolveSubyApiVersion(): SubyApiVersion {
  const raw = process.env.SUBY_API_VERSION?.trim().toLowerCase();
  return raw === "v3" ? "v3" : "v2";
}

export function subyApiBase(): string {
  const override = process.env.SUBY_API_BASE_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  return resolveSubyApiVersion() === "v2" ? DEFAULT_V2_BASE : DEFAULT_V3_BASE;
}

type SubyEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
};

export async function subyRequest<T>(
  method: "GET" | "POST",
  path: string,
  apiKey: string,
  body?: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const url = `${subyApiBase()}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Suby-Api-Key": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as SubyEnvelope<T> | null;
  const okStatus = response.status === 200 || response.status === 201;
  if (!okStatus || !payload?.success || !payload.data) {
    const message =
      payload?.error?.message ??
      (typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: string }).message)
        : undefined) ??
      `Suby API error (${response.status})`;
    return { ok: false, error: message };
  }

  return { ok: true, data: payload.data };
}

/** Ad-hoc $1 price when `SUBY_PRODUCT_ID` is not set. */
export function resolveSubyPriceCents(): number {
  const raw = process.env.SUBY_PRICE_CENTS?.trim();
  if (raw) {
    const cents = Number(raw);
    if (Number.isFinite(cents) && cents > 0) return Math.round(cents);
  }
  return MEMBERSHIP_USD_CENTS;
}
