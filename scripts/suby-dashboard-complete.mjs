#!/usr/bin/env node
/** Complete Suby dashboard setup via Chrome CDP (user logged in manually). */
import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";

const OUT = "/tmp/suby-screenshots";
const REPORT = "/tmp/suby-setup-report.json";
await mkdir(OUT, { recursive: true });

const report = { source: "cdp_manual_session" };
let apiKey = null;

async function connect() {
  for (const host of ["127.0.0.1", "localhost"]) {
    try {
      return await chromium.connectOverCDP(`http://${host}:9222`);
    } catch {
      /* try next */
    }
  }
  throw new Error("CDP unavailable on :9222");
}

const browser = await connect();
const context = browser.contexts()[0];
const page = context.pages().find((p) => p.url().includes("suby")) || context.pages()[0];

report.startUrl = page.url();
report.loggedIn = !page.url().includes("signin");

if (!report.loggedIn) {
  await page.goto("https://app.suby.fi/dashboard", { waitUntil: "networkidle", timeout: 60000 });
  report.loggedIn = !page.url().includes("signin");
}

if (!report.loggedIn) {
  report.error = "not_logged_in";
  await writeFile(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  process.exit(2);
}

page.on("request", (req) => {
  const k = req.headers()["x-suby-api-key"];
  if (k?.startsWith("sk_")) apiKey = k;
});

const dashBody = (await page.locator("body").innerText()).replace(/\s+/g, " ");
report.cardStatus = /under review|being reviewed/i.test(dashBody) ? "under_review" : /card.*enabled|approved/i.test(dashBody) ? "approved" : "unknown";
await page.screenshot({ path: `${OUT}/suby-dashboard.png`, fullPage: true });

// API keys
await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 });
await page.getByRole("button", { name: /reveal|show|copy/i }).first().click().catch(() => {});
await page.waitForTimeout(1500);
const apiText = await page.locator("body").innerText();
const keyMatch = apiText.match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
if (keyMatch) apiKey = keyMatch[0];
report.apiKeyPrefix = apiKey ? `${apiKey.slice(0, 16)}…` : "masked";
await page.screenshot({ path: `${OUT}/suby-api.png`, fullPage: true });

// Webhooks
await page.goto("https://app.suby.fi/settings/webhooks", { waitUntil: "networkidle", timeout: 60000 });
const whText = await page.locator("body").innerText();
report.webhookOk = wh.includes("adhud.xyz/api/suby/webhook");
report.webhookNeedsSave = /save|add endpoint/i.test(whText) && !report.webhookOk;
await page.screenshot({ path: `${OUT}/suby-webhooks.png`, fullPage: true });

if (report.webhookNeedsSave) {
  const urlInput = page.locator('input[type="url"], input[placeholder*="http" i]').first();
  if (await urlInput.count()) {
    await urlInput.fill("https://www.adhud.xyz/api/suby/webhook");
    await page.getByRole("button", { name: /save|add|create/i }).first().click().catch(() => {});
    await page.waitForTimeout(2000);
    report.webhookOk = (await page.locator("body").innerText()).includes("adhud.xyz/api/suby/webhook");
  }
}

// Try API product create (CARD)
if (apiKey) {
  const res = await fetch("https://api.suby.fi/api/product/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Suby-Api-Key": apiKey },
    body: JSON.stringify({
      name: "Wahid · Open account · $1",
      description: "One-time $1 USD — card / Apple Pay / Google Pay.",
      platform: "WEB",
      paymentMethods: ["CARD"],
      isCustomPrice: true,
      frequencyInDays: null,
    }),
  });
  const payload = await res.json().catch(() => null);
  report.createCardProduct = {
    status: res.status,
    success: payload?.success,
    id: payload?.data?.id,
    error: payload?.error?.message,
    paymentMethods: payload?.data?.paymentMethods,
  };
}

// Dashboard product form fallback (crypto if CARD blocked)
await page.goto("https://app.suby.fi/products/new", { waitUntil: "networkidle", timeout: 60000 });
await page.screenshot({ path: `${OUT}/suby-product-new.png`, fullPage: true });
const productBody = await page.locator("body").innerText();
report.publishDisabled = await page.getByRole("button", { name: /^publish$/i }).isDisabled().catch(() => true);
report.cardAvailableOnForm = /card/i.test(productBody) && !/under review/i.test(productBody);

// List products
await page.goto("https://app.suby.fi/products", { waitUntil: "networkidle", timeout: 60000 });
const productsText = await page.locator("body").innerText();
const proMatch = productsText.match(/pro_[a-z0-9]+/gi);
report.productIds = proMatch ? [...new Set(proMatch)] : [];
report.productId = report.createCardProduct?.id || report.productIds[0] || null;
await page.screenshot({ path: `${OUT}/suby-products.png`, fullPage: true });

await writeFile(REPORT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
