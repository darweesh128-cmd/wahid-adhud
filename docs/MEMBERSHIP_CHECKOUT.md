# Membership checkout (v2)

Wahid product: **$1 USD membership** via username-first account creation, then hosted checkout. Legacy **5 USDT** join stays available as secondary path.

**Live payment provider:** **Lemon Squeezy** (Mohamad cutover). Stripe Checkout remains as optional dev/test code path; Stripe live keys are **not required** for production.

> **Payout note:** Lemon Squeezy is MoR for **collection** ($1 checkout + webhook). **Payouts** from Lemon are **bank or PayPal only** — not crypto wallets ([Lemon docs](https://docs.lemonsqueezy.com/help/getting-started/getting-paid)). Mohamad may withdraw to bank/PayPal and convert off-platform, or ops may switch MoR later. No US entity or Stripe live keys needed for cutover.

## Feature flag

| Variable | Where | Effect |
|----------|--------|--------|
| `VITE_MEMBERSHIP_CHECKOUT_V2=true` | Build / client | Shows Open account + $1 flow |
| `MEMBERSHIP_CHECKOUT_V2=true` | Server | Enables account APIs, checkout, webhooks |

**Default:** v2 ON in production (PR #15). Set `=false` to opt out.

## Product flow (flag on)

```
Open account · $1
    → Pick unique username (+ suggest, availability check)
    → Create account & pay $1 (adhud_accounts row first, status=pending)
    → Checkout:
         • Lemon Squeezy when LEMON_SQUEEZY_* env configured (live cutover)
         • Stripe Checkout TEST when STRIPE_SECRET_KEY=sk_test_...
         • Mock simulator at /checkout/mock when neither configured
    → Payment success (webhook or mock)
    → Membership active; ledger display_name=@username
    → Desk at /member/{username}
```

## Checkout modes

| Mode | When | Notes |
|------|------|--------|
| **lemon** | `LEMON_SQUEEZY_API_KEY` + store + variant IDs set | **Live cutover path** |
| **mock** | No Lemon/Stripe keys (default in dev) | `/checkout/mock` — zero external setup |
| **stripe** | `STRIPE_SECRET_KEY=sk_test_...` (no Lemon) | Hosted Checkout **test mode** |
| **off** | Flag off | Legacy USDT only |

Override auto-selection: `PAYMENT_PROVIDER=lemon|stripe|mock`

Force mock with keys set: `MEMBERSHIP_CHECKOUT_MOCK=true`

## Environment variables (placeholders — no secrets in git)

### Enable v2

```
VITE_MEMBERSHIP_CHECKOUT_V2=true
MEMBERSHIP_CHECKOUT_V2=true
BETTER_AUTH_URL=https://www.adhud.xyz
```

### Lemon Squeezy (live cutover — preferred)

```
LEMON_SQUEEZY_API_KEY=...
LEMON_SQUEEZY_STORE_ID=...
LEMON_SQUEEZY_VARIANT_ID=...
LEMON_SQUEEZY_WEBHOOK_SECRET=...
LEMON_SQUEEZY_TEST_MODE=true          # optional; use test mode in Lemon dashboard
PAYMENT_PROVIDER=lemon                  # optional; auto when Lemon keys present
```

Register webhook in Lemon dashboard:
- URL: `POST https://www.adhud.xyz/api/lemon/webhook`
- Event: `order_created`
- Signing secret → `LEMON_SQUEEZY_WEBHOOK_SECRET`

### Stripe test mode (optional dev path)

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...              # optional; inline $1 price_data if omitted
```

Stripe live (`sk_live_*`) is **not required** for Wahid cutover. `ALLOW_STRIPE_LIVE=true` gate remains for safety if ever needed.

### Optional

```
MEMBERSHIP_CHECKOUT_MOCK=true
VITE_PUBLIC_HOSTNAME=www.adhud.xyz
```

## API surface

| Endpoint / function | Purpose |
|-------------------|---------|
| `suggestAdhudUsername` | Random available username |
| `checkAdhudUsername` | Uniqueness check |
| `createAdhudAccount` | Create account → checkout URL |
| `payMockCheckout` | Complete mock payment |
| `POST /api/lemon/webhook` | Lemon `order_created` → membership |
| `POST /api/stripe/webhook` | Stripe `checkout.session.completed` (optional) |
| `GET /checkout/mock` | Payment simulator (no keys) |

## Database

- `migrations/0008_membership_checkout.sql` — `membership_payments`
- `migrations/0009_adhud_accounts.sql` — `adhud_accounts`, `donations.display_name`, `members.username`
- `migrations/0010_lemon_checkout.sql` — `lemon_checkout_id`, `lemon_order_id`

## Test plan

### Mock simulator (no payment account)

1. `VITE_MEMBERSHIP_CHECKOUT_V2=true` + `MEMBERSHIP_CHECKOUT_V2=true`
2. **Open account · $1** → username → **Create account & pay $1**
3. `/checkout/mock` → **Simulate successful payment**
4. `@username` on ledger; `/member/{username}` desk

### Lemon Squeezy (live)

1. Set `LEMON_SQUEEZY_*` env vars in Vercel
2. Register webhook `POST /api/lemon/webhook`
3. Complete $1 checkout → membership activates via `order_created` webhook

### Stripe test mode (optional)

1. Stripe dashboard → **test mode** → copy `sk_test_...`
2. `stripe listen --forward-to localhost:8080/api/stripe/webhook`
3. Card `4242 4242 4242 4242` → membership activates via webhook

### Legacy USDT

- Flag **on:** collapsible **Or join with USDT**
- Flag **off:** 5 USDT only
