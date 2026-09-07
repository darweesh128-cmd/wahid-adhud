import { getSql } from "@/lib/db";
import {
  DEFAULT_POOL_ADDRESSES,
  isValidWallet,
  maskWallet,
  TARGET_USDT,
  type Network,
  type PoolAddresses,
  type PoolSnapshot,
  type PreviousRound,
} from "@/lib/pool";

type RoundRow = {
  id: number;
  target_usdt: number;
  collected_usdt: number;
  donor_count: number;
  status: "open" | "settled";
  winner_wallet: string | null;
  settled_at: string | null;
  created_at: string;
};

type DonationRow = {
  id: number;
  payout_wallet: string;
  network: Network;
  amount_usdt: number;
  created_at: string;
  display_name: string | null;
};

type ConfigRow = {
  id: number;
  trc20_address: string;
  erc20_address: string;
  owner_pass_salt: string | null;
  owner_pass_hash: string | null;
};

function toSnapshot(
  round: RoundRow,
  recent: DonationRow[],
  previous: PreviousRound | null,
  yourTickets: number,
  addresses: PoolAddresses,
  hasOwnerLock: boolean,
): PoolSnapshot {
  const collected = Number(round.collected_usdt);
  const target = Number(round.target_usdt);
  return {
    roundId: Number(round.id),
    target,
    collected,
    donorCount: Number(round.donor_count),
    remaining: Math.max(0, target - collected),
    progress: target > 0 ? Math.min(1, collected / target) : 0,
    status: round.status,
    winnerWallet: round.winner_wallet,
    winnerMasked: round.winner_wallet ? maskWallet(round.winner_wallet) : null,
    recent: recent.map((row) => ({
      id: Number(row.id),
      wallet: row.payout_wallet,
      walletMasked: row.display_name ? `@${row.display_name}` : maskWallet(row.payout_wallet),
      displayName: row.display_name,
      network: row.network,
      amount: Number(row.amount_usdt),
      at: String(row.created_at),
    })),
    previous,
    yourTickets,
    addresses,
    hasOwnerLock,
  };
}

async function ensureConfig(): Promise<ConfigRow> {
  const sql = await getSql();
  const rows = await sql<ConfigRow>`
    select id, trc20_address, erc20_address, owner_pass_salt, owner_pass_hash
    from pool_config
    where id = 1
    limit 1
  `;
  if (rows[0]) return rows[0];
  const created = await sql<ConfigRow>`
    insert into pool_config (id, trc20_address, erc20_address)
    values (${1}, ${DEFAULT_POOL_ADDRESSES.trc20}, ${DEFAULT_POOL_ADDRESSES.erc20})
    on conflict (id) do update set id = pool_config.id
    returning id, trc20_address, erc20_address, owner_pass_salt, owner_pass_hash
  `;
  return created[0] ?? {
    id: 1,
    trc20_address: DEFAULT_POOL_ADDRESSES.trc20,
    erc20_address: DEFAULT_POOL_ADDRESSES.erc20,
    owner_pass_salt: null,
    owner_pass_hash: null,
  };
}

export async function loadSnapshot(wallet?: string): Promise<PoolSnapshot> {
  const sql = await getSql();
  const config = await ensureConfig();
  const addresses: PoolAddresses = {
    trc20: config.trc20_address,
    erc20: config.erc20_address,
  };
  const hasOwnerLock = Boolean(config.owner_pass_hash);

  const openRows = await sql<RoundRow>`
    select id, target_usdt, collected_usdt, donor_count, status, winner_wallet, settled_at, created_at
    from rounds
    where status = 'open'
    order by id desc
    limit 1
  `;
  let round = openRows[0];
  if (!round) {
    const created = await sql<RoundRow>`
      insert into rounds (target_usdt, collected_usdt, donor_count, status)
      values (${TARGET_USDT}, 0, 0, 'open')
      returning id, target_usdt, collected_usdt, donor_count, status, winner_wallet, settled_at, created_at
    `;
    round = created[0];
  }

  const recent = await sql<DonationRow>`
    select id, payout_wallet, network, amount_usdt, created_at, display_name
    from donations
    where round_id = ${round.id}
    order by created_at desc, id desc
    limit 18
  `;

  const prevRows = await sql<RoundRow>`
    select id, target_usdt, collected_usdt, donor_count, status, winner_wallet, settled_at, created_at
    from rounds
    where status = 'settled' and winner_wallet is not null
    order by id desc
    limit 1
  `;
  const prev = prevRows[0];
  const previous: PreviousRound | null =
    prev && prev.winner_wallet && prev.settled_at
      ? {
          roundId: Number(prev.id),
          winnerWallet: prev.winner_wallet,
          winnerMasked: maskWallet(prev.winner_wallet),
          settledAt: String(prev.settled_at),
          collected: Number(prev.collected_usdt),
          donorCount: Number(prev.donor_count),
        }
      : null;

  let yourTickets = 0;
  if (wallet && isValidWallet(wallet)) {
    const ticketRows = await sql<{ n: number }>`
      select count(*)::int as n
      from donations
      where round_id = ${round.id} and payout_wallet = ${wallet.trim()}
    `;
    yourTickets = Number(ticketRows[0]?.n ?? 0);
  }

  return toSnapshot(round, recent, previous, yourTickets, addresses, hasOwnerLock);
}

export async function loadPoolConfig(): Promise<ConfigRow> {
  return ensureConfig();
}
