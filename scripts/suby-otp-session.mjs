#!/usr/bin/env node
import { chromium } from "playwright-core";
import { writeFile, readFile } from "node:fs/promises";

const WS_FILE = "/tmp/suby-browser-ws.txt";
const EMAIL = "darweesh128@gmail.com";
const CODE = process.env.SUBY_LOGIN_CODE?.trim();
const SEND = process.env.SUBY_SEND_CODE === "1";
const REPORT = "/tmp/suby-setup-report.json";

async function fillEmail(page) {
  const el = page.locator('input[type="email"]:visible').first();
  await el.evaluate((input, email) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, email);
    else input.value = email;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, EMAIL);
}

async function enterOtp(page, code) {
  await page.evaluate(() => {
    const input = [...document.querySelectorAll("input[data-input-otp]")].find((i) => i.offsetParent !== null);
    input?.focus();
  });
  for (const ch of code) await page.keyboard.press(ch);
}

async function afterLogin(page, report) {
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

if (SEND) {
  const server = await chromium.launchServer({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  await writeFile(WS_FILE, server.wsEndpoint().replace("[::1]", "127.0.0.1"));
  const browser = await chromium.connect(server.wsEndpoint());
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto("https://app.suby.fi/signin", { waitUntil: "networkidle" });
  await fillEmail(page);
  await page.getByRole("button", { name: /^send code$/i }).click();
  await page.waitForTimeout(3000);
  const report = { action: "code_sent", ws: true, otpReady: /enter verification code/i.test(await page.locator("body").innerText()) };
  await writeFile(REPORT, JSON.stringify(report));
  console.log(JSON.stringify(report));
  // Keep browser server alive for verify step (15 min)
  await new Promise((r) => setTimeout(r, 15 * 60 * 1000));
  await server.close();
  process.exit(0);
}

if (!CODE) {
  console.error("SUBY_LOGIN_CODE required");
  process.exit(2);
}

const ws = (await readFile(WS_FILE, "utf8").catch(() => "")).trim().replace("[::1]", "127.0.0.1");
if (!ws) {
  console.log(JSON.stringify({ error: "no_browser_session", hint: "Run SUBY_SEND_CODE=1 first" }));
  process.exit(3);
}

const browser = await chromium.connect(ws);
const page = browser.contexts()[0]?.pages()[0] || (await browser.newPage());
const report = {};

if (!/enter verification code/i.test(await page.locator("body").innerText())) {
  console.log(JSON.stringify({ error: "otp_screen_lost" }));
  process.exit(4);
}

await enterOtp(page, CODE);
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
await afterLogin(page, report);
await writeFile(REPORT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
