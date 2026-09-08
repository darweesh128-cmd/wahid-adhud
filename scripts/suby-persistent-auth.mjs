#!/usr/bin/env node
import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";

const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE?.trim();
const SEND = process.env.SUBY_SEND_CODE === "1";
const PROFILE = "/tmp/suby-chrome-profile";
const REPORT = "/tmp/suby-setup-report.json";

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  viewport: { width: 1400, height: 900 },
});
const page = context.pages()[0] || await context.newPage();
const report = {};

async function fillEmail() {
  const el = page.locator('input[type="email"]:visible').first();
  if (!(await el.count())) return;
  await el.evaluate((input, email) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, email);
    else input.value = email;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, EMAIL);
}

async function onOtpScreen() {
  return /enter verification code/i.test(await page.locator("body").innerText());
}

async function enterOtp(code) {
  await page.evaluate(() => {
    const input = [...document.querySelectorAll("input[data-input-otp]")].find((i) => i.offsetParent !== null);
    input?.focus();
  });
  for (const ch of code) await page.keyboard.press(ch);
}

async function afterLogin() {
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  report.cardStatus = /under review|being reviewed/i.test(body) ? "under_review" : "unknown";
  let apiKey = null;
  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: /reveal|show|copy/i }).first().click().catch(() => {});
  await page.waitForTimeout(1000);
  const m = (await page.locator("body").innerText()).match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
  if (m) apiKey = m[0];
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
    const p = await res.json().catch(() => null);
    report.createProduct = { status: res.status, id: p?.data?.id, error: p?.error?.message };
  }
  await page.goto("https://app.suby.fi/settings/webhooks", { waitUntil: "networkidle", timeout: 60000 });
  report.webhookOk = (await page.locator("body").innerText()).includes("adhud.xyz/api/suby/webhook");
}

try {
  if (!page.url().includes("suby.fi")) {
    await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle", timeout: 60000 });
  }

  if (SEND) {
    if (!(await onOtpScreen())) {
      await fillEmail();
      await page.getByRole("button", { name: /^send code$/i }).click();
      await page.waitForTimeout(3000);
    }
    report.action = "code_sent";
    report.otpReady = await onOtpScreen();
    await writeFile(REPORT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    await context.close();
    process.exit(0);
  }

  if (!CODE) {
    console.error("SUBY_LOGIN_CODE or SUBY_SEND_CODE=1 required");
    process.exit(2);
  }

  if (!(await onOtpScreen())) {
    await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle" });
    if (!(await onOtpScreen())) {
      report.error = "no_otp_screen";
      console.log(JSON.stringify(report));
      process.exit(3);
    }
  }

  await enterOtp(CODE);
  await page.getByRole("button", { name: /^verify$/i }).click();
  await page.waitForTimeout(6000);
  report.loggedIn = !page.url().includes("signin");
  if (!report.loggedIn) {
    report.error = "code_rejected";
    report.body = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300);
    console.log(JSON.stringify(report));
    process.exit(1);
  }
  report.url = page.url();
  await afterLogin();
  console.log(JSON.stringify(report, null, 2));
  await writeFile(REPORT, JSON.stringify(report, null, 2));
} finally {
  await context.close();
}
