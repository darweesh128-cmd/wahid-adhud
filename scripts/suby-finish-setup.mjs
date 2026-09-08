#!/usr/bin/env node
/** Finish Suby setup: API, webhook, product (cloned session). */
import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";

const PROFILE = "/tmp/chrome-clone";
const OUT = "/tmp/suby-screenshots";
await mkdir(OUT, { recursive: true });
const report = {};
let apiKey = null;

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  viewport: { width: 1400, height: 900 },
});
const page = context.pages()[0] || await context.newPage();

page.on("request", (req) => {
  const k = req.headers()["x-suby-api-key"];
  if (k?.startsWith("sk_")) apiKey = k;
});

try {
  await page.goto("https://app.suby.fi/products", { waitUntil: "networkidle", timeout: 60000 });
  report.loggedIn = !page.url().includes("signin");
  report.cardStatus = /under review|being reviewed/i.test(await page.locator("body").innerText()) ? "under_review" : "unknown";

  // API & Webhooks via sidebar
  await page.getByRole("link", { name: /api.*webhook/i }).first().click({ timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  report.apiUrl = page.url();
  await page.screenshot({ path: `${OUT}/api-webhooks.png`, fullPage: true });

  for (const label of [/reveal/i, /show/i, /copy/i, /view/i]) {
    const btn = page.getByRole("button", { name: label });
    if (await btn.count()) await btn.first().click().catch(() => {});
  }
  await page.waitForTimeout(1000);
  const apiBody = await page.locator("body").innerText();
  const keyMatch = apiBody.match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
  if (keyMatch) apiKey = keyMatch[0];
  report.apiKeyPrefix = apiKey ? `${apiKey.slice(0, 16)}…` : "masked";

  // Webhook
  if (!apiBody.includes("adhud.xyz/api/suby/webhook")) {
    const whInput = page.locator('input').filter({ has: page.locator('[placeholder*="http" i]') }).first();
    const urlField = page.getByPlaceholder(/https/i).or(page.locator('input[type="url"]')).first();
    if (await urlField.count()) {
      await urlField.fill("https://www.adhud.xyz/api/suby/webhook");
      await page.getByRole("button", { name: /save|add|create|update/i }).first().click().catch(() => {});
      await page.waitForTimeout(2000);
    }
  }
  report.webhookOk = (await page.locator("body").innerText()).includes("adhud.xyz/api/suby/webhook");

  // Create product (crypto allowed while CARD pending — code will force CARD at checkout when approved)
  await page.goto("https://app.suby.fi/products/new", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  const oneTime = page.getByRole("button", { name: /one-time/i }).or(page.getByText(/one-time payment/i));
  if (await oneTime.count()) await oneTime.first().click().catch(() => {});

  const nameField = page.getByLabel(/product name/i).or(page.locator('input[name="name"]')).first();
  if (await nameField.count()) await nameField.fill("Wahid · Open account · $1");

  const desc = page.locator("textarea").first();
  if (await desc.count()) {
    await desc.fill("Mutual-aid circle membership — open account for $1; solidarity and trust.");
  }

  const price = page.getByLabel(/^price$/i).or(page.locator('input[name="price"]')).first();
  if (await price.count()) {
    await price.fill("1.00");
  }

  // Enable crypto (only option while CARD pending)
  const cryptoToggle = page.getByText(/^crypto$/i).first();
  if (await cryptoToggle.count()) await cryptoToggle.click().catch(() => {});

  await page.screenshot({ path: `${OUT}/product-form-filled.png`, fullPage: true });

  const publish = page.getByRole("button", { name: /^publish$/i });
  report.publishDisabled = await publish.isDisabled().catch(() => true);
  if (!report.publishDisabled) {
    await publish.click();
    await page.waitForTimeout(5000);
    report.published = true;
  }

  // API create CARD product if key available
  if (apiKey) {
    const res = await fetch("https://api.suby.fi/api/product/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Suby-Api-Key": apiKey },
      body: JSON.stringify({
        name: "Wahid · Open account · $1 (card)",
        description: "One-time $1 USD — card / Apple Pay / Google Pay.",
        platform: "WEB",
        paymentMethods: ["CARD"],
        isCustomPrice: true,
        frequencyInDays: null,
      }),
    });
    const p = await res.json().catch(() => null);
    report.createCardProduct = { status: res.status, id: p?.data?.id, error: p?.error?.message };
  }

  await page.goto("https://app.suby.fi/products", { waitUntil: "networkidle", timeout: 60000 });
  const pros = (await page.locator("body").innerText()).match(/pro_[a-z0-9]+/gi);
  report.productIds = pros ? [...new Set(pros)] : [];
  report.productId = report.createCardProduct?.id || report.productIds[0] || null;

  await writeFile("/tmp/suby-setup-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
}
