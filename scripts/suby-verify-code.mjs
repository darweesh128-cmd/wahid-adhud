#!/usr/bin/env node
/**
 * Verify Suby OTP without resending (preserves user-provided code).
 * Prerequisite: user already clicked "Send code" on signin.
 * Usage: SUBY_LOGIN_CODE=123456 node scripts/suby-verify-code.mjs
 */
import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";

const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE?.trim();
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
const report = { codeUsed: CODE.slice(0, 2) + "****" };

try {
  await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle", timeout: 60000 });
  const onOtp = /enter verification code/i.test(await page.locator("body").innerText());

  if (!onOtp) {
    const emailInput = page.locator('input[type="email"]:visible').first();
    await emailInput.evaluate((el, email) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (setter) setter.call(el, email);
      else el.value = email;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, EMAIL);
    report.note = "OTP screen not active — click Send code in Gmail/app, then resend this script with the new code";
    await writeFile("/tmp/suby-setup-report.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    process.exit(3);
  }

  await page.evaluate(() => {
    const input = [...document.querySelectorAll("input[data-input-otp]")].find((i) => i.offsetParent !== null);
    input?.focus();
  });
  for (const ch of CODE) await page.keyboard.press(ch);
  await page.getByRole("button", { name: /^verify$/i }).click();
  await page.waitForTimeout(6000);

  report.url = page.url();
  report.loggedIn = !page.url().includes("signin");
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  report.bodySnippet = body.slice(0, 400);

  if (!report.loggedIn) {
    report.error = /verification failed|expired|invalid/i.test(body) ? "code_rejected" : "still_on_signin";
    await writeFile("/tmp/suby-setup-report.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    process.exit(1);
  }

  report.cardStatus = /under review|being reviewed/i.test(body) ? "under_review" : "unknown";

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

  await writeFile("/tmp/suby-setup-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
