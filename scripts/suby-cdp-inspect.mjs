#!/usr/bin/env node
/** Attach to running Chrome (CDP :9222) and inspect Suby dashboard state. */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const OUT = "/opt/cursor/artifacts/screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const pages = context.pages();
const page = pages.find((p) => p.url().includes("suby")) || pages[0];

const url = page.url();
const title = await page.title();
const body = await page.locator("body").innerText().catch(() => "");
const snippet = body.replace(/\s+/g, " ").slice(0, 2000);

await page.screenshot({ path: `${OUT}/suby-cdp-state.png`, fullPage: true });

// Gather actionable UI state
const buttons = await page.locator("button").allTextContents().catch(() => []);
const alerts = await page.locator('[role="alert"], .banner, [data-testid*="banner"]').allTextContents().catch(() => []);

console.log(JSON.stringify({ url, title, snippet, buttons: buttons.slice(0, 30), alerts }, null, 2));

await browser.close();
