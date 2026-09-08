#!/usr/bin/env node
/** Check Suby dashboard session using existing Chrome profile. */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const OUT = "/opt/cursor/artifacts/screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launchPersistentContext(
  "/home/ubuntu/.config/google-chrome",
  {
    headless: false,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    viewport: { width: 1400, height: 900 },
  },
);

const page = browser.pages()[0] || await browser.newPage();
try {
  await page.goto("https://app.suby.fi/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  const url = page.url();
  const title = await page.title();
  const body = await page.locator("body").innerText().catch(() => "");
  const snippet = body.replace(/\s+/g, " ").slice(0, 1200);
  await page.screenshot({ path: `${OUT}/suby-dashboard-check.png`, fullPage: true });
  console.log(JSON.stringify({ url, title, snippet }, null, 2));
} finally {
  await browser.close();
}
