#!/usr/bin/env node
/**
 * Copy PGLite runtime assets into the Vercel serverless bundle.
 * Kept out of vite.config nitro hooks so the Vercel preset `compiled` hook
 * (config.json + .vc-config.json) is not overridden.
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = join(root, ".vercel/output/functions/__server.func/_libs");
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");

if (!existsSync(destDir) || !existsSync(srcDir)) {
  process.exit(0);
}

for (const file of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  const src = join(srcDir, file);
  if (existsSync(src)) copyFileSync(src, join(destDir, file));
}
