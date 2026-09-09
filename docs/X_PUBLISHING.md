# X publishing for Grok Bot / Cursor — @adudadid

How posting and commenting actually worked, what this repo now provides, and what is still missing for **live** posts.

**No secrets in this file.** Account: **@adudadid** only. Never @Tarkou78.

## How it used to work

Grok Bot had **two separate halves**:

| Half | What it is | Can it post / reply? |
|------|------------|----------------------|
| Official **X connector / X plugin** (xAI, 29 Aug 2026) | Search posts, read timeline, check mentions, bookmarks. Paid Grok Bot users get X API **read** credits; xAI can create a developer account at connect time. | **No.** xAI’s published list is read-only. |
| **Write layer** | Either (a) Grok Bot’s cloud-computer **browser** logged into x.com, or (b) a user-context X API token with `tweet.write`. Previous Cursor runs also expected a write MCP; **Link MCP in this environment is Stripe Link (wallet), not X.** | **Yes**, if a session or write token exists. |

Previous Cursor agents on this repo **prepared** copy (`docs/PROMOTION.md`) and never completed a live `@adudadid` tweet: Hotmail unlock was TECH_BLOCK, and no write credentials were in the Cloud Agent environment. Site share buttons (`src/lib/share.ts`) open the **visitor’s** X composer — they do not post as @adudadid.

## What this repo reactivates

Write path (this Cloud Agent / any later Grok Bot / Cursor run):

```bash
node scripts/x-publish.mjs status
node scripts/x-publish.mjs post --key a --dry-run
node scripts/x-publish.mjs post --key a
node scripts/x-publish.mjs mentions
node scripts/x-publish.mjs reply --to TWEET_ID --text "Trust first → https://www.adhud.xyz"
```

- Queue + voice: `scripts/x-posts.mjs`, `docs/PROMOTION.md`
- OAuth 1.0a user-context calls to `POST /2/tweets` (posts **and** replies)
- Dedup state in `.grok/x-publish-state.json` (gitignored)
- Agent skill: `.cursor/skills/x-publish/SKILL.md`

Grok Bot read path (not in this repo): connect **X connector** in Grok Bot Settings → Plugins, then ask the Bot for mentions / timeline. After it returns tweet IDs, run `reply` here.

## Credentials (names only)

Set in the Cloud Agent environment or `.env` (never git):

| Name | Role |
|------|------|
| `X_API_KEY` | OAuth 1.0a consumer key |
| `X_API_SECRET` | OAuth 1.0a consumer secret |
| `X_ACCESS_TOKEN` | User access token for **@adudadid** |
| `X_ACCESS_TOKEN_SECRET` | User access token secret |

The token user **must** be @adudadid (`users/me` is checked). App-only bearer tokens cannot post.

## Gaps (why live publish still fails here)

1. **No X write tokens** in this Cursor Cloud Agent (`status` lists all four names missing).
2. **No X MCP** in this run’s tool catalog (unlike Vercel/Neon/Binance). Link MCP is payments, not Twitter.
3. **Official Grok Bot X plugin cannot post** — comments still need this script or a logged-in x.com session.
4. **Hotmail unlock** for @adudadid was still open in CONTINUITY (login / recovery blocked).
5. **No x.com browser session** on this VM (Grok Bot’s persistent computer is a different machine).
6. **X API free write caps** are tight (~17 posts/day on many tiers) — cadence in PROMOTION.md stays at a few posts/week.
7. Agentmail / Inkbox MCP are `needsAuth` — they cannot finish Hotmail OTP from here until you connect them.

## What you need to turn it live

1. Unlock @adudadid Hotmail / X login (human: password, email code, 2FA).
2. In Grok Bot: Settings → Plugins → **X for Grok Bot** + sign in as @adudadid (read/mentions).
3. Create or reuse an X developer app with **Read and write**, generate user tokens for @adudadid, put the four env names above into this Cloud environment (or Grok Bot secrets). Do not paste tokens into chat.
4. Re-run: `node scripts/x-publish.mjs status` then `post --key a`.
5. Comment loop: Bot reads mentions → drafts English solidarity reply → `reply --to …`.
