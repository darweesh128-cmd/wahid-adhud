/**
 * Suby dashboard automation using persisted Chrome session.
 * DISPLAY=:1 node scripts/suby-playwright-setup.mjs
 */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const USER_DATA = "/home/ubuntu/.config/google-chrome";
const OUT = "/tmp/suby-automation-result.json";

async function main() {
  const context = await chromium.launchPersistentContext(USER_DATA, {
    channel: "chrome",
    headless: false,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    viewport: { width: 1792, height: 1084 },
  });

  const page = context.pages()[0] ?? await context.newPage();
  await page.goto("https://app.suby.fi/products/new", { waitUntil: "networkidle", timeout: 90000 });

  const result = { url: page.url(), steps: [] };

  if (page.url().includes("/signin")) {
    result.error = "NOT_LOGGED_IN";
    writeFileSync(OUT, JSON.stringify(result, null, 2));
    await context.close();
    process.exit(2);
  }

  // One-time payment
  await page.getByText("One-time payment", { exact: false }).first().click().catch(() => {});
  result.steps.push("one_time");

  await page.locator('input[name="name"], input[placeholder*="Product name" i]').first().fill(
    "Wahid · Open account · $1",
  );
  await page.locator("textarea").first().fill(
    "Mutual-aid circle membership — open account for $1; solidarity and trust, not fundraising.",
  );

  const priceInput = page.locator('input[name="price"], input[inputmode="decimal"]').first();
  await priceInput.click();
  await priceInput.fill("");
  await priceInput.fill("1.00");
  result.steps.push("details_filled");

  await page.screenshot({ path: "/tmp/suby-pw-1-details.png", fullPage: true });

  // Payment methods section
  const paymentHeading = page.getByText("Payment methods", { exact: false });
  await paymentHeading.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(500);

  const bodyText = await page.locator("body").innerText();
  result.cardReviewBanner = bodyText.includes("under review");

  // Try enable CARD, disable crypto
  const cardRow = page.locator("text=/^Card$/i").first();
  if (await cardRow.count()) {
    await cardRow.click().catch(() => {});
    result.steps.push("clicked_card");
  }

  const cryptoToggle = page.locator('[role="switch"]').filter({ has: page.locator("text=/crypto/i") });
  if (await cryptoToggle.count()) {
    const checked = await cryptoToggle.first().getAttribute("data-state");
    result.cryptoToggleState = checked;
    if (checked === "checked") await cryptoToggle.first().click().catch(() => {});
  }

  await page.screenshot({ path: "/tmp/suby-pw-2-payment-methods.png", fullPage: true });

  const publish = page.getByRole("button", { name: /^publish$/i });
  result.publishDisabled = await publish.isDisabled().catch(() => true);

  if (!result.publishDisabled) {
    await publish.click();
    await page.waitForTimeout(4000);
    result.url = page.url();
    const m = page.url().match(/pro_[a-z0-9]+/i);
    if (m) result.productId = m[0];
    result.steps.push("published");
  } else {
    result.steps.push("publish_blocked");
    // capture validation errors
    result.validation = await page.locator('[role="alert"], .text-red-500, .text-destructive').allTextContents();
  }

  // API & Webhooks
  await page.goto("https://app.suby.fi/settings/api", { waitUntil: "networkidle", timeout: 60000 }).catch(() =>
    page.goto("https://app.suby.fi/settings", { waitUntil: "networkidle" }),
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/suby-pw-3-api.png", fullPage: true });
  result.apiPage = page.url();
  const apiBody = await page.locator("body").innerText();
  result.hasApiKey = /api key/i.test(apiBody);
  result.hasWebhook = /webhook/i.test(apiBody);

  const webhookInput = page.locator('input[type="url"], input[placeholder*="webhook" i]').first();
  if (await webhookInput.count()) {
    await webhookInput.fill("https://www.adhud.xyz/api/suby/webhook");
    result.steps.push("webhook_filled");
    const save = page.getByRole("button", { name: /save|update/i }).first();
    if (await save.count()) await save.click().catch(() => {});
  }

  writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await context.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
