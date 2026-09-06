update pool_config
set
  trc20_address = 'TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER',
  owner_pass_salt = '6900377c79048b8d46328ddcf9a7a69c',
  owner_pass_hash = '0117152d5c6f34b8ed094cfc907144e4f17a299b5d144f49b38330f0f6d9b58b',
  updated_at = now()
where id = 1;

create table if not exists members (
  payout_wallet text primary key,
  country text not null default 'Other',
  given_usdt integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id serial primary key,
  from_wallet text not null,
  to_wallet text not null,
  body text not null default '',
  file_name text,
  file_mime text,
  created_at timestamptz not null default now()
);

create index if not exists messages_to_idx on messages (to_wallet, created_at desc);
create index if not exists messages_from_idx on messages (from_wallet, created_at desc);
create index if not exists messages_pair_idx on messages (from_wallet, to_wallet, created_at desc);

insert into members (payout_wallet, country, given_usdt)
select payout_wallet, 'Other', count(*)::int
from donations
group by payout_wallet
on conflict (payout_wallet) do nothing;

insert into messages (from_wallet, to_wallet, body)
select
  'TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER',
  payout_wallet,
  'The House is open. This desk is yours — ledger, messages, any Adhud. Your dollar is an arm.'
from members;
