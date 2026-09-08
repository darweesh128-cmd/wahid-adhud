#!/usr/bin/env node
/** Try to read latest Suby OTP from Gmail in Chrome profile (if logged in). */
import { chromium } from "playwright-core";

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
try {
  await page.goto("https://mail.google.com/mail/u/0/#inbox", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000);
  const url = page.url();
  const body = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");
  const codeMatch = body.match(/\b(\d{6})\b/);
  const subyMatch = body.match(/suby|verification code/i);
  console.log(JSON.stringify({
    url,
    loggedIn: !url.includes("accounts.google.com"),
    hasSubyEmail: Boolean(subyMatch),
    possibleCode: codeMatch?.[1] ?? null,
    snippet: body.slice(0, 800),
  }, null, 2));
} finally {
  await browser.close();
}
