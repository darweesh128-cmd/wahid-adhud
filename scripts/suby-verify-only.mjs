#!/usr/bin/env node
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const CODE = process.env.SUBY_LOGIN_CODE?.trim();
const EMAIL = "darweesh128@gmail.com";
const OUT = "/tmp/suby-screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const report = {};
let apiKey = null;
page.on("request", (r) => {
  const k = r.headers()["x-suby-api-key"];
  if (k?.startsWith("sk_")) apiKey = k;
});

try {
  await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle", timeout: 60000 });
  let body = await page.locator("body").innerText();

  if (!/enter verification code/i.test(body)) {
    const emailInput = page.locator('input[type="email"]:visible').first();
    await emailInput.evaluate((el, email) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (setter) setter.call(el, email);
      else el.value = email;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, EMAIL);
    report.sentCode = false;
    report.note = "OTP screen not shown — not resending to preserve user code";
  }

  // Focus OTP group and type digits (works with shadcn input-otp)
  const otpBox = page.locator('[data-slot="input-otp"], [data-input-otp]').first();
  await otpBox.click({ force: true, timeout: 5000 }).catch(() => page.locator("body").click());
  await page.keyboard.press("Control+a");
  await page.keyboard.type(CODE, { delay: 100 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/suby-otp-filled.png`, fullPage: true });

  await page.getByRole("button", { name: /^verify$/i }).click();
  await page.waitForTimeout(6000);
  report.url = page.url();
  report.loggedIn = !page.url().includes("signin");
  body = await page.locator("body").innerText();
  report.bodySnippet = body.replace(/\s+/g, " ").slice(0, 600);

  if (!report.loggedIn) {
    await writeFile("/tmp/suby-setup-report.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  report.cardStatus = /under review|being reviewed/i.test(body) ? "under_review" : "unknown";

  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: /reveal|show|copy/i }).first().click().catch(() => {});
  await page.waitForTimeout(1000);
  const apiText = await page.locator("body").innerText();
  const m = apiText.match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
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
    const payload = await res.json().catch(() => null);
    report.createProduct = { status: res.status, success: payload?.success, id: payload?.data?.id, error: payload?.error?.message };
  }

  await page.goto("https://app.suby.fi/products", { waitUntil: "networkidle", timeout: 60000 });
  const pro = (await page.locator("body").innerText()).match(/pro_[a-z0-9]+/i);
  report.productId = pro?.[0] ?? report.createProduct?.id ?? null;

  await writeFile("/tmp/suby-setup-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
