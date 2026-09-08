#!/usr/bin/env node
/** Verify Suby OTP using saved session — never resends. */
import { chromium } from "playwright-core";
import { writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const CODE = process.env.SUBY_LOGIN_CODE?.trim();
const STATE = "/tmp/suby-signin-state.json";
const EMAIL = "darweesh128@gmail.com";
const REPORT = "/tmp/suby-setup-report.json";

if (!CODE || !/^\d{6}$/.test(CODE)) {
  console.error("SUBY_LOGIN_CODE required");
  process.exit(2);
}

const hasState = await access(STATE, constants.F_OK).then(() => true).catch(() => false);

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext(
  hasState ? { storageState: STATE, viewport: { width: 1400, height: 900 } } : { viewport: { width: 1400, height: 900 } },
);
const page = await context.newPage();
const report = { code: CODE.slice(0, 2) + "****" };

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
  await page.goto("https://app.suby.fi/products", { waitUntil: "networkidle", timeout: 60000 });
  const pro = (await page.locator("body").innerText()).match(/pro_[a-z0-9]+/i);
  report.productId = pro?.[0] ?? report.createProduct?.id ?? null;
}

try {
  await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle", timeout: 60000 });
  let onOtp = /enter verification code/i.test(await page.locator("body").innerText());

  if (!onOtp) {
    report.error = "no_otp_screen";
    report.hint = "session expired — need fresh send then new code";
    console.log(JSON.stringify(report));
    process.exit(3);
  }

  await enterOtp(CODE);
  await page.getByRole("button", { name: /^verify$/i }).click();
  await page.waitForTimeout(7000);

  report.url = page.url();
  report.loggedIn = !page.url().includes("signin");
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");

  if (!report.loggedIn) {
    report.error = /verification failed|invalid|expired/i.test(body) ? "code_rejected" : "still_on_signin";
    report.body = body.slice(0, 300);
    await writeFile(REPORT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    process.exit(1);
  }

  await afterLogin();
  await context.storageState({ path: STATE });
  await writeFile(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
