/**
 * Automate Suby new-product form (headed Chrome on DISPLAY :1).
 * Run: DISPLAY=:1 node scripts/suby-dashboard-setup.mjs
 */
import { chromium } from "playwright-core";

const PRODUCT = {
  name: "Wahid · Open account · $1",
  description:
    "Mutual-aid circle membership — open account for $1; solidarity and trust, not fundraising.",
  price: "1.00",
};

async function main() {
  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://app.suby.fi/products/new", { waitUntil: "networkidle", timeout: 60000 });

  if (page.url().includes("/signin")) {
    console.error("NOT_LOGGED_IN: session missing — need verification code");
    await browser.close();
    process.exit(2);
  }

  await page.getByRole("button", { name: /one-time payment/i }).click().catch(() => {});

  await page.getByLabel(/product name/i).fill(PRODUCT.name);
  const desc = page.locator("textarea").first();
  if (await desc.count()) await desc.fill(PRODUCT.description);

  const price = page.getByLabel(/^price$/i);
  if (await price.count()) {
    await price.fill("");
    await price.fill(PRODUCT.price);
  }

  // Try CARD payment method
  const card = page.getByText(/^card$/i).or(page.getByLabel(/card/i));
  if (await card.count()) {
    await card.first().click().catch(() => {});
  }

  // Disable crypto if toggles exist
  const crypto = page.getByText(/^crypto$/i);
  if (await crypto.count()) {
    const toggle = page.locator('[data-state="checked"]').filter({ hasText: /crypto/i });
    if (await toggle.count()) await toggle.first().click().catch(() => {});
  }

  await page.screenshot({ path: "/tmp/suby-playwright-before-publish.png", fullPage: true });

  const publish = page.getByRole("button", { name: /^publish$/i });
  const disabled = await publish.isDisabled().catch(() => true);
  console.log("publish_disabled", disabled);

  if (!disabled) {
    await publish.click();
    await page.waitForTimeout(3000);
  }

  console.log("final_url", page.url());
  await page.screenshot({ path: "/tmp/suby-playwright-final.png", fullPage: true });

  const body = await page.textContent("body");
  const proMatch = page.url().match(/pro_[a-z0-9]+/i) || body?.match(/pro_[a-z0-9]+/i);
  if (proMatch) console.log("product_id", proMatch[0]);

  await browser.close();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
