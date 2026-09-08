#!/usr/bin/env node
import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";

const PROFILE = "/tmp/chrome-clone";
await mkdir("/tmp/suby-screenshots", { recursive: true });
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
  await page.goto("https://app.suby.fi/settings/webhooks", { waitUntil: "networkidle", timeout: 60000 });
  const save = page.getByRole("button", { name: /save webhook/i });
  if (await save.count()) {
    await save.click();
    await page.waitForTimeout(2500);
    report.webhookSaved = true;
  }

  // Reveal API key (eye icons near masked fields)
  const revealButtons = page.locator("button").filter({ has: page.locator("svg") });
  const count = await revealButtons.count();
  for (let i = 0; i < Math.min(count, 8); i++) {
    await revealButtons.nth(i).click().catch(() => {});
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1000);
  const body = await page.locator("body").innerText();
  const keyMatch = body.match(/sk_(live|sandbox)_[A-Za-z0-9]+/);
  const whMatch = body.match(/whsec_[A-Za-z0-9]+/);
  if (keyMatch) apiKey = keyMatch[0];
  report.apiKeyPrefix = apiKey ? `${apiKey.slice(0, 16)}…` : "masked";
  report.webhookSecretPrefix = whMatch ? `${whMatch[0].slice(0, 12)}…` : "masked";
  report.webhookOk = body.includes("adhud.xyz/api/suby/webhook");

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

  report.cardStatus = "under_review";
  report.note = "CARD product blocked until Suby approves card payments (~48h). Webhook saved; update Vercel vault with API key + webhook secret from dashboard.";

  await writeFile("/tmp/suby-setup-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
}
