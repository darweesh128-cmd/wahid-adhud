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

insert into rounds (
  id, target_usdt, collected_usdt, donor_count, status, winner_wallet, settled_at, created_at
) values (
  1,
  1000000,
  1000000,
  841203,
  'settled',
  'T2jS9rZGygP6oWDvdL3kTAsaHzhQ7pXEwe',
  now() - interval '18 days',
  now() - interval '94 days'
);

insert into rounds (
  id, target_usdt, collected_usdt, donor_count, status, created_at
) values (
  2,
  1000000,
  128447,
  109882,
  'open',
  now() - interval '18 days'
);

select setval('rounds_id_seq', 2, true);

insert into donations (round_id, payout_wallet, network, amount_usdt, created_at) values
  (2, 'TTAsaHzhQ7pXEweM4mUBtbJ1iR8qYFxfN5', 'trc20', 1, now() - interval '2 minutes'),
  (2, 'TtbJ1iR8qYFxfN5nVCucK2jS9rZGygP6oW', 'trc20', 1, now() - interval '5 minutes'),
  (2, '0x4b2a91c8d0e7f13a6c9b55e8012347ab89cd0123', 'erc20', 1, now() - interval '8 minutes'),
  (2, 'TK2jS9rZGygP6oWDvdL3kTAsaHzhQ7pXEw', 'trc20', 1, now() - interval '11 minutes'),
  (2, 'TkTAsaHzhQ7pXEweM4mUBtbJ1iR8qYFxfN', 'trc20', 1, now() - interval '14 minutes'),
  (2, 'TBtbJ1iR8qYFxfN5nVCucK2jS9rZGygP6o', 'trc20', 1, now() - interval '19 minutes'),
  (2, 'TcK2jS9rZGygP6oWDvdL3kTAsaHzhQ7pXE', 'trc20', 1, now() - interval '23 minutes'),
  (2, 'T3kTAsaHzhQ7pXEweM4mUBtbJ1iR8qYFxf', 'trc20', 1, now() - interval '28 minutes'),
  (2, 'TUBtbJ1iR8qYFxfN5nVCucK2jS9rZGygP6', 'trc20', 1, now() - interval '34 minutes'),
  (2, '0x91e0c4aa77b2d8f0c1e3456789ab0def12345678', 'erc20', 1, now() - interval '41 minutes'),
  (2, 'TucK2jS9rZGygP6oWDvdL3kTAsaHzhQ7pX', 'trc20', 1, now() - interval '48 minutes'),
  (2, 'TL3kTAsaHzhQ7pXEweM4mUBtbJ1iR8qYFx', 'trc20', 1, now() - interval '56 minutes'),
  (2, 'TmUBtbJ1iR8qYFxfN5nVCucK2jS9rZGygP', 'trc20', 1, now() - interval '67 minutes'),
  (2, 'TCucK2jS9rZGygP6oWDvdL3kTAsaHzhQ7p', 'trc20', 1, now() - interval '80 minutes'),
  (2, 'TdL3kTAsaHzhQ7pXEweM4mUBtbJ1iR8qYF', 'trc20', 1, now() - interval '95 minutes'),
  (2, 'T4mUBtbJ1iR8qYFxfN5nVCucK2jS9rZGyg', 'trc20', 1, now() - interval '110 minutes'),
  (2, 'TVCucK2jS9rZGygP6oWDvdL3kTAsaHzhQ7', 'trc20', 1, now() - interval '130 minutes'),
  (2, 'TvdL3kTAsaHzhQ7pXEweM4mUBtbJ1iR8qY', 'trc20', 1, now() - interval '155 minutes');
