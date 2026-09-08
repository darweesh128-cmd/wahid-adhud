#!/usr/bin/env node
import { chromium } from "playwright-core";

const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE?.trim();

const browser = await chromium.launch({ headless: true, channel: "chrome", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle" });
const emailInput = page.locator('input[type="email"]:visible').first();
await emailInput.evaluate((el, email) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(el, email);
  else el.value = email;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, EMAIL);
await page.getByRole("button", { name: /^send code$/i }).click();
await page.waitForTimeout(2500);

// Method: click first OTP slot then type
await page.evaluate(() => document.querySelector('[data-slot="input-otp-slot"]')?.click());
await page.waitForTimeout(200);
await page.keyboard.type(CODE || "000000", { delay: 120 });
await page.waitForTimeout(400);
const val = await page.locator('input[data-input-otp="true"]:visible').inputValue().catch(() => "");
console.log("visible_otp_value", val, "len", val.length);
await page.screenshot({ path: "/tmp/suby-otp-slots.png", fullPage: true });
if (CODE) {
  await page.getByRole("button", { name: /^verify$/i }).click();
  await page.waitForTimeout(5000);
  console.log("url", page.url());
  console.log((await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300));
}
await browser.close();
