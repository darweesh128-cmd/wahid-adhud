#!/usr/bin/env node
import { chromium } from "playwright-core";

const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE || "702881";

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
await page.waitForTimeout(2000);

// dump OTP-related DOM
const info = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll("input")].map((i) => ({
    type: i.type,
    id: i.id,
    slot: i.getAttribute("data-slot"),
    otp: i.getAttribute("data-input-otp"),
    visible: i.offsetParent !== null,
    cls: i.className?.slice?.(0, 80),
  }));
  const slots = [...document.querySelectorAll("[data-slot]")].map((e) => e.getAttribute("data-slot"));
  return { inputs, slots: [...new Set(slots)] };
});
console.log(JSON.stringify(info, null, 2));

// try char-by-char on hidden otp
await page.evaluate((otp) => {
  const input = document.querySelector('input[data-input-otp="true"]');
  if (!input) return;
  input.focus();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  for (const ch of otp) {
    const next = (input.value || "") + ch;
    setter.call(input, next);
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: ch, inputType: "insertText" }));
  }
  input.dispatchEvent(new Event("change", { bubbles: true }));
}, CODE);

await page.waitForTimeout(500);
const val = await page.evaluate(() => document.querySelector('input[data-input-otp="true"]')?.value);
console.log("otp_value", val);
await page.getByRole("button", { name: /^verify$/i }).click();
await page.waitForTimeout(5000);
console.log("url", page.url());
console.log("body", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 400));
await browser.close();
