# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-07 ~13:25 Asia/Riyadh (UTC+3)  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **5 USDT TRC-20** |
| $1 membership | Code **merged** (PR #7); feature flag **off** on production; Stripe **test/mock** only until live keys via CEO |
| $1 preview URL | **https://temporary-instant-sable-34qa9r7.vercel.app** HTTP 200 · mock/test · `MEMBERSHIP_CHECKOUT_V2=true` · claim `dad07aaf-2ee4-4f8e-b4aa-a61c43323764` (may expire) |
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
| Open PR | **#8** draft — Preview membership v2 https://github.com/darweesh128-cmd/wahid-adhud/pull/8 |

### Merged PRs
#9 CONTINUITY.md · #7 membership $1 flag-gated · #6 English-only i18n · #5 Vercel Build Output API · #4 English-first harden · #3 English-first default · #2 viral loops · #1 5 USDT join

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **off** on production; preview uses mock/test only
- Stripe live keys (`sk_live_*`) — **NOT present** in agent environment/vault as of 2026-09-07 ~13:11 Asia/Riyadh; production cutover to $1 requires `sk_live` later via CEO
- `DATABASE_URL` — secrets only; Neon `wahid-adhud` / `little-field-83907551`; migrations through 0007

## Live / deploy
- Canonical https://www.adhud.xyz · Domain adhud.xyz on Vercel Valid · production join **5 USDT** unchanged
- $1 preview (mock): https://temporary-instant-sable-34qa9r7.vercel.app · claim `dad07aaf-2ee4-4f8e-b4aa-a61c43323764` (may expire)
- English-only via PR #6 live
- Self-heal on non-200 via temporary claim redeploy pattern

## Join
- Production: 5 USDT TRC-20 · House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`
- Next: $1 Stripe + username + membership webhook (flag-gated); US entity separate

## Social CRITICAL
### Allowed: X **@adudadid** only · solidarity voice · https://www.adhud.xyz · never ask Mohamad for post approval
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** (Outlook) · paid ads without approval · spam/hard USDT recruit CTAs

### Open TECH_BLOCKs
1. X @adudadid: Hotmail unlock **in progress** — hard-fail if passwords fail; bio/post blocked until unlock
2. TikTok: mid-signup via mail.tm (separate mailbox from Hotmail)
3. Reddit: account creation attempt **in progress**
4. $1 preview: **live** at https://temporary-instant-sable-34qa9r7.vercel.app (mock); prod stays 5 USDT; keep `MEMBERSHIP_CHECKOUT_V2` off on production

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www English-only; join 5 USDT until flag cutover
3. Social: @adudadid only — never @Tarkou78 or Outlook
4. On Hotmail/X unlock: bio + logo + first solidarity post
5. Keep MEMBERSHIP_CHECKOUT_V2 off on prod until preview verified + live `sk_live` keys
6. No secrets in git/PRs/chat

### Suggested CloudAgent prompt
Resume Wahid (wahid-adhud main). Read CONTINUITY.md. Keep www English-only + 5 USDT prod; never Tarkou78/Outlook; @adudadid solidarity voice when unlocked; optional MEMBERSHIP_CHECKOUT_V2 preview only (mock/test); no secrets.

## Continuity rule
Update this file on live URL changes, social account switches, flag cutovers, or standing TECH_BLOCKs.
