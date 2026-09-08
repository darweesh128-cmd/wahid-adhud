#!/usr/bin/env node
import { chromium } from "playwright-core";

const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE?.trim();
if (!CODE) { console.error("SUBY_LOGIN_CODE required"); process.exit(2); }

const browser = await chromium.launch({ headless: true, channel: "chrome", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle" });
await page.locator('input[type="email"]:visible').first().evaluate((el, email) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(el, email);
  else el.value = email;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, EMAIL);
await page.getByRole("button", { name: /^send code$/i }).click();
await page.waitForTimeout(2500);

await page.evaluate(() => {
  const input = [...document.querySelectorAll("input[data-input-otp]")].find((i) => i.offsetParent !== null);
  input?.focus();
});
for (const ch of CODE) await page.keyboard.press(ch);
await page.waitForTimeout(500);

const val = await page.evaluate(() => {
  const input = [...document.querySelectorAll("input[data-input-otp]")].find((i) => i.offsetParent !== null);
  return input?.value || "";
});
console.log("otp_len", val.length, "otp", val === CODE ? "match" : val);

await page.getByRole("button", { name: /^verify$/i }).click();
await page.waitForTimeout(6000);
console.log("url", page.url());
const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
console.log(body.slice(0, 400));

if (!page.url().includes("signin")) {
  // logged in - run setup
  let apiKey = null;
  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /reveal|show|copy/i }).first().click().catch(() => {});
  await page.waitForTimeout(1000);
  const m = (await page.locator("body").innerText()).match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
  if (m) apiKey = m[0];
  console.log("api_key", apiKey ? apiKey.slice(0, 16) + "…" : "masked");

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
    console.log("product", JSON.stringify({ status: res.status, id: p?.data?.id, error: p?.error?.message }));
  }
}

await browser.close();
