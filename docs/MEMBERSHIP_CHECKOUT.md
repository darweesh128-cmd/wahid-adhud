# Membership checkout (v2)

Wahid product: **$1 USD membership** via username-first account creation, then **Stripe Checkout (test mode)**. Legacy **5 USDT** join stays available until cutover.

**Payment provider:** Stripe Checkout (preferred). Lemon Squeezy is not wired.

> **Note:** US company formation (e.g. separate Wyoming LLC workstream) is **not a dependency** for building, testing, or merging this product path. Ship the flagged v2 flow with test keys or the mock simulator now.

## Feature flag

| Variable | Where | Effect |
|----------|--------|--------|
| `VITE_MEMBERSHIP_CHECKOUT_V2=true` | Build / client | Shows Open account + $1 flow |
| `MEMBERSHIP_CHECKOUT_V2=true` | Server | Enables account APIs, checkout, webhooks |

**Default (flag off):** existing 5 USDT join only — production unchanged today.

## Product flow (flag on)

```
Open account · $1
    → Pick unique username (+ suggest, availability check)
    → Create account & pay $1 (adhud_accounts row first, status=pending)
    → Checkout:
         • Stripe Checkout TEST when STRIPE_SECRET_KEY=sk_test_...
         • Mock simulator at /checkout/mock when no Stripe key
    → Payment success (webhook or mock)
    → Membership active; ledger display_name=@username
    → Desk at /member/{username}
```

## Checkout modes (build & test now)

| Mode | When | Notes |
|------|------|--------|
| **mock** | No `sk_test_...` (default in dev) | `/checkout/mock` — zero external setup |
| **stripe** | `STRIPE_SECRET_KEY=sk_test_...` | Hosted Checkout **test mode** |
| **off** | Flag off | Legacy USDT only |

Force mock with test keys set: `MEMBERSHIP_CHECKOUT_MOCK=true`

## Environment variables (placeholders — no secrets in git)

### Enable v2 (dev / staging / preview)

```
VITE_MEMBERSHIP_CHECKOUT_V2=true
MEMBERSHIP_CHECKOUT_V2=true
```

### Stripe test mode (use now)

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...              # optional; inline $1 price_data if omitted
BETTER_AUTH_URL=https://www.adhud.xyz
```

### Optional

```
MEMBERSHIP_CHECKOUT_MOCK=true
VITE_PUBLIC_HOSTNAME=www.adhud.xyz
```

## TODO — production live keys (CEO request only, later)

Do **not** add live keys in this PR. When the CEO requests go-live:

- [ ] **TODO:** Obtain `sk_live_...` and live webhook secret from CEO / ops (not self-serve)
- [ ] **TODO:** Confirm payout destination entity + bank are ready (separate from Wahid product work)
- [ ] **TODO:** Set `ALLOW_STRIPE_LIVE=true` only after CEO sign-off
- [ ] **TODO:** Point `STRIPE_SECRET_KEY` at live key in production env (never commit)
- [ ] **TODO:** Register live webhook URL `POST /api/stripe/webhook` in Stripe dashboard
- [ ] **TODO:** Decide USDT cutover — hide secondary panel when card path is primary

Until then, the server **ignores `sk_live_*`** unless `ALLOW_STRIPE_LIVE=true` (safety gate).

## API surface

| Endpoint / function | Purpose |
|-------------------|---------|
| `suggestAdhudUsername` | Random available username |
| `checkAdhudUsername` | Uniqueness check |
| `createAdhudAccount` | Create account → checkout URL |
| `payMockCheckout` | Complete mock payment |
| `POST /api/stripe/webhook` | Stripe `checkout.session.completed` |
| `GET /checkout/mock` | Payment simulator (no keys) |

## Database

- `migrations/0008_membership_checkout.sql` — `membership_payments`
- `migrations/0009_adhud_accounts.sql` — `adhud_accounts`, `donations.display_name`, `members.username`

## Test plan

### Mock simulator (no Stripe account)

1. `VITE_MEMBERSHIP_CHECKOUT_V2=true` + `MEMBERSHIP_CHECKOUT_V2=true`
2. **Open account · $1** → username → **Create account & pay $1**
3. `/checkout/mock` → **Simulate successful payment**
4. `@username` on ledger; `/member/{username}` desk

### Stripe test mode

1. Stripe dashboard → **test mode** → copy `sk_test_...`
2. `stripe listen --forward-to localhost:8080/api/stripe/webhook`
3. Card `4242 4242 4242 4242` → membership activates via webhook

### Legacy USDT

- Flag **on:** collapsible **Or join with USDT**
- Flag **off:** 5 USDT only (current production default)
