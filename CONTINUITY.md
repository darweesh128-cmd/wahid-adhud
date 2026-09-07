# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-07 ~14:50 Asia/Riyadh (UTC+3)  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 **confirmed** · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) · **Open account / $1** (`MEMBERSHIP_CHECKOUT_V2` **ON**; mock until Stripe live keys) |
| Apex | https://adhud.xyz → 308 → www |
| Domains | adhud.xyz + www.adhud.xyz on Vercel **Valid** · bound to deployment **temporary-instant-vega-ogx7ypz** |
| Production join | **$1 username flow** — `MEMBERSHIP_CHECKOUT_V2` **ON**; checkout **mock/test** until `sk_live` keys via CEO |
| $1 membership | Code **merged** (PR #7); **live on production** with `MEMBERSHIP_CHECKOUT_V2=true`; Stripe **test/mock** only until live keys via CEO |
| Production deployment | **https://temporary-instant-vega-ogx7ypz.vercel.app** · domain-bound to www · `MEMBERSHIP_CHECKOUT_V2=true` · mock until Stripe live keys |
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
| Tip (at continuity write) | `7b4886a` — merge PR #10 (CONTINUITY update) |
| Open PR | **#16** — CONTINUITY production $1 snapshot https://github.com/darweesh128-cmd/wahid-adhud/pull/16 |

### Merged PRs
#9 CONTINUITY.md · #7 membership $1 flag-gated · #6 English-only i18n · #5 Vercel Build Output API · #4 English-first harden · #3 English-first default · #2 viral loops · #1 5 USDT join

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **ON** on production; checkout **mock/test** until Stripe live keys
- Stripe live keys (`sk_live_*`) — **NOT present** in agent environment/vault as of 2026-09-07 ~13:11 Asia/Riyadh; production cutover to real Stripe charges requires `sk_live` later via CEO
- `DATABASE_URL` — secrets only; Neon `wahid-adhud` / `little-field-83907551`; migrations through 0007

## Live / deploy
- Canonical **https://www.adhud.xyz** HTTP 200 **confirmed** · Domains **Valid** on Vercel · bound to **temporary-instant-vega-ogx7ypz**
- Production: **Open account / $1** username flow (`MEMBERSHIP_CHECKOUT_V2` ON; mock until Stripe live keys)
- Deployment URL: https://temporary-instant-vega-ogx7ypz.vercel.app
- English-only via PR #6 live
- Self-heal on non-200 via temporary claim redeploy pattern

## Join
- Production: **$1 username flow** — `MEMBERSHIP_CHECKOUT_V2` ON; mock checkout until `sk_live` keys via CEO
- Legacy: 5 USDT TRC-20 · House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER` (superseded by $1 membership flow)
- Next: real Stripe charges + membership webhook once `sk_live` keys added; US entity separate

## Social CRITICAL
### Allowed: X **@adudadid** only · solidarity voice · https://www.adhud.xyz · never ask Mohamad for post approval
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** (Outlook) · paid ads without approval · spam/hard USDT recruit CTAs

### Open TECH_BLOCKs
1. X @adudadid: Hotmail unlock **in progress** — hard-fail if passwords fail; bio/post blocked until unlock
2. TikTok: mid-signup via mail.tm (separate mailbox from Hotmail)
3. Reddit: account creation attempt **in progress**
4. Stripe live keys: production shows **Open account / $1** username flow (mock); real charges blocked until `sk_live` keys via CEO

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www HTTP 200 · English-only · **Open account / $1** username flow (`MEMBERSHIP_CHECKOUT_V2` ON; mock until Stripe live keys)
3. Social: @adudadid only — never @Tarkou78 or Outlook
4. On Hotmail/X unlock: bio + logo + first solidarity post
5. Add `sk_live` keys via CEO when ready for real Stripe charges (mock checkout active until then)
6. No secrets in git/PRs/chat

### Suggested CloudAgent prompt
Resume Wahid (wahid-adhud main). Read CONTINUITY.md. Keep www English-only + $1 username flow (`MEMBERSHIP_CHECKOUT_V2` ON; mock until Stripe live keys); never Tarkou78/Outlook; @adudadid solidarity voice when unlocked; no secrets.

## Continuity rule
Update this file on live URL changes, social account switches, flag cutovers, or standing TECH_BLOCKs.
