#!/usr/bin/env node
/**
 * Collect deployable files for a Vercel preview with membership checkout v2 enabled.
 * Writes JSON to stdout for use with the Vercel deploy_to_vercel MCP tool.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".vercel",
  "dist",
  ".output",
  ".nitro",
  ".tanstack",
  "screenshots",
  "artifacts",
  "attachments",
]);

const SKIP_FILES = new Set([".env", ".DS_Store"]);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const abs = join(dir, name);
    const rel = relative(root, abs).replace(/\\/g, "/");
    if (SKIP_FILES.has(name) || rel.startsWith(".env.")) continue;
    const st = statSync(abs);
    if (st.isDirectory()) {
      walk(abs, out);
      continue;
    }
    if (st.size > 5_000_000) continue;
    out.push({
      file: rel,
      data: readFileSync(abs, "utf8"),
    });
  }
}

const files = [];

walk(root, files);

const previewEnv = {
  VITE_MEMBERSHIP_CHECKOUT_V2: "true",
  MEMBERSHIP_CHECKOUT_V2: "true",
};

files.push({
  file: ".grok/app-env.json",
  data: JSON.stringify({ VITE_MEMBERSHIP_CHECKOUT_V2: "true" }, null, 2) + "\n",
});

files.push({
  file: "vercel.json",
  data:
    JSON.stringify(
      {
        build: { env: previewEnv },
        env: previewEnv,
      },
      null,
      2,
    ) + "\n",
});

process.stdout.write(
  JSON.stringify({
    target: "preview",
    name: "wahid-adhud-membership-v2-preview",
    teamId: "darweesh128-4945s-projects",
    files,
  }),
);
