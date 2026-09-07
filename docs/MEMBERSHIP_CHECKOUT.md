# Membership checkout (v2)

$1 USD membership via **username-first account creation**, then card checkout. Legacy **5 USDT** self-attest join stays available until cutover.

## Feature flag

| Variable | Where | Effect |
|----------|--------|--------|
| `VITE_MEMBERSHIP_CHECKOUT_V2=true` | Build / client | Shows account + $1 flow on the home page |
| `MEMBERSHIP_CHECKOUT_V2=true` | Server | Enables account APIs, checkout, webhooks |

**Default (flag off):** only the existing 5 USDT join path — no behavior change on production today.

## Join flow (flag on)

```
User clicks "Create account · $1"
    → Pick unique username (+ country)
    → Server creates adhud_accounts row (status=pending)
    → Redirect to checkout:
         • Stripe Checkout (test/live) when STRIPE_SECRET_KEY is set
         • Built-in mock simulator at /checkout/mock when no Stripe key
    → Payment success (webhook or mock)
    → activateAccountMembership: donation + member + ledger display_name=@username
    → Desk at /member/{username}
```

## Checkout modes

| Mode | When | Notes |
|------|------|--------|
| **mock** | No `STRIPE_SECRET_KEY` (default in dev) | `/checkout/mock` simulates $1 payment — no external keys |
| **stripe** | `STRIPE_SECRET_KEY` set | Hosted Checkout; use Stripe **test** keys until Mohamad provisions US entity live keys |
| **off** | Flag off or misconfigured | Legacy USDT only |

Force mock even with Stripe keys: `MEMBERSHIP_CHECKOUT_MOCK=true`

## Environment variables (placeholders — no secrets in git)

### Required for v2 UI

```
VITE_MEMBERSHIP_CHECKOUT_V2=true
MEMBERSHIP_CHECKOUT_V2=true
```

### Stripe test / production (Mohamad via CEO — add when ready)

```
STRIPE_SECRET_KEY=sk_test_...          # or sk_live_... in production
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...              # optional; inline $1 price_data used if omitted
BETTER_AUTH_URL=https://www.adhud.xyz  # success/cancel redirect origin
```

### Optional

```
MEMBERSHIP_CHECKOUT_MOCK=true          # force simulator
VITE_PUBLIC_HOSTNAME=www.adhud.xyz       # fallback origin
```

### Lemon Squeezy (future)

Not wired in this PR. Same account-first sequence applies; swap hosted checkout provider when keys arrive.

## API surface

| Endpoint / function | Purpose |
|-------------------|---------|
| `suggestAdhudUsername` | Random available username |
| `checkAdhudUsername` | Uniqueness check |
| `createAdhudAccount` | Create account → checkout URL |
| `payMockCheckout` | Complete mock payment |
| `POST /api/stripe/webhook` | Stripe `checkout.session.completed` |
| `GET /checkout/mock` | Dev/QA payment simulator page |

## Database

- `migrations/0008_membership_checkout.sql` — `membership_payments`
- `migrations/0009_adhud_accounts.sql` — `adhud_accounts`, `donations.display_name`, `members.username`

## Test plan

### Mock simulator (no keys)

1. Set `VITE_MEMBERSHIP_CHECKOUT_V2=true` and `MEMBERSHIP_CHECKOUT_V2=true`
2. Open `/` → **Create account · $1**
3. Choose username → continue → `/checkout/mock`
4. **Simulate successful payment**
5. Confirm: toast, share overlay, `@username` on recent ledger, `/member/{username}` desk

### Stripe test mode

1. Add `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET`, optional `STRIPE_PRICE_ID`
2. `stripe listen --forward-to localhost:8080/api/stripe/webhook`
3. Use test card `4242 4242 4242 4242`
4. Confirm webhook activates membership and ledger shows `@username`

### Legacy USDT (flag on)

1. Expand **Or join with USDT** — 5 USDT flow unchanged
2. Flag **off** — only legacy path visible (production default)

## Cutover

When ready to retire USDT join: remove or hide the USDT secondary panel and set production Stripe live keys. Until then, keep `MEMBERSHIP_CHECKOUT_V2` off on production or enable with USDT as fallback.
