# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-07 ~17:10 UTC (Suby v2 production cutover)  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **LIVE** — **Open account · $1** on https://www.adhud.xyz (HTTP 200, verified curl) |
| SEO | Title/meta/og say **Open account · $1** (no 5 USDT lead) |
| $1 backup preview | **https://temporary-swift-bugle-b7vgu37.vercel.app** · claim https://vercel.com/claim-deployment?code=88d80732-e5d4-45b9-ae5b-e35dbb893aa6 (Mohamad → `wahid-adhud` project if git deploy stuck) |
| Checkout mode | **Suby v2 live** in `vercel.json` (`MEMBERSHIP_PROVIDER=suby`, `SUBY_API_VERSION=v2`, product/price); secrets in Vercel vault only: `SUBY_API_KEY` + optional `SUBY_WEBHOOK_SECRET` |
| Legacy USDT | **5 USDT TRC-20** collapsible **Or join with USDT** (House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`) |
| $1 membership | PR #7 + #15 v2 default ON; **Suby MoR merged PR #20**; SEO fix PR #17 live on www |
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
| Tip (at continuity write) | `df89009` — Suby env baked (PR #23) + urgent production redeploy trigger |

### Merged PRs
#20 Suby · #17 SEO · #15 v2 default · #14 preview · #13 build env · #12 vercel.json · #7 membership $1 · #6 English-only

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **default ON** in code; env opt-out with `false`
- `MEMBERSHIP_PROVIDER` — `suby` (live target) \| `stripe` (dev test) \| `mock` (simulator); auto-prefers Suby when `SUBY_API_KEY` set
- **Live payment target:** Suby card → USDC wallet (Suby SAS MoR, FR entity). **No US bank/EIN required.**
- **Not required for $1 go-live:** Stripe live keys (`sk_live_*`), Lemon Squeezy (PRs closed)
- `SUBY_API_KEY`, `SUBY_WEBHOOK_SECRET`, `SUBY_PRODUCT_ID` (or `SUBY_PRICE_CENTS`), `SUBY_API_VERSION` (default **v2**), `SUBY_API_BASE_URL` (default `https://api.suby.fi`) — Suby only; **secrets (`SUBY_API_KEY`, optional webhook secret) in Vercel vault only**
- Stripe live (`sk_live_*`) — blocked until `ALLOW_STRIPE_LIVE=true` (legacy dev path only)
- Stripe test (`sk_test_*`) — used if in Vercel env; else **mock** `/checkout/mock`
- `DATABASE_URL` — secrets only; Neon `wahid-adhud` / `little-field-83907551`; migrations through 0009

## Vercel production env (baked in `vercel.json` — no secrets)
Set on every git/MCP deploy via `vercel.json` `build.env` + `env`:
- `MEMBERSHIP_CHECKOUT_V2=true`
- `VITE_MEMBERSHIP_CHECKOUT_V2=true`
- `MEMBERSHIP_PROVIDER=suby`
- `SUBY_PRODUCT_ID=pro_j2b6qq84weq359rt3of1fl4p`
- `SUBY_API_VERSION=v2`
- `SUBY_PRICE_CENTS=100`

### Mohamad / ops — paste once in Vercel project env (names only; values from Suby dashboard)
- `SUBY_API_KEY` — merchant API key (`sk_live_…` or `sk_sandbox_…`)
- `SUBY_WEBHOOK_SECRET` — webhook signing secret (`whsec_…`)

Optional: `DATABASE_URL` (Neon) if not already in project env.

After secrets: redeploy production or wait for next git push; Suby checkout activates when `SUBY_API_KEY` is present.

## Live / deploy
- Canonical https://www.adhud.xyz · Vercel Valid · **SEO + v2 live** (title: Open account · $1 membership)
- Deploy: git push `main` → Vercel production; `vercel.json` must stay valid JSON (no `$comment`)
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
4. Suby live: **production uses v2** (`api.suby.fi`); non-secret env baked in `vercel.json`; `SUBY_API_KEY` + optional `SUBY_WEBHOOK_SECRET` in Vercel vault only

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www shows **Open account · $1** (SEO/meta)
3. @adudadid only — never @Tarkou78 or Outlook
4. Wire Suby env in Vercel when ops ready (`MEMBERSHIP_PROVIDER=suby`); no secrets in git/PRs/chat

## Continuity rule
Update on live URL changes, flag cutovers, or TECH_BLOCKs.
