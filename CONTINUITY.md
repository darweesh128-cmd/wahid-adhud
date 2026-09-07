# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-07 ~14:50 Asia/Riyadh (UTC+3)  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **LIVE** — **Open account · $1** on https://www.adhud.xyz (HTTP 200, verified curl) |
| SEO | Title/meta/og say **Open account · $1** (no 5 USDT lead) |
| $1 live preview | **https://temporary-swift-redwood-bejsfjj.vercel.app** HTTP 200 · claim `87ef6955-ecfe-453b-a0fb-56935d640326` |
| Checkout mode | **Mock/test** until `MEMBERSHIP_PROVIDER=suby` + `SUBY_*` in Vercel env (or Stripe test/mock fallback) |
| Legacy USDT | **5 USDT TRC-20** collapsible **Or join with USDT** (House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`) |
| $1 membership | Code merged (PR #7); v2 default ON in code (PR #15); Suby MoR path in PR #20 |
| Brand voice | Interconnection / brotherhood / family mutual solidarity / **trust first** — **never** money-collection or scam framing |
| Audience | **Global except Arabic countries** · English-first |
| X posting | Routine enabled for **@adudadid only** |
| TikTok | Mid-signup via mail.tm (as of 2026-09-07 ~13:11 Asia/Riyadh) |
| Reddit | Account creation attempt **in progress** (as of 2026-09-07 ~13:11 Asia/Riyadh) |

## Repo

| Item | Value |
|------|--------|
| GitHub | https://github.com/darweesh128-cmd/wahid-adhud |
| Default branch | `main` |
| Tip (at continuity write) | `0bf720c` — PR #15 merged; www v2 live |

### Merged PRs
#15 v2 default ON · #14 preview URL · #13 build env · #12 vercel.json · #7 membership $1 · #6 English-only

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **default ON** in code; env opt-out with `false`
- `MEMBERSHIP_PROVIDER` — `suby` (live target) \| `stripe` (dev test) \| `mock` (simulator); auto-prefers Suby when `SUBY_API_KEY` set
- **Live payment target:** Suby card → USDC wallet (Suby SAS MoR, FR entity). **No US bank/EIN required.**
- **Not required for $1 go-live:** Stripe live keys (`sk_live_*`), Lemon Squeezy (PRs closed)
- `SUBY_API_KEY`, `SUBY_WEBHOOK_SECRET`, `SUBY_PRODUCT_ID` (or `SUBY_PRICE_CENTS`), `SUBY_API_VERSION` (default v3), `SUBY_API_BASE_URL` (default `https://api.beta.suby.fi`) — Suby only; secrets in deploy env
- Stripe live (`sk_live_*`) — blocked until `ALLOW_STRIPE_LIVE=true` (legacy dev path only)
- Stripe test (`sk_test_*`) — used if in Vercel env; else **mock** `/checkout/mock`
- `DATABASE_URL` — Neon `wahid-adhud` / `little-field-83907551`; migrations through 0009

## Live / deploy
- Canonical https://www.adhud.xyz · Vercel Valid · **v2 UI live** (asset `index-BMyCKiwL.js`)
- Deploy: git push `main` → Vercel production; code defaults v2 ON (PR #15)
- English-only via PR #6

## Join
- Primary: **$1** Open account + username + Suby card checkout (when `MEMBERSHIP_PROVIDER=suby` + `SUBY_*` configured)
- Fallback checkout: Stripe test or mock `/checkout/mock` until Suby keys in deploy env
- Secondary: 5 USDT TRC-20 (House address preserved)

## Social CRITICAL
### Allowed: X **@adudadid** only · https://www.adhud.xyz
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** (Outlook)

### Open TECH_BLOCKs
1. X @adudadid: Hotmail unlock in progress
2. TikTok: mid-signup via mail.tm
3. Reddit: account creation in progress
4. Suby live: mock/Stripe test until `SUBY_API_KEY` + `SUBY_WEBHOOK_SECRET` in Vercel + sandbox webhook verified

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www shows **Open account · $1** (SEO/meta)
3. @adudadid only — never @Tarkou78 or Outlook
4. Wire Suby env in Vercel when ops ready (`MEMBERSHIP_PROVIDER=suby`); no secrets in git/PRs/chat

## Continuity rule
Update on live URL changes, flag cutovers, or TECH_BLOCKs.
