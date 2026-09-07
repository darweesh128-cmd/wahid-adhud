# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-07 ~15:10 Asia/Riyadh (UTC+3)  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · **English-only** (`lang=en`, Arabic toggle removed, `waahid-lang` purge) |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **LIVE** — **Open account · $1** on https://www.adhud.xyz |
| SEO | Title/meta/og say **Open account · $1** (no 5 USDT lead) — PR #17 merged |
| Live payment target | **Lemon Squeezy** MoR — collects $1 membership at cutover (not Stripe live keys) |
| Payout ops | Lemon pays out to **bank or PayPal only** (not crypto wallets). Mohamad withdraws via bank/PayPal and converts off-platform if needed; **or** switch MoR later. Stripe live **not required** for cutover |
| Checkout mode | **Lemon** when `LEMON_SQUEEZY_*` env set; else **mock** `/checkout/mock`; Stripe test/mock remains as alternate code path |
| Legacy USDT | **5 USDT TRC-20** collapsible **Or join with USDT** (House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`) |
| $1 membership | Code merged (PR #7); v2 default ON (PR #15); Lemon webhook at `POST /api/lemon/webhook` |
| Brand voice | Interconnection / brotherhood / family mutual solidarity / **trust first** — **never** money-collection or scam framing |
| Audience | **Global except Arabic countries** · English-first |
| X posting | Routine enabled for **@adudadid only** |
| TikTok | Mid-signup via mail.tm |
| Reddit | Account creation attempt **in progress** |

## Repo

| Item | Value |
|------|--------|
| GitHub | https://github.com/darweesh128-cmd/wahid-adhud |
| Default branch | `main` |
| Tip (at continuity write) | `5287a04` — PR #17 SEO merged; Lemon checkout PR pending |

### Merged PRs
#17 SEO $1 meta · #15 v2 default ON · #14 preview URL · #13 build env · #12 vercel.json · #7 membership $1 · #6 English-only

## Feature flags (names only)
- `MEMBERSHIP_CHECKOUT_V2` / `VITE_MEMBERSHIP_CHECKOUT_V2` — **default ON**; env opt-out with `false`
- `PAYMENT_PROVIDER` — optional override: `lemon` \| `stripe` \| `mock` (auto: lemon → stripe → mock)
- **Lemon Squeezy (live cutover):** `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_VARIANT_ID`, `LEMON_SQUEEZY_WEBHOOK_SECRET`, `LEMON_SQUEEZY_TEST_MODE`
- **Stripe (optional / dev):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `ALLOW_STRIPE_LIVE` — not required for production cutover
- `MEMBERSHIP_CHECKOUT_MOCK` — force mock simulator
- `DATABASE_URL` — Neon `wahid-adhud` / `little-field-83907551`

## Live / deploy
- Canonical https://www.adhud.xyz · Vercel Valid · **v2 UI live**
- Deploy: git push `main` → Vercel production
- Register Lemon webhook: `POST https://www.adhud.xyz/api/lemon/webhook` (event: `order_created`)
- English-only via PR #6

## Join
- Primary: **$1** Open account + username + **Lemon Squeezy** checkout (live) or mock (dev)
- Secondary: 5 USDT TRC-20 (House address preserved)
- **Payout:** Lemon Squeezy settles to linked **bank or PayPal** account (USD; min $50 threshold per Lemon). Crypto wallet payout is **not** Lemon-native — Mohamad converts off-platform after bank/PayPal withdrawal, or ops may choose a different MoR later
- Stripe live keys **not required** for cutover

## Social CRITICAL
### Allowed: X **@adudadid** only · https://www.adhud.xyz
### Forbidden: **@Tarkou78** · **tarik_salihoglu@outlook.com** (Outlook)

### Open TECH_BLOCKs
1. X @adudadid: Hotmail unlock in progress
2. TikTok: mid-signup via mail.tm
3. Reddit: account creation in progress
4. Lemon Squeezy: set Vercel env vars + register webhook for live $1 collection; link bank or PayPal payout in Lemon dashboard (no crypto payout option)

## How to resume in Cursor
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www shows **Open account · $1**
3. Live payments = **Lemon Squeezy** (not Stripe live)
4. @adudadid only — never @Tarkou78 or Outlook
5. No secrets in git/PRs/chat

## Continuity rule
Update on live URL changes, payment provider cutovers, flag changes, or TECH_BLOCKs.
