#!/usr/bin/env node
/**
 * Suby auth: send OTP (saves session) or verify code (reuses session, no resend).
 *   SUBY_SEND_CODE=1 node scripts/suby-auth-flow.mjs
 *   SUBY_LOGIN_CODE=123456 node scripts/suby-auth-flow.mjs
 */
import { chromium } from "playwright-core";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE?.trim();
const SEND = process.env.SUBY_SEND_CODE === "1";
const STATE = "/tmp/suby-signin-state.json";
const REPORT = "/tmp/suby-setup-report.json";
await mkdir("/tmp/suby-screenshots", { recursive: true });

const hasState = await access(STATE, constants.F_OK).then(() => true).catch(() => false);

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext(
  hasState ? { storageState: STATE } : { viewport: { width: 1400, height: 900 } },
);
const page = await context.newPage();
const report = {};

async function fillEmail() {
  const emailInput = page.locator('input[type="email"]:visible').first();
  if (!(await emailInput.count())) return false;
  await emailInput.evaluate((el, email) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(el, email);
    else el.value = email;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, EMAIL);
  return true;
}

async function enterOtp(code) {
  await page.evaluate(() => {
    const input = [...document.querySelectorAll("input[data-input-otp]")].find((i) => i.offsetParent !== null);
    input?.focus();
  });
  for (const ch of code) await page.keyboard.press(ch);
  await page.waitForTimeout(400);
}

async function completeSetup() {
  let apiKey = null;
  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: /reveal|show|copy/i }).first().click().catch(() => {});
  await page.waitForTimeout(1000);
  const keyMatch = (await page.locator("body").innerText()).match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
  if (keyMatch) apiKey = keyMatch[0];
  report.apiKeyPrefix = apiKey ? `${apiKey.slice(0, 16)}…` : null;

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
    };
  }

  await page.goto("https://app.suby.fi/settings/webhooks", { waitUntil: "networkidle", timeout: 60000 });
  report.webhookOk = (await page.locator("body").innerText()).includes("adhud.xyz/api/suby/webhook");
  await page.goto("https://app.suby.fi/products", { waitUntil: "networkidle", timeout: 60000 });
  const pro = (await page.locator("body").innerText()).match(/pro_[a-z0-9]+/i);
  report.productId = pro?.[0] ?? report.createProduct?.id ?? null;
}

try {
  await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle", timeout: 60000 });
  let body0 = await page.locator("body").innerText();
  let onOtp = /enter verification code/i.test(body0);

  if (SEND) {
    if (!onOtp) await fillEmail();
    await page.getByRole("button", { name: /^send code$/i }).click();
    await page.waitForTimeout(3000);
    await context.storageState({ path: STATE });
    body0 = await page.locator("body").innerText();
    onOtp = /enter verification code/i.test(body0);
    report.action = "code_sent";
    report.otpReady = onOtp;
    if (!CODE) {
      await writeFile(REPORT, JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report));
      process.exit(0);
    }
  }

  if (!CODE || !/^\d{6}$/.test(CODE)) {
    console.error("Set SUBY_LOGIN_CODE or SUBY_SEND_CODE=1");
    process.exit(2);
  }

  if (!onOtp) {
    if (hasState) {
      await page.reload({ waitUntil: "networkidle" });
      body0 = await page.locator("body").innerText();
      onOtp = /enter verification code/i.test(body0);
    }
    if (!onOtp) {
      report.error = "no_otp_session";
      report.hint = "Run SUBY_SEND_CODE=1 then paste the code from that email in the same minute";
      await writeFile(REPORT, JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report));
      process.exit(3);
    }
  }

  await enterOtp(CODE);
  await page.getByRole("button", { name: /^verify$/i }).click();
  await page.waitForTimeout(6000);

  report.url = page.url();
  report.loggedIn = !page.url().includes("signin");
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  report.bodySnippet = body.slice(0, 400);

  if (!report.loggedIn) {
    report.error = /verification failed|expired|invalid/i.test(body) ? "code_rejected" : "still_on_signin";
    await writeFile(REPORT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    process.exit(1);
  }

  report.cardStatus = /under review|being reviewed/i.test(body) ? "under_review" : "unknown";
  await completeSetup();
  await context.storageState({ path: STATE });
  await writeFile(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
