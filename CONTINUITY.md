# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-10 (UTC) — **PUBLIC HIDDEN** while the message is rewritten  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **HIDDEN** — `PUBLIC_HIDDEN=true` / `VITE_PUBLIC_HIDDEN=true`. www must serve a blank noindex page (no Adhud copy, no join). Merge this to `main` to take production down |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **OFF** — create-account / checkout return Unavailable |
| SEO | `X-Robots-Tag: noindex, nofollow, noarchive` · robots Disallow: / |
| Checkout mode | Suby keys remain in vault but public join is blocked |
| X posting | **STOP** — hide/protect @Adudadid until the new message |
| TikTok | **STOP** — set @adud263 Private until the new message |
| Reddit | Do not publish |

## Repo

| Item | Value |
|------|--------|
| GitHub | https://github.com/darweesh128-cmd/wahid-adhud |
| Default branch | `main` |
| Tip (at continuity write) | `2af478b` — PR #24 merged (Suby v2 production cutover) |

### Merged PRs
#24 Suby v2 prod · #20 Suby · #17 SEO · #15 v2 default · #14 preview · #13 build env · #12 vercel.json · #7 membership $1 · #6 English-only

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **default ON** in code; env opt-out with `false`
- `MEMBERSHIP_PROVIDER` — `suby` (live) \| `stripe` (dev test) \| `mock` (simulator)
- **Live payment:** Suby v2 card → USDC wallet (Suby SAS MoR, FR entity). **No US bank/EIN required.**
- `SUBY_API_KEY`, `SUBY_WEBHOOK_SECRET` — **Vercel vault only** (never in git/docs/chat)
- `SUBY_PRODUCT_ID`, `SUBY_API_VERSION` (v2 production; v3 beta rejects live key), `SUBY_PRICE_CENTS` — baked in `vercel.json`
- Stripe live (`sk_live_*`) — blocked until `ALLOW_STRIPE_LIVE=true` (legacy dev path only)
- `DATABASE_URL` — secrets only; Neon `wahid-adhud` / `little-field-83907551`; migrations through 0009

## Vercel production env (baked in `vercel.json` — no secrets)
- `PUBLIC_HIDDEN=true` · `VITE_PUBLIC_HIDDEN=true` — **public product offline**
- `MEMBERSHIP_CHECKOUT_V2=true` · `VITE_MEMBERSHIP_CHECKOUT_V2=true`
- `MEMBERSHIP_PROVIDER=suby`
- `SUBY_PRODUCT_ID=pro_j2b6qq84weq359rt3of1fl4p`
- `SUBY_API_VERSION=v2`
- `SUBY_PRICE_CENTS=100`

**Vault only (names):** `SUBY_API_KEY`, `SUBY_WEBHOOK_SECRET`, optional `DATABASE_URL`

## Live / deploy
- **https://www.adhud.xyz** is **hidden** once this flag is on `main`
- To restore later: set `PUBLIC_HIDDEN` / `VITE_PUBLIC_HIDDEN` to `false` and redeploy
- `vercel.json` must stay valid JSON (no `$comment`)

## Join
- Primary: **$1** Open account + username → **checkout.suby.fi** (Suby v2 live)
- Fallback (dev): Stripe test or mock `/checkout/mock`
- Secondary: 5 USDT TRC-20 (House address preserved)

## Social CRITICAL
### Allowed: X **@adudadid** only · https://www.adhud.xyz · English-first
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** (Outlook)

### Open TECH_BLOCKs
1. X @adudadid: Hotmail unlock in progress
2. TikTok: Access Denied (routine deleted)
3. Reddit: account creation in progress

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud`; public product is **HIDDEN** until the new message
2. Do not post on X or TikTok as Adhud until the owner unhides
3. @adudadid only — never @Tarkou78 or Outlook
4. Secrets stay in Vercel vault — no keys in git/PRs/chat
5. Restore: `PUBLIC_HIDDEN=false` + `VITE_PUBLIC_HIDDEN=false` then redeploy

## Continuity rule
Update on live URL changes, flag cutovers, or TECH_BLOCKs.
