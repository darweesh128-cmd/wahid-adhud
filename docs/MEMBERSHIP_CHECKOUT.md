# Membership checkout (v2)

Wahid product: **$1 USD membership** via username-first account creation, then **card checkout** (Suby live MoR preferred, Stripe test/mock for dev). Legacy **5 USDT** join stays available until cutover.

**Live payment target:** [Suby](https://www.suby.fi) — Merchant of Record (FR entity Suby SAS). Customer pays by card (+ APMs); merchant receives **USDC** to wallet. No US bank account or EIN required.

Signup: https://app.suby.fi  
Docs: https://documentation.suby.fi/llms.txt · https://docs.suby.fi/v3-beta/

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
| `suby` | Live card → USDC | **Production target** — Mohamad confirmed |
| `stripe` | Dev / legacy test | Stripe Checkout **test mode** (`sk_test_*`) |
| `mock` | Local QA | Built-in simulator at `/checkout/mock` |
| *(unset)* | Auto | Suby if `SUBY_API_KEY` set, else Stripe test, else mock |

Force mock even with keys: `MEMBERSHIP_CHECKOUT_MOCK=true`

## Product flow (flag on)

```
Open account · $1
    → Pick unique username (+ suggest, availability check)
    → Create account & pay $1 (adhud_accounts row first, status=pending)
    → Checkout:
         • Suby v2 hosted payment (pay_…) when MEMBERSHIP_PROVIDER=suby (production default)
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
SUBY_API_KEY=                          # sk_live_… or sk_sandbox_…
SUBY_WEBHOOK_SECRET=                     # whsec_… from dashboard
SUBY_PRODUCT_ID=                         # pro_… one-time $1 product (optional on v3)
SUBY_PRICE_CENTS=100                     # optional ad-hoc price if no product (v3 default: 100)
SUBY_API_VERSION=v2                      # optional; default v2 (production). Set v3 for beta /api.beta.suby.fi
SUBY_API_BASE_URL=https://api.suby.fi    # optional; v2 default (production)
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
```

## Suby dashboard setup (ops checklist)

Complete in [Suby dashboard](https://app.suby.fi) before enabling `MEMBERSHIP_PROVIDER=suby` on production:

- [ ] Create merchant account (Suby SAS MoR — no US entity required)
- [ ] **Card Request:** submit proof of business for card acceptance approval
- [ ] Create **one-time** product: **$1.00 USD**, card + APMs — copy `SUBY_PRODUCT_ID` (or use ad-hoc `SUBY_PRICE_CENTS` on v3)
- [ ] Configure **USDC wallet payout**
- [ ] Copy `SUBY_API_KEY` into deploy env (never commit)
- [ ] Register webhook URL: `POST https://www.adhud.xyz/api/suby/webhook`
- [ ] Copy webhook secret → `SUBY_WEBHOOK_SECRET`
- [ ] Sandbox test with `sk_sandbox_…` on preview (`MEMBERSHIP_CHECKOUT_V2=true`)
- [ ] Verify **`checkout.succeeded`** (v3) or **`CHECKOUT_SUCCESS`** (v2) activates membership — not redirect alone

### Suby API (Mohamad-confirmed)

| Integration | Endpoint | Base URL |
|-------------|----------|----------|
| **v2 payment (production default)** | `POST /api/payment/create` | `https://api.suby.fi` |
| Poll payment | `GET /api/payment/{id}` | paid status in `SUCCEEDED`/`SUCCESS`/… |
| v3 checkout (beta) | `POST /v3/checkout/sessions` | `https://api.beta.suby.fi` (`SUBY_API_VERSION=v3`) |
| Poll session | `GET /v3/checkout/sessions/{id}` | status `COMPLETED` |

Auth: header `X-Suby-Api-Key`

### Webhooks — grant membership on

| Event | API | When to fulfill |
|-------|-----|-----------------|
| `CHECKOUT_SUCCESS` | v2 | Card checkout authorized (**production primary**) |
| `checkout.succeeded` | v3 | Card hosted checkout complete |
| `payment.succeeded` | v3 | Accepted (idempotent; also fires after capture) |

Verify: HMAC-SHA256 of ``${timestamp}.${rawBody}`` → `X-Webhook-Signature: v1=…`

## API surface (Wahid)

| Endpoint / function | Purpose |
|-------------------|---------|
| `suggestAdhudUsername` | Random available username |
| `checkAdhudUsername` | Uniqueness check |
| `createAdhudAccount` | Create account → checkout URL |
| `payMockCheckout` | Complete mock payment |
| `POST /api/suby/webhook` | Suby signed payment events |
| `POST /api/stripe/webhook` | Stripe `checkout.session.completed` (dev) |
| `GET /checkout/mock` | Payment simulator (no keys) |

## Database

- `migrations/0008_membership_checkout.sql` — `membership_payments`
- `migrations/0009_adhud_accounts.sql` — `adhud_accounts`, `donations.display_name`, `members.username`

`membership_payments.stripe_session_id` stores the external checkout reference (`cs_…`, `pay_…`, Stripe `cs_…`, or mock id).

## Test plan

### Mock simulator (no external keys)

1. `MEMBERSHIP_PROVIDER=mock` + v2 flags
2. **Open account · $1** → username → **Create account & pay $1**
3. `/checkout/mock` → **Simulate successful payment**
4. `@username` on ledger; `/member/{username}` desk

### Suby sandbox (v2 production path)

1. https://app.suby.fi → live or sandbox key + $1 product (`SUBY_PRODUCT_ID`)
2. Set `MEMBERSHIP_PROVIDER=suby`, `SUBY_API_VERSION=v2`, `SUBY_API_KEY`, optional `SUBY_WEBHOOK_SECRET`
3. Forward webhooks to preview `/api/suby/webhook`
4. Complete card checkout → membership activates via `CHECKOUT_SUCCESS` webhook

### Stripe test mode (legacy dev)

1. `MEMBERSHIP_PROVIDER=stripe` + `sk_test_...`
2. `stripe listen --forward-to localhost:8080/api/stripe/webhook`
3. Card `4242 4242 4242 4242` → membership activates via webhook

### Legacy USDT

- Flag **on:** collapsible **Or join with USDT**
- Flag **off:** 5 USDT only (current production default)
