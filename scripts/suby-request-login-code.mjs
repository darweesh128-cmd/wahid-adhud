#!/usr/bin/env node
/** Request Suby login code for darweesh128@gmail.com (fresh browser). */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const EMAIL = "darweesh128@gmail.com";
const OUT = "/tmp/suby-screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

try {
  await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/suby-signin-landing.png`, fullPage: true });

  // Suby may hide email until "Continue with email" is chosen
  const emailPath = page.getByRole("button", { name: /email/i });
  if (await emailPath.count()) await emailPath.first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[type="email"]:visible').first();
  await emailInput.evaluate((el, email) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    el.focus();
    if (setter) setter.call(el, email);
    else el.value = email;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, EMAIL);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/suby-signin-email-filled.png`, fullPage: true });

  const sendCode = page.getByRole("button", { name: /^send code$/i });
  await sendCode.waitFor({ state: "visible", timeout: 10000 });
  const enabled = await sendCode.isEnabled();
  console.log("send_code_enabled", enabled);
  if (!enabled) {
    throw new Error("Send code button still disabled after entering email");
  }
  await sendCode.click();
  await page.waitForTimeout(4000);

  await page.screenshot({ path: `${OUT}/suby-signin-after-continue.png`, fullPage: true });

  const url = page.url();
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 1500);
  console.log(JSON.stringify({ url, body }, null, 2));
} finally {
  await browser.close();
}
