#!/usr/bin/env node
/** Login to Suby with OTP and complete dashboard setup. */
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE?.trim();
const OUT = "/tmp/suby-screenshots";
const REPORT = "/tmp/suby-setup-report.json";
await mkdir(OUT, { recursive: true });

if (!CODE || !/^\d{6}$/.test(CODE)) {
  console.error("SUBY_LOGIN_CODE (6 digits) required");
  process.exit(2);
}

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const report = { email: EMAIL, steps: [] };
let apiKey = null;

page.on("request", (req) => {
  const key = req.headers()["x-suby-api-key"];
  if (key?.startsWith("sk_")) apiKey = key;
});

function log(step, detail) {
  report.steps.push({ step, detail, at: new Date().toISOString() });
  console.log(step, detail ?? "");
}

async function setEmail() {
  const emailInput = page.locator('input[type="email"]:visible').first();
  await emailInput.evaluate((el, email) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    el.focus();
    if (setter) setter.call(el, email);
    else el.value = email;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, EMAIL);
}

async function enterOtp(code) {
  const slot = page.locator('[data-slot="input-otp"]').first();
  if (await slot.count()) await slot.click({ force: true });
  else await page.locator("body").click();
  await page.keyboard.type(code, { delay: 100 });
  await page.waitForTimeout(600);
}

try {
  await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle", timeout: 60000 });
  await setEmail();
  await page.getByRole("button", { name: /^send code$/i }).click();
  await page.waitForTimeout(2500);
  await enterOtp(CODE);
  await page.getByRole("button", { name: /verify/i }).click();
  await page.waitForTimeout(5000);
  log("after_verify_url", page.url());
  await page.screenshot({ path: `${OUT}/suby-after-verify.png`, fullPage: true });

  if (page.url().includes("signin")) {
    const err = await page.locator("body").innerText();
    report.loginFailed = true;
    report.errorSnippet = err.replace(/\s+/g, " ").slice(0, 500);
    if (/full 6-digit|invalid|expired/i.test(err)) throw new Error("OTP rejected — request a fresh code");
    throw new Error("Still on signin");
  }

  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  report.cardStatus = /under review|being reviewed/i.test(body) ? "under_review" : /card.*enabled|approved/i.test(body) ? "approved" : "unknown";

  // API keys
  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  const reveal = page.getByRole("button", { name: /reveal|show|copy/i });
  if (await reveal.count()) await reveal.first().click().catch(() => {});
  await page.waitForTimeout(1000);
  const apiText = await page.locator("body").innerText();
  const keyMatch = apiText.match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
  if (keyMatch) apiKey = keyMatch[0];
  report.apiKeyPrefix = apiKey ? `${apiKey.slice(0, 16)}…` : null;
  log("api_key", report.apiKeyPrefix || "masked");

  // Webhooks
  await page.goto("https://app.suby.fi/settings/webhooks", { waitUntil: "networkidle", timeout: 60000 });
  report.webhookOk = (await page.locator("body").innerText()).includes("adhud.xyz/api/suby/webhook");

  // Try CARD product via API
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
    report.createProduct = {
      status: res.status,
      success: payload?.success,
      id: payload?.data?.id,
      error: payload?.error?.message,
      paymentMethods: payload?.data?.paymentMethods,
    };
    log("create_product", JSON.stringify(report.createProduct));
  }

  await page.goto("https://app.suby.fi/products", { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({ path: `${OUT}/suby-products.png`, fullPage: true });
  const productsText = await page.locator("body").innerText();
  const proMatch = productsText.match(/pro_[a-z0-9]+/i);
  if (proMatch) report.productIdFromUi = proMatch[0];

  await writeFile(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  report.fatal = String(e.message || e);
  await writeFile(REPORT, JSON.stringify(report, null, 2));
  await page.screenshot({ path: `${OUT}/suby-error.png`, fullPage: true }).catch(() => {});
  console.error(report.fatal);
  process.exit(1);
} finally {
  await browser.close();
}
