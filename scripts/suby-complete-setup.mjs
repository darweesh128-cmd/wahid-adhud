#!/usr/bin/env node
/**
 * Complete Suby dashboard setup after OTP is available.
 * Usage: SUBY_LOGIN_CODE=123456 node scripts/suby-complete-setup.mjs
 */
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE?.trim();
const OUT = "/tmp/suby-screenshots";
const REPORT = "/tmp/suby-setup-report.json";
await mkdir(OUT, { recursive: true });

if (!CODE || !/^\d{6}$/.test(CODE)) {
  console.error("SUBY_LOGIN_CODE (6 digits) is required.");
  process.exit(2);
}

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const report = { email: EMAIL, steps: [] };

function log(step, detail) {
  report.steps.push({ step, detail, at: new Date().toISOString() });
  console.log(step, detail || "");
}

try {
  await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle", timeout: 60000 });
  const emailInput = page.locator('input[type="email"]:visible').first();
  await emailInput.evaluate((el, email) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    el.focus();
    if (setter) setter.call(el, email);
    else el.value = email;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, EMAIL);
  await page.getByRole("button", { name: /^send code$/i }).click();
  await page.waitForTimeout(2000);

  const otp = page.locator('input[inputmode="numeric"], input[autocomplete="one-time-code"], input[maxlength="6"]').first();
  await otp.waitFor({ state: "visible", timeout: 15000 });
  await otp.fill(CODE);
  await page.getByRole("button", { name: /verify/i }).click();
  await page.waitForURL(/dashboard|products|onboarding/i, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  log("login", page.url());

  await page.screenshot({ path: `${OUT}/suby-after-login.png`, fullPage: true });
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  report.dashboardSnippet = body.slice(0, 2500);

  const cardReview = /under review|card request|verification/i.test(body);
  const cardApproved = /card payments.*enabled|card.*approved/i.test(body);
  report.cardStatus = cardApproved ? "approved" : cardReview ? "under_review" : "unknown";

  // Navigate product creation
  await page.goto("https://app.suby.fi/products/new", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/suby-product-new.png`, fullPage: true });
  const productBody = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  report.productPageSnippet = productBody.slice(0, 1500);

  const publishDisabled = await page.getByRole("button", { name: /^publish$/i }).isDisabled().catch(() => true);
  report.publishDisabled = publishDisabled;

  // API keys page
  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  if (page.url().includes("api")) {
    await page.screenshot({ path: `${OUT}/suby-api-keys.png`, fullPage: true });
    const apiText = await page.locator("body").innerText();
    const keyMatch = apiText.match(/sk_(live|sandbox)_[a-zA-Z0-9]{4,}/);
    report.apiKeyPrefix = keyMatch ? `${keyMatch[0].slice(0, 12)}…` : null;
    report.hasApiKey = /sk_(live|sandbox)_/.test(apiText);
  }

  // Webhooks
  await page.goto("https://app.suby.fi/settings/webhooks", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  if (page.url().includes("webhook")) {
    await page.screenshot({ path: `${OUT}/suby-webhooks.png`, fullPage: true });
    const wh = await page.locator("body").innerText();
    report.webhookConfigured = wh.includes("adhud.xyz/api/suby/webhook");
  }

  await writeFile(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
