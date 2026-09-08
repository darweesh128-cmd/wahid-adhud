#!/usr/bin/env node
/** Print ready-to-post copy for @adudadid. Usage: node scripts/promotion-posts.mjs [a|b|c|d|e|all] */
const POSTS = {
  a: `You may be fine today.
Someone else is not.

Open your account — $1 membership.
Become ʿAḍīd.

Do not join to take.
Join because you are someone's arm.

https://www.adhud.xyz`,
  b: `$1. One username. One desk. Mutual solidarity — not a pitch.

Open account → https://www.adhud.xyz`,
  c: `The map is live: members, countries, the House total.

See who stands as whose arm → https://www.adhud.xyz/network`,
  d: `No KYC circus. Pick a username. Pay $1. Get your member desk.

Trust first → https://www.adhud.xyz`,
  e: `Send this to three people. Do not explain.

The words work alone.

https://www.adhud.xyz`,
};

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
