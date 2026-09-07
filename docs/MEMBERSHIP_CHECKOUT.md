# Membership checkout (v2)

$1 USD membership via **username-first account creation**, then **Stripe Checkout (test mode only)**. Legacy **5 USDT** self-attest join stays available until cutover.

**Payment provider:** Stripe Checkout (preferred). Lemon Squeezy is not wired in this PR.

## US entity & payouts (do not wire production yet)

| Item | Status |
|------|--------|
| Proposed entity | **Ashrim LLC** (Wyoming) |
| Filing | **Not filed yet** |
| EIN | Not available |
| Company bank | Not available |
| Production payouts | **Blocked** — do not connect live Stripe or company payout rails |

**Production Stripe keys (`sk_live_*`) must wait** until:

1. Wyoming LLC is filed and active  
2. EIN is issued  
3. Company bank account is open and linked to Stripe  

Until then, use only:

- Built-in **mock simulator** (`/checkout/mock`) — no keys  
- Stripe **test mode** (`sk_test_...`, `whsec_...` from test dashboard)

The server **ignores `sk_live_*`** unless `ALLOW_STRIPE_LIVE=true` (do not set until the checklist above is complete).

## Feature flag

| Variable | Where | Effect |
|----------|--------|--------|
| `VITE_MEMBERSHIP_CHECKOUT_V2=true` | Build / client | Shows Open account + $1 flow |
| `MEMBERSHIP_CHECKOUT_V2=true` | Server | Enables account APIs, checkout, webhooks |

**Default (flag off):** only the existing 5 USDT join path — no behavior change on production today.

## Join flow (flag on)

```
Open account · $1
    → Pick unique username (+ suggest, availability check)
    → Create account & pay $1 (adhud_accounts row first, status=pending)
    → Checkout:
         • Stripe Checkout TEST when STRIPE_SECRET_KEY=sk_test_...
         • Mock simulator at /checkout/mock when no usable Stripe key
    → Payment success (webhook or mock)
    → Membership active; ledger display_name=@username
    → Desk at /member/{username}
```

## Checkout modes

| Mode | When | Notes |
|------|------|--------|
| **mock** | No `sk_test_...` key (default in dev) | `/checkout/mock` — no external accounts |
| **stripe** | `STRIPE_SECRET_KEY=sk_test_...` | Hosted Checkout **test mode only** |
| **off** | Flag off | Legacy USDT only |

Force mock even with test keys: `MEMBERSHIP_CHECKOUT_MOCK=true`

## Environment variables (placeholders — no secrets in git)

### Enable v2 flow (dev / staging)

```
VITE_MEMBERSHIP_CHECKOUT_V2=true
MEMBERSHIP_CHECKOUT_V2=true
```

### Stripe test mode only (safe before US entity)

```
STRIPE_SECRET_KEY=sk_test_...          # TEST only — never sk_live_ until entity ready
STRIPE_WEBHOOK_SECRET=whsec_...        # from `stripe listen` or test webhook endpoint
STRIPE_PRICE_ID=price_...              # optional test price; inline $1 used if omitted
BETTER_AUTH_URL=https://www.adhud.xyz  # success/cancel redirect origin
```

### Optional

```
MEMBERSHIP_CHECKOUT_MOCK=true          # force simulator
VITE_PUBLIC_HOSTNAME=www.adhud.xyz
```

### Production (blocked until entity + EIN + bank)

```
# DO NOT SET until Ashrim LLC (Wyoming) is filed, EIN issued, company bank linked:
# STRIPE_SECRET_KEY=sk_live_...
# ALLOW_STRIPE_LIVE=true               # explicit opt-in gate for live keys
```

### Lemon Squeezy

Deferred. If needed later, same username-first sequence; Stripe remains preferred.

## API surface

| Endpoint / function | Purpose |
|-------------------|---------|
| `suggestAdhudUsername` | Random available username |
| `checkAdhudUsername` | Uniqueness check |
| `createAdhudAccount` | Create account → checkout URL |
| `payMockCheckout` | Complete mock payment |
| `POST /api/stripe/webhook` | Stripe `checkout.session.completed` (test) |
| `GET /checkout/mock` | Dev/QA payment simulator |

## Database

- `migrations/0008_membership_checkout.sql` — `membership_payments`
- `migrations/0009_adhud_accounts.sql` — `adhud_accounts`, `donations.display_name`, `members.username`

## Test plan

### Mock simulator (no keys, no entity)

1. `VITE_MEMBERSHIP_CHECKOUT_V2=true` + `MEMBERSHIP_CHECKOUT_V2=true`
2. **Open account · $1** → username → **Create account & pay $1**
3. `/checkout/mock` → **Simulate successful payment**
4. `@username` on ledger; `/member/{username}` desk

### Stripe test mode (before company exists)

1. Create Stripe account in **test mode** (personal/dashboard OK for dev)
2. `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET`
3. `stripe listen --forward-to localhost:8080/api/stripe/webhook`
4. Test card `4242 4242 4242 4242` → webhook activates membership

### Legacy USDT

- Flag **on:** USDT under **Or join with USDT** (secondary)
- Flag **off:** production default — 5 USDT only

## Go-live checklist (future — not blocking this PR)

- [ ] Ashrim LLC (Wyoming) filed  
- [ ] EIN received  
- [ ] Company bank account opened  
- [ ] Stripe live account linked to company bank  
- [ ] `sk_live_...` + `ALLOW_STRIPE_LIVE=true`  
- [ ] Retire or hide USDT secondary path when ready  
