# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-07 ~14:45 Asia/Riyadh (UTC+3)  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **$1 membership checkout v2** — **Open account · $1** (code default ON after PR #15) |
| $1 live preview | **https://temporary-swift-redwood-bejsfjj.vercel.app** HTTP 200 · claim `87ef6955-ecfe-453b-a0fb-56935d640326` |
| Checkout mode | **Mock/test** unless live `sk_live` + `ALLOW_STRIPE_LIVE=true` in Vercel env |
| Legacy USDT | **5 USDT TRC-20** collapsible **Or join with USDT** (House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`) |
| $1 membership | Code merged (PR #7); v2 default ON in code (PR #15); `vercel.json` + build script env |
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
| Tip (at continuity write) | PR #15 membership v2 default ON |

### Merged PRs
#14 preview URL · #13 build env · #12 vercel.json · #11 CONTINUITY preview · #7 membership $1 · #6 English-only

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **default ON** in code; env opt-out with `false`
- Stripe live (`sk_live_*`) — blocked until `ALLOW_STRIPE_LIVE=true` (CEO)
- Stripe test (`sk_test_*`) — used if in Vercel env; else **mock** `/checkout/mock`
- `DATABASE_URL` — Neon `wahid-adhud` / `little-field-83907551`

## Live / deploy
- Canonical https://www.adhud.xyz · Vercel Valid
- Git push to `main` should redeploy; if stale, `npm run build && npx vercel deploy --prebuilt --temporary --yes` + claim
- English-only via PR #6

## Join
- Primary: **$1** Open account + username + mock/Stripe checkout
- Secondary: 5 USDT TRC-20 (House address preserved)

## Social CRITICAL
### Allowed: X **@adudadid** only · https://www.adhud.xyz
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** (Outlook)

### Open TECH_BLOCKs
1. X @adudadid: Hotmail unlock in progress
2. TikTok: mid-signup via mail.tm
3. Reddit: account creation in progress
4. Stripe live: mock until CEO `sk_live` + `ALLOW_STRIPE_LIVE=true`
5. Vercel prod deploy: needs `VERCEL_TOKEN` or claim preview to assign `www.adhud.xyz`

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www shows **Open account · $1**
3. @adudadid only — never @Tarkou78 or Outlook
4. No secrets in git/PRs/chat

## Continuity rule
Update on live URL changes, flag cutovers, or TECH_BLOCKs.
