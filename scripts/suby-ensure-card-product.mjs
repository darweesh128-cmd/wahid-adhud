#!/usr/bin/env node
/**
 * Ensure a CARD-only Suby membership product exists (v2 API).
 * Usage (names only — set values in shell, never commit):
 *   SUBY_API_KEY=sk_live_... node scripts/suby-ensure-card-product.mjs
 * Optional: SUBY_PRODUCT_ID, SUBY_CARD_PRODUCT_ID, SUBY_PRICE_CENTS=100
 */
const API = (process.env.SUBY_API_BASE_URL || "https://api.suby.fi").replace(/\/$/, "");
const KEY = process.env.SUBY_API_KEY?.trim();
const configured = process.env.SUBY_PRODUCT_ID?.trim();
const cardOverride = process.env.SUBY_CARD_PRODUCT_ID?.trim();
const priceCents = String(process.env.SUBY_PRICE_CENTS?.trim() || "100");

if (!KEY) {
  console.error("SUBY_API_KEY is required.");
  process.exit(1);
}

async function suby(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Suby-Api-Key": KEY },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.error?.message || `HTTP ${res.status}`);
  }
  return payload.data;
}

function isCardOnly(product) {
  const methods = product.paymentMethods ?? [];
  return methods.length === 1 && methods[0] === "CARD";
}

async function main() {
  for (const id of [cardOverride, configured].filter(Boolean)) {
    try {
      const product = await suby("GET", `/api/product/${id}`);
      console.log(`Product ${id}: paymentMethods=${JSON.stringify(product.paymentMethods)}`);
      if (isCardOnly(product)) {
        console.log(`OK — use SUBY_PRODUCT_ID=${id} (CARD only)`);
        return;
      }
    } catch (e) {
      console.warn(`Could not load ${id}:`, e.message);
    }
  }

  console.log("Creating CARD-only custom-price membership product…");
  const created = await suby("POST", "/api/product/create", {
    name: "Wahid · ʿAḍīd membership ($1 card)",
    description: "One-time $1 USD — card / Apple Pay / Google Pay.",
    platform: "WEB",
    paymentMethods: ["CARD"],
    isCustomPrice: true,
    frequencyInDays: null,
  });
  console.log(`Created ${created.id} — set SUBY_CARD_PRODUCT_ID=${created.id}`);
  console.log(`Test payment create with priceCents=${priceCents} USD on checkout.`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
