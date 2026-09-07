# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
<<<<<<< HEAD
**Last updated:** 2026-09-07 ~14:50 Asia/Riyadh (UTC+3)  
=======
**Last updated:** 2026-09-07 ~14:45 Asia/Riyadh (UTC+3)  
>>>>>>> 5d4f040 (fix(seo): reframe landing meta from 5 USDT to $1 Open account)
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) |
| Apex | https://adhud.xyz → 308 → www |
<<<<<<< HEAD
| Production join | **LIVE** — **Open account · $1** on https://www.adhud.xyz (HTTP 200, verified curl) |
| $1 live preview | **https://temporary-swift-redwood-bejsfjj.vercel.app** HTTP 200 · claim `87ef6955-ecfe-453b-a0fb-56935d640326` |
| Checkout mode | **Mock/test** unless live `sk_live` + `ALLOW_STRIPE_LIVE=true` in Vercel env |
| Legacy USDT | **5 USDT TRC-20** collapsible **Or join with USDT** (House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`) |
| $1 membership | Code merged (PR #7); v2 default ON in code (PR #15); `vercel.json` + build script env |
=======
| Domains | **adhud.xyz on Vercel Valid** (www canonical) |
| Production join | **$1 Open account** (username-first membership checkout) |
| Stripe | **Mock / test mode** until live `sk_live_*` keys via CEO — no live card charges yet |
| $1 membership | Code **merged** (PR #7); `MEMBERSHIP_CHECKOUT_V2` on production; SEO updated to Open account / $1 framing |
| $1 preview URL | **https://temporary-instant-sable-34qa9r7.vercel.app** HTTP 200 · mock/test · claim `dad07aaf-2ee4-4f8e-b4aa-a61c43323764` (may expire) |
>>>>>>> 5d4f040 (fix(seo): reframe landing meta from 5 USDT to $1 Open account)
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
<<<<<<< HEAD
| Tip (at continuity write) | `0bf720c` — PR #15 merged; www v2 live |
=======
| Tip (at continuity write) | SEO $1 membership meta update |
| Open PR | **#8** draft — Preview membership v2 https://github.com/darweesh128-cmd/wahid-adhud/pull/8 |
>>>>>>> 5d4f040 (fix(seo): reframe landing meta from 5 USDT to $1 Open account)

### Merged PRs
#15 v2 default ON · #14 preview URL · #13 build env · #12 vercel.json · #7 membership $1 · #6 English-only

## Feature flags (names only)
<<<<<<< HEAD
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **default ON** in code; env opt-out with `false`
- Stripe live (`sk_live_*`) — blocked until `ALLOW_STRIPE_LIVE=true` (CEO)
- Stripe test (`sk_test_*`) — used if in Vercel env; else **mock** `/checkout/mock`
- `DATABASE_URL` — Neon `wahid-adhud` / `little-field-83907551`

## Live / deploy
- Canonical https://www.adhud.xyz · Vercel Valid · **v2 UI live** (asset `index-BMyCKiwL.js`)
- Deploy: git push `main` → Vercel production; code defaults v2 ON (PR #15)
- English-only via PR #6

## Join
- Primary: **$1** Open account + username + mock/Stripe checkout
- Secondary: 5 USDT TRC-20 (House address preserved)
=======
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **on** on production (Open account · $1 UI)
- Stripe live keys (`sk_live_*`) — **NOT present** in agent environment/vault; production checkout stays **mock/test** until CEO provides live keys
- `DATABASE_URL` — secrets only; Neon `wahid-adhud` / `little-field-83907551`; migrations through 0007

## Live / deploy
- Canonical https://www.adhud.xyz · Domain adhud.xyz on Vercel **Valid**
- Production join: **$1 Open account** · mock Stripe until live keys
- $1 preview (mock): https://temporary-instant-sable-34qa9r7.vercel.app · claim `dad07aaf-2ee4-4f8e-b4aa-a61c43323764` (may expire)
- English-only via PR #6 live
- Self-heal on non-200 via temporary claim redeploy pattern

## Join
- Production: **$1 Open account** (username + membership checkout; mock/test Stripe until live keys)
- Legacy: optional 5 USDT TRC-20 path may remain in code/docs until full cutover
- Next: Stripe live keys + membership webhook go-live; US entity separate
>>>>>>> 5d4f040 (fix(seo): reframe landing meta from 5 USDT to $1 Open account)

## Social CRITICAL
### Allowed: X **@adudadid** only · https://www.adhud.xyz
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** (Outlook)

### Open TECH_BLOCKs
<<<<<<< HEAD
1. X @adudadid: Hotmail unlock in progress
2. TikTok: mid-signup via mail.tm
3. Reddit: account creation in progress
4. Stripe live: mock until CEO `sk_live` + `ALLOW_STRIPE_LIVE=true`

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www shows **Open account · $1**
3. @adudadid only — never @Tarkou78 or Outlook
4. No secrets in git/PRs/chat
=======
1. X @adudadid: Hotmail unlock **in progress** — hard-fail if passwords fail; bio/post blocked until unlock
2. TikTok: mid-signup via mail.tm (separate mailbox from Hotmail)
3. Reddit: account creation attempt **in progress**
4. Stripe live: mock/test checkout on prod until `sk_live_*` via CEO

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www English-only; production join is **$1 Open account** (mock Stripe until live keys)
3. Social: @adudadid only — never @Tarkou78 or Outlook
4. On Hotmail/X unlock: bio + logo + first solidarity post
5. No secrets in git/PRs/chat

### Suggested CloudAgent prompt
Resume Wahid (wahid-adhud main). Read CONTINUITY.md. Keep www English-only + $1 Open account prod (mock until Stripe live); never Tarkou78/Outlook; @adudadid solidarity voice when unlocked; no secrets.
>>>>>>> 5d4f040 (fix(seo): reframe landing meta from 5 USDT to $1 Open account)

## Continuity rule
Update on live URL changes, flag cutovers, or TECH_BLOCKs.
