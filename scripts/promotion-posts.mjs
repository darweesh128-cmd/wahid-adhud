#!/usr/bin/env node
/** Print ready-to-post copy for @adudadid. Usage: node scripts/promotion-posts.mjs [a|b|c|d|e|all] */
import { POSTS } from "./x-posts.mjs";

const arg = (process.argv[2] || "all").toLowerCase();
if (arg === "all") {
  for (const [key, text] of Object.entries(POSTS)) {
    console.log(`--- ${key.toUpperCase()} ---\n${text}\n`);
  }
} else if (POSTS[arg]) {
  console.log(POSTS[arg]);
} else {
  console.error(`Unknown post: ${arg}. Use: a|b|c|d|e|all`);
  process.exit(1);
}
