# Wahid · The Adhud — Continuity (Cursor-ready)

**Purpose:** Resume from Cursor or Grok Bot anytime. **No secrets in this file.**  
**Last updated:** 2026-09-08 (Asia/Riyadh) — Suby dashboard ops in progress  
**Scope lock:** `darweesh128-cmd/wahid-adhud` only — do not touch other projects.

## Snapshot (NOW)

| Area | State |
|------|--------|
| Live site | **https://www.adhud.xyz** HTTP 200 · Domains **Valid** on Vercel project `temporary-prompt-savanna-pzvu0qr` |
| Apex | https://adhud.xyz → 308 → www |
| Production join | **LIVE** — **Open account · $1** on www (HTTP 200) |
| Checkout smoke | **Verified** — create account → redirect to **checkout.suby.fi** (stopped before card) |
| SEO | Title/meta/og say **Open account · $1** (no 5 USDT lead) |
| Checkout mode | **Suby v2** — code forces `SUBY_PAYMENT_METHODS=CARD` (PR #26 merged). **Vercel vault keys still point at orphaned uberip merchant** until darweesh128 account product + keys are rotated |
| Suby merchant (target) | **darweesh128@gmail.com** · workspace **The Adhud** — **logged in** (manual); API & Webhooks page shows keys + webhook URL `https://www.adhud.xyz/api/suby/webhook` |
| Suby CARD gate | **Under review (~48h)** — dashboard banner; **CARD product publish blocked** until Suby approves card payments |
| Suby product | **Not created** on darweesh128 account (UI form flaky; use API `scripts/suby-ensure-card-product.mjs` after CARD approval). Legacy `pro_j2b6qq84weq359rt3of1fl4p` belongs to old uberip inbox account |
| Legacy USDT | **5 USDT TRC-20** collapsible **Or join with USDT** (House `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`) |
| $1 membership | PR #26 CARD-only checkout · #24 v2 prod · #20 Suby MoR · #17 SEO · #15 v2 default · #7 $1 |
| Open PRs | #27 `SUBY_PAYMENT_METHODS` runtime env · #28 Suby ops automation scripts |
| Brand voice | Interconnection / brotherhood / family mutual solidarity / **trust first** — **never** money-collection or scam framing |
| Audience | **Global except Arabic countries** · English-first |
| X posting | **@adudadid** — English-first routine enabled |
| TikTok | **TECH_BLOCK** — Access Denied (routine deleted) |
| Reddit | Account creation attempt **in progress** |

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
- `SUBY_PRODUCT_ID`, `SUBY_PAYMENT_METHODS` (`CARD`), `SUBY_API_VERSION` (v2 production; v3 beta rejects live key), `SUBY_PRICE_CENTS` — baked in `vercel.json`
- Stripe live (`sk_live_*`) — blocked until `ALLOW_STRIPE_LIVE=true` (legacy dev path only)
- `DATABASE_URL` — secrets only; Neon `wahid-adhud` / `little-field-83907551`; migrations through 0009

## Vercel production env (baked in `vercel.json` — no secrets)
- `MEMBERSHIP_CHECKOUT_V2=true` · `VITE_MEMBERSHIP_CHECKOUT_V2=true`
- `MEMBERSHIP_PROVIDER=suby`
- `SUBY_PRODUCT_ID=pro_j2b6qq84weq359rt3of1fl4p`
- `SUBY_PAYMENT_METHODS=CARD`
- `SUBY_API_VERSION=v2`
- `SUBY_PRICE_CENTS=100`

**Vault only (names):** `SUBY_API_KEY`, `SUBY_WEBHOOK_SECRET`, optional `DATABASE_URL` — **rotate to darweesh128 Suby account** after CARD approval + product create (do not reuse uberip merchant keys)

## Suby ops checklist (darweesh128@gmail.com)
- [x] Login (manual + verified 2026-09-08)
- [x] Webhook URL active: `https://www.adhud.xyz/api/suby/webhook`
- [ ] **Vercel vault:** rotate `SUBY_API_KEY` + `SUBY_WEBHOOK_SECRET` to darweesh128 account (agent has no Vercel MCP access)
- [x] Solana payout wallet configured
- [ ] Suby CARD merchant verification approved
- [ ] Create CARD-only $1 product (`pro_…`) via API or dashboard
- [ ] Update Vercel vault: `SUBY_API_KEY`, `SUBY_WEBHOOK_SECRET`, `SUBY_PRODUCT_ID`
- [ ] E2E: www.adhud.xyz → checkout.suby.fi shows **card / Apple Pay / Google Pay** (not crypto QR)

## Live / deploy
- **https://www.adhud.xyz** · Vercel project `temporary-prompt-savanna-pzvu0qr` · Domains Valid
- Deploy: git push `main` → Vercel production; `vercel.json` must stay valid JSON (no `$comment`)
- English-only via PR #6

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
1. Open `darweesh128-cmd/wahid-adhud` on `main`; read this file
2. Verify www shows **Open account · $1** and checkout redirects to checkout.suby.fi
3. @adudadid only — never @Tarkou78 or Outlook
4. Secrets stay in Vercel vault — no keys in git/PRs/chat

## Continuity rule
Update on live URL changes, flag cutovers, or TECH_BLOCKs.
