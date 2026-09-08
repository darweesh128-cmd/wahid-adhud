#!/usr/bin/env node
/** Attach to Chrome :9222, extract API key via reveal button, try CARD product create. */
import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";

const REPORT = "/tmp/suby-api-followup.json";
const report = { at: new Date().toISOString(), steps: [] };

function step(name, detail) {
  report.steps.push({ name, detail });
  console.log(name, detail ?? "");
}

let browser;
try {
  browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
} catch (e) {
  step("cdp_error", String(e.message || e));
  await writeFile(REPORT, JSON.stringify(report, null, 2));
  process.exit(1);
}

const context = browser.contexts()[0];
const page = context.pages().find((p) => p.url().includes("suby")) || context.pages()[0];

let apiKey = null;
page.on("request", (req) => {
  const key = req.headers()["x-suby-api-key"];
  if (key?.startsWith("sk_")) apiKey = key;
});

try {
  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 });
  step("url", page.url());

  if (page.url().includes("signin")) {
    step("blocked", "session_expired");
    await writeFile(REPORT, JSON.stringify(report, null, 2));
    process.exit(2);
  }

  const reveal = page.getByRole("button", { name: /reveal|show|copy/i }).first();
  if (await reveal.count()) {
    await reveal.click().catch(() => {});
    await page.waitForTimeout(1500);
  }

  const text = await page.locator("body").innerText();
  const m = text.match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
  if (m) apiKey = m[0];

  step("api_key_found", apiKey ? `${apiKey.slice(0, 14)}…` : false);

  if (!apiKey) {
    step("next", "no_key_visible");
    await writeFile(REPORT, JSON.stringify(report, null, 2));
    process.exit(3);
  }

  const res = await fetch("https://api.suby.fi/api/product/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Suby-Api-Key": apiKey },
    body: JSON.stringify({
      name: "Wahid · Open account · $1",
      description: "One-time $1 USD membership — card / Apple Pay / Google Pay.",
      platform: "WEB",
      paymentMethods: ["CARD"],
      isCustomPrice: true,
      frequencyInDays: null,
    }),
  });
  const payload = await res.json().catch(() => null);
  step("create_card_product", { status: res.status, success: payload?.success, error: payload?.error?.message, id: payload?.data?.id });

  report.productId = payload?.data?.id ?? null;
  report.paymentMethods = payload?.data?.paymentMethods ?? null;
} finally {
  await writeFile(REPORT, JSON.stringify(report, null, 2));
  await browser.close().catch(() => {});
}

console.log(JSON.stringify(report, null, 2));
