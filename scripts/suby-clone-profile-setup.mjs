#!/usr/bin/env node
import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";

const PROFILE = "/tmp/chrome-clone";
const OUT = "/tmp/suby-screenshots";
await mkdir(OUT, { recursive: true });
const report = {};
let apiKey = null;

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  viewport: { width: 1400, height: 900 },
});
const page = context.pages()[0] || await context.newPage();

try {
  await page.goto("https://app.suby.fi/dashboard", { waitUntil: "networkidle", timeout: 60000 });
  report.url = page.url();
  report.loggedIn = !page.url().includes("signin");
  if (!report.loggedIn) {
    console.log(JSON.stringify({ ...report, error: "session_not_in_clone" }));
    process.exit(2);
  }

  const dash = await page.locator("body").innerText();
  report.cardStatus = /under review|being reviewed/i.test(dash) ? "under_review" : "unknown";

  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: /reveal|show|copy/i }).first().click().catch(() => {});
  await page.waitForTimeout(1500);
  const apiText = await page.locator("body").innerText();
  const m = apiText.match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
  if (m) apiKey = m[0];
  report.apiKeyPrefix = apiKey ? `${apiKey.slice(0, 16)}…` : "masked";
  await page.screenshot({ path: `${OUT}/clone-api.png`, fullPage: true });

  await page.goto("https://app.suby.fi/settings/webhooks", { waitUntil: "networkidle", timeout: 60000 });
  report.webhookOk = (await page.locator("body").innerText()).includes("adhud.xyz/api/suby/webhook");

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
    report.createCardProduct = { status: res.status, id: p?.data?.id, error: p?.error?.message };
  }

  await page.goto("https://app.suby.fi/products", { waitUntil: "networkidle", timeout: 60000 });
  const pros = (await page.locator("body").innerText()).match(/pro_[a-z0-9]+/gi);
  report.productIds = pros ? [...new Set(pros)] : [];
  report.productId = report.createCardProduct?.id || report.productIds[0] || null;
  await page.screenshot({ path: `${OUT}/clone-products.png`, fullPage: true });

  await writeFile("/tmp/suby-setup-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
}
