# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-07 ~14:40 Asia/Riyadh (UTC+3)  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **$1 membership checkout v2** — **Open account · $1** primary UX (www still 5 USDT until claim redeploy) |
| $1 live preview | **https://temporary-instant-vega-ogx7ypz.vercel.app** HTTP 200 · Open account · $1 · claim `a151f865-a2fa-4ff3-82ff-6de3ad8d76f0` |
| Checkout mode | **Mock/test** unless live `sk_live` + `ALLOW_STRIPE_LIVE=true` in Vercel env (no `sk_live` wired as of cutover) |
| Legacy USDT | **5 USDT TRC-20** still available via collapsible **Or join with USDT** (House address path preserved) |
| $1 membership | Code merged (PR #7); **production flag ON** via `vercel.json` + Vercel env (PR cutover) |
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
| Tip (at continuity write) | production v2 cutover PR pending merge |
| Open PR | membership v2 production cutover (this PR) |

### Merged PRs
#11 CONTINUITY preview URL · #10 CONTINUITY update · #9 CONTINUITY.md · #7 membership $1 flag-gated · #6 English-only i18n · #5 Vercel Build Output API · #4 English-first harden · #3 English-first default · #2 viral loops · #1 5 USDT join

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **ON** on production (`vercel.json` + Vercel project env)
- Stripe live keys (`sk_live_*`) — **NOT wired** for production charges; `ALLOW_STRIPE_LIVE` gate blocks live keys until CEO sign-off
- Stripe test keys (`sk_test_*`) — use if present in Vercel env; otherwise **mock checkout** at `/checkout/mock`
- `DATABASE_URL` — secrets only; Neon `wahid-adhud` / `little-field-83907551`; migrations through 0009

## Live / deploy
- Canonical https://www.adhud.xyz · Domain adhud.xyz on Vercel Valid · **www still 5 USDT** until Mohamad claims preview
- $1 live preview: https://temporary-instant-vega-ogx7ypz.vercel.app · claim https://vercel.com/claim-deployment?code=a151f865-a2fa-4ff3-82ff-6de3ad8d76f0
- `vercel.json` sets `MEMBERSHIP_CHECKOUT_V2` + `VITE_MEMBERSHIP_CHECKOUT_V2` for git-triggered production builds
- English-only via PR #6 live
- Self-heal on non-200 via temporary claim redeploy pattern

## Join
- Production primary: **$1** username + card/mock checkout (v2 ON)
- Secondary: 5 USDT TRC-20 · House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER` (collapsible panel)
- Next: live Stripe when CEO provides `sk_live` + `ALLOW_STRIPE_LIVE=true`

## Social CRITICAL
### Allowed: X **@adudadid** only · solidarity voice · https://www.adhud.xyz · never ask Mohamad for post approval
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** (Outlook) · paid ads without approval · spam/hard USDT recruit CTAs

### Open TECH_BLOCKs
1. X @adudadid: Hotmail unlock **in progress** — hard-fail if passwords fail; bio/post blocked until unlock
2. TikTok: mid-signup via mail.tm (separate mailbox from Hotmail)
3. Reddit: account creation attempt **in progress**
4. Stripe live: mock checkout on prod until CEO provides `sk_live` + `ALLOW_STRIPE_LIVE=true`

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www shows **Open account · $1** (not 5 USDT-only)
3. Social: @adudadid only — never @Tarkou78 or Outlook
4. On Hotmail/X unlock: bio + logo + first solidarity post
5. Mock checkout is expected until live Stripe keys; USDT path remains as secondary
6. No secrets in git/PRs/chat

### Suggested CloudAgent prompt
Resume Wahid (wahid-adhud main). Read CONTINUITY.md. Keep www English-only + $1 v2 prod; never Tarkou78/Outlook; @adudadid solidarity voice when unlocked; mock checkout unless sk_live wired; no secrets.

## Continuity rule
Update this file on live URL changes, social account switches, flag cutovers, or standing TECH_BLOCKs.
