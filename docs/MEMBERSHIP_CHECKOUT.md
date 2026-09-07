# Membership checkout (v2)

Wahid product: **$1 USD membership** via username-first account creation, then **card checkout** (Suby live MoR preferred, Stripe test/mock for dev). Legacy **5 USDT** join stays available until cutover.

**Live payment target:** [Suby](https://www.suby.fi) — Merchant of Record (FR entity Suby SAS). Customer pays by card (+ APMs); merchant receives **USDC** to wallet. No US bank account or EIN required.

**Not required for go-live:** Stripe live keys, Lemon Squeezy (closed — do not merge).

## Feature flags

| Variable | Where | Effect |
|----------|--------|--------|
| `VITE_MEMBERSHIP_CHECKOUT_V2=true` | Build / client | Shows Open account + $1 flow |
| `MEMBERSHIP_CHECKOUT_V2=true` | Server | Enables account APIs, checkout, webhooks |
| `MEMBERSHIP_PROVIDER` | Server | `suby` \| `stripe` \| `mock` (see below) |

**Default (flag off):** existing 5 USDT join only — production unchanged today.

## Provider selection (`MEMBERSHIP_PROVIDER`)

| Value | When | Notes |
|-------|------|--------|
| `suby` | Live card → USDC | **Production target** — requires Suby dashboard setup |
| `stripe` | Dev / legacy test | Stripe Checkout **test mode** (`sk_test_*`) |
| `mock` | Local QA | Built-in simulator at `/checkout/mock` |
| *(unset)* | Auto | Suby if `SUBY_*` configured, else Stripe test, else mock |

Force mock even with keys: `MEMBERSHIP_CHECKOUT_MOCK=true`

## Product flow (flag on)

```
Open account · $1
    → Pick unique username (+ suggest, availability check)
    → Create account & pay $1 (adhud_accounts row first, status=pending)
    → Checkout:
         • Suby hosted paylink when MEMBERSHIP_PROVIDER=suby
         • Stripe Checkout TEST when MEMBERSHIP_PROVIDER=stripe
         • Mock simulator at /checkout/mock when mock
    → Payment success (webhook — never trust redirect alone)
    → activateAccountMembership (shared fulfillment)
    → Desk at /member/{username}
```

## Environment variables (names only — no secrets in git)

### Enable v2 (dev / staging / preview)

```
VITE_MEMBERSHIP_CHECKOUT_V2=true
MEMBERSHIP_CHECKOUT_V2=true
```

### Suby (live MoR — production target)

```
MEMBERSHIP_PROVIDER=suby
SUBY_API_KEY=sk_live_...              # or sk_sandbox_... for sandbox
SUBY_PRODUCT_ID=pro_...               # one-time $1 USD product (CARD)
SUBY_WEBHOOK_SECRET=whsec_...         # dashboard → webhook settings
SUBY_API_BASE_URL=https://api.suby.fi # optional; default v2 API
BETTER_AUTH_URL=https://www.adhud.xyz
```

### Stripe test mode (dev only)

```
MEMBERSHIP_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...              # optional; inline $1 price_data if omitted
```

### Mock simulator

```
MEMBERSHIP_PROVIDER=mock
```

### Optional

```
MEMBERSHIP_CHECKOUT_MOCK=true
VITE_PUBLIC_HOSTNAME=www.adhud.xyz
ALLOW_STRIPE_LIVE=true                 # legacy Stripe live gate only; not needed for Suby
```

## Suby dashboard setup (ops checklist)

Complete these in [Suby dashboard](https://app.suby.fi) before enabling `MEMBERSHIP_PROVIDER=suby` on production:

- [ ] Create merchant account (Suby SAS MoR — no US entity required)
- [ ] **Card Request:** submit proof of business for card acceptance approval
- [ ] Create **one-time** product: **$1.00 USD**, `paymentMethods: ["CARD"]` (card + APMs)
- [ ] Configure **USDC wallet payout** (Base or supported chain)
- [ ] Copy `SUBY_API_KEY` and `SUBY_PRODUCT_ID` into deploy env (never commit)
- [ ] Register webhook URL: `POST https://www.adhud.xyz/api/suby/webhook`
- [ ] Copy webhook secret → `SUBY_WEBHOOK_SECRET`
- [ ] Test sandbox (`sk_sandbox_*`) on preview with `MEMBERSHIP_CHECKOUT_V2=true`
- [ ] Verify `CHECKOUT_SUCCESS` webhook activates membership (not redirect alone)

### API surface (Suby v2)

| Step | Endpoint |
|------|----------|
| Create paylink | `POST /api/payment/create` |
| Poll status (fallback) | `GET /api/payment/:paymentId` |
| Webhook events | `CHECKOUT_SUCCESS`, `PAYMENT_SUCCESS` |

Docs: https://documentation.suby.fi/v2/api-reference/introduction

## API surface (Wahid)

| Endpoint / function | Purpose |
|-------------------|---------|
| `suggestAdhudUsername` | Random available username |
| `checkAdhudUsername` | Uniqueness check |
| `createAdhudAccount` | Create account → checkout URL |
| `payMockCheckout` | Complete mock payment |
| `POST /api/suby/webhook` | Suby `CHECKOUT_SUCCESS` / `PAYMENT_SUCCESS` |
| `POST /api/stripe/webhook` | Stripe `checkout.session.completed` (dev) |
| `GET /checkout/mock` | Payment simulator (no keys) |

## Database

- `migrations/0008_membership_checkout.sql` — `membership_payments`
- `migrations/0009_adhud_accounts.sql` — `adhud_accounts`, `donations.display_name`, `members.username`

`membership_payments.stripe_session_id` stores the external checkout reference for all providers (Stripe session id, Suby `pay_*` id, or mock id).

## Test plan

### Mock simulator (no external keys)

1. `MEMBERSHIP_PROVIDER=mock` + v2 flags
2. **Open account · $1** → username → **Create account & pay $1**
3. `/checkout/mock` → **Simulate successful payment**
4. `@username` on ledger; `/member/{username}` desk

### Suby sandbox

1. Suby dashboard → sandbox key + $1 product
2. Set `MEMBERSHIP_PROVIDER=suby`, `SUBY_API_KEY`, `SUBY_PRODUCT_ID`, `SUBY_WEBHOOK_SECRET`
3. Forward webhooks to preview `/api/suby/webhook`
4. Complete card checkout → membership activates via webhook

### Stripe test mode (legacy dev)

1. `MEMBERSHIP_PROVIDER=stripe` + `sk_test_...`
2. `stripe listen --forward-to localhost:8080/api/stripe/webhook`
3. Card `4242 4242 4242 4242` → membership activates via webhook

### Legacy USDT

- Flag **on:** collapsible **Or join with USDT**
- Flag **off:** 5 USDT only (current production default)
