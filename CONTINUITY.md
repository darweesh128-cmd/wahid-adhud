# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-07 ~13:02 Asia/Riyadh (UTC+3)  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **5 USDT TRC-20** |
| $1 membership | Code **merged** (PR #7); feature flag **off** on production; Stripe **test/mock** only until live keys via CEO |
| $1 preview URL | Previous temporary preview **expired** — redeploy preview with `MEMBERSHIP_CHECKOUT_V2=true` when testing again |
| Brand voice | Interconnection / brotherhood / family mutual solidarity / **trust first** — **never** money-collection or scam framing |
| Audience | **Global except Arabic countries** · English-first |
| X posting | Routine enabled for **@adudadid only** |
| TikTok | Mid-signup as of 2026-09-07 |
| Reddit | Not created yet |

## Repo

| Item | Value |
|------|--------|
| GitHub | https://github.com/darweesh128-cmd/wahid-adhud |
| Default branch | `main` |
| Tip (at continuity write) | `15a3005` — merge PR #7 |
| Open PR | **#8** draft — Preview membership v2 https://github.com/darweesh128-cmd/wahid-adhud/pull/8 |

### Merged PRs
#7 membership $1 flag-gated · #6 English-only i18n · #5 Vercel Build Output API · #4 English-first harden · #3 English-first default · #2 viral loops · #1 5 USDT join

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **off** on production
- Stripe live keys — not in git; CEO when needed
- `DATABASE_URL` — secrets only; Neon `wahid-adhud` / `little-field-83907551`; migrations through 0007

## Live / deploy
- Canonical https://www.adhud.xyz · Domain adhud.xyz on Vercel Valid
- English-only via PR #6 live
- Self-heal on non-200 via temporary claim redeploy pattern

## Join
- Production: 5 USDT TRC-20 · House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`
- Next: $1 Stripe + username + membership webhook (flag-gated); US entity separate

## Social CRITICAL
### Allowed: X **@adudadid** only · solidarity voice · https://www.adhud.xyz · never ask Mohamad for post approval
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** · paid ads without approval · spam/hard USDT recruit CTAs

### Open TECH_BLOCKs
1. X @adudadid: Hotmail password rejected / email security code — bio/post blocked until unlock
2. TikTok: signup in progress (separate mailbox from Hotmail)
3. $1 preview temporary URL expired — redeploy for test; prod stays 5 USDT

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www English-only; join 5 USDT until flag cutover
3. Social: @adudadid only
4. On Hotmail/X unlock: bio + logo + first solidarity post
5. Keep MEMBERSHIP_CHECKOUT_V2 off on prod until preview verified + live keys
6. No secrets in git/PRs/chat

### Suggested CloudAgent prompt
Resume Wahid (wahid-adhud main). Read CONTINUITY.md. Keep www English-only + 5 USDT prod; never Tarkou78/Outlook; @adudadid solidarity voice when unlocked; optional MEMBERSHIP_CHECKOUT_V2 preview only; no secrets.

## Continuity rule
Update this file on live URL changes, social account switches, flag cutovers, or standing TECH_BLOCKs.
