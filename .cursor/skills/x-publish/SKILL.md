---
name: x-publish-adudadid
description: Post and reply on X as @adudadid for Wahid / adhud.xyz. Use when asked to tweet, comment, engage mentions, or restore Grok Bot X publishing.
---

# X publish + comment (@adudadid)

**Only @adudadid.** Never @Tarkou78 or Outlook accounts. English-first solidarity voice. Never lead with USDT or scam/fundraising framing. Do not ask Mohamad for per-post approval.

## Commands

```bash
node scripts/x-publish.mjs status
node scripts/x-publish.mjs post --key a|b|c|d|e [--dry-run]
node scripts/x-publish.mjs post --text "..." [--dry-run]
node scripts/x-publish.mjs mentions
node scripts/x-publish.mjs reply --to TWEET_ID --text "..." [--dry-run]
```

Copy queue lives in `scripts/x-posts.mjs` / `docs/PROMOTION.md`. Full method + gaps: `docs/X_PUBLISHING.md`.

## Loop

1. `status` — if `missing` is non-empty, **do not invent a post URL**. Report the gap list.
2. Posts: use queue keys A–E; skip if state already has that key unless `--force`.
3. Comments: read mentions (this script if tokens exist, else Grok Bot X connector). Draft a short custom reply. `reply --to ID`. Never blast a generic CTA to every mention.
4. After a live post, record the `https://x.com/adudadid/status/{id}` URL in the user-facing summary.

## If write tokens are missing

Dry-run is allowed. Live `POST /2/tweets` is not. Do not drive x.com login (passwords / 2FA / Hotmail codes belong to the human). Do not use Stripe Link MCP — it is not X.
