-- Username-first Adhud accounts (v2 checkout path).
create table if not exists adhud_accounts (
  id serial primary key,
  username text not null,
  country text not null default 'Other',
  payout_wallet text,
  network text default 'trc20',
  status text not null default 'pending',
  setup_token text not null,
  ref_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz
);

create unique index if not exists adhud_accounts_username_lower_idx on adhud_accounts (lower(username));
create unique index if not exists adhud_accounts_setup_token_idx on adhud_accounts (setup_token);
create index if not exists adhud_accounts_status_idx on adhud_accounts (status);

alter table membership_payments
  add column if not exists account_id integer references adhud_accounts (id),
  add column if not exists username text;

alter table membership_payments alter column payout_wallet drop not null;

alter table donations
  add column if not exists display_name text,
  add column if not exists account_id integer references adhud_accounts (id);

alter table members
  add column if not exists username text,
  add column if not exists account_id integer references adhud_accounts (id);

create unique index if not exists members_username_lower_idx
  on members (lower(username))
  where username is not null;
