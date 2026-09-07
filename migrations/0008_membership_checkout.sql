-- Stripe / card membership checkout records (v2 join path).
create table if not exists membership_payments (
  id serial primary key,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  payout_wallet text not null,
  country text not null default 'Other',
  network text not null default 'trc20',
  amount_cents integer not null default 100,
  currency text not null default 'usd',
  status text not null default 'pending',
  ref_slug text,
  donation_id integer references donations (id),
  client_stamp text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists membership_payments_wallet_idx on membership_payments (payout_wallet);
create index if not exists membership_payments_status_idx on membership_payments (status);
create unique index if not exists membership_payments_intent_uidx
  on membership_payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
