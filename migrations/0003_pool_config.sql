create table if not exists pool_config (
  id integer primary key default 1,
  trc20_address text not null,
  erc20_address text not null,
  owner_pass_salt text,
  owner_pass_hash text,
  updated_at timestamptz not null default now()
);

insert into pool_config (id, trc20_address, erc20_address)
values (
  1,
  'TbJ1iR8qYFxfN5nVCucK2jS9rZGygP6oWD',
  '0x576161686964506f6f6c00000000000000000001'
)
on conflict (id) do nothing;

create table if not exists owner_attempts (
  id serial primary key,
  client_stamp text not null,
  created_at timestamptz not null default now()
);

create index if not exists owner_attempts_stamp_idx on owner_attempts (client_stamp, created_at desc);
