-- Lemon Squeezy checkout identifiers (live payment path).
alter table membership_payments
  add column if not exists lemon_checkout_id text,
  add column if not exists lemon_order_id text;

create unique index if not exists membership_payments_lemon_checkout_uidx
  on membership_payments (lemon_checkout_id)
  where lemon_checkout_id is not null;

create unique index if not exists membership_payments_lemon_order_uidx
  on membership_payments (lemon_order_id)
  where lemon_order_id is not null;
