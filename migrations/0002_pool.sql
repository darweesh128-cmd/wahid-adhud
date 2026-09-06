create table if not exists rounds (
  id serial primary key,
  target_usdt integer not null default 1000000,
  collected_usdt integer not null default 0,
  donor_count integer not null default 0,
  status text not null default 'open',
  winner_wallet text,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists donations (
  id serial primary key,
  round_id integer not null references rounds(id),
  payout_wallet text not null,
  network text not null default 'trc20',
  amount_usdt integer not null default 1,
  client_stamp text,
  created_at timestamptz not null default now()
);

create index if not exists donations_round_id_idx on donations (round_id);
create index if not exists donations_created_at_idx on donations (created_at desc);
create index if not exists donations_stamp_idx on donations (client_stamp, created_at desc);
create index if not exists donations_wallet_round_idx on donations (round_id, payout_wallet);

insert into rounds (target_usdt, collected_usdt, donor_count, status)
values (1000000, 0, 0, 'open');
