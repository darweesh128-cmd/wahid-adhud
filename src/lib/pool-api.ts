import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import {
  DEFAULT_POOL_ADDRESSES,
  HOUSE_WALLET,
  countryFromWallet,
  detectNetwork,
  isCountry,
  isValidWallet,
  maskWallet,
  TARGET_USDT,
  UNIT_USDT,
  type ChatMessage,
  type InboxThread,
  type MemberProfile,
  type Network,
  type NetworkSnapshot,
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
};

type ConfigRow = {
  id: number;
  trc20_address: string;
  erc20_address: string;
  owner_pass_salt: string | null;
  owner_pass_hash: string | null;
};

const HOURLY_CAP = 12;
const OWNER_ATTEMPT_CAP = 8;
const MESSAGE_CAP = 30;
const HOUSE_WELCOME =
  "The House is open. This desk is yours — ledger, messages, any ʿAḍīd. Your dollar is an arm.";

function hashStamp(ip: string): string {
  return createHash("sha256").update(`waahid:${ip}`).digest("hex").slice(0, 20);
}

async function clientStamp(): Promise<string> {
  const { getRequestIP } = await import("@tanstack/react-start/server");
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  return hashStamp(ip);
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

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
      walletMasked: maskWallet(row.payout_wallet),
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

async function loadSnapshot(wallet?: string): Promise<PoolSnapshot> {
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
    select id, payout_wallet, network, amount_usdt, created_at
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

async function tooManyOwnerAttempts(): Promise<boolean> {
  const sql = await getSql();
  const stamp = await clientStamp();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n
    from owner_attempts
    where client_stamp = ${stamp}
      and created_at > now() - interval '1 hour'
  `;
  return Number(rows[0]?.n ?? 0) >= OWNER_ATTEMPT_CAP;
}

async function recordOwnerAttempt(): Promise<void> {
  const sql = await getSql();
  const stamp = await clientStamp();
  await sql`insert into owner_attempts (client_stamp) values (${stamp})`;
}

function parseAddresses(data: { trc20: string; erc20?: string }): { ok: true; trc20: string; erc20: string } | { ok: false; error: string } {
  const trc20 = data.trc20.trim();
  if (!isValidWallet(trc20, "trc20")) {
    return { ok: false, error: "Invalid TRC-20 address. It must start with T and be 34 characters." };
  }
  const ercRaw = (data.erc20 ?? "").trim();
  if (ercRaw && !isValidWallet(ercRaw, "erc20")) {
    return { ok: false, error: "Invalid ERC-20 address. It must start with 0x." };
  }
  return { ok: true, trc20, erc20: ercRaw };
}

export const getPool = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (data == null || typeof data !== "object") return { wallet: undefined as string | undefined };
    const wallet = "wallet" in data ? data.wallet : undefined;
    if (wallet == null || wallet === "") return { wallet: undefined as string | undefined };
    if (typeof wallet !== "string") throw new Error("Invalid wallet");
    return { wallet: wallet.trim().slice(0, 128) };
  })
  .handler(async ({ data }) => loadSnapshot(data.wallet));

export type ContributeResult =
  | { ok: true; settled: false; snapshot: PoolSnapshot }
  | { ok: true; settled: true; winnerWallet: string; snapshot: PoolSnapshot }
  | { ok: false; error: string };

export type OwnerResult = { ok: true; snapshot: PoolSnapshot } | { ok: false; error: string };

export const claimOwner = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const password = "password" in data ? data.password : undefined;
    const trc20 = "trc20" in data ? data.trc20 : undefined;
    const erc20 = "erc20" in data ? data.erc20 : undefined;
    if (typeof password !== "string" || typeof trc20 !== "string") throw new Error("Invalid data");
    return { password, trc20, erc20: typeof erc20 === "string" ? erc20 : "" };
  })
  .handler(async ({ data }): Promise<OwnerResult> => {
    if (data.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    const parsed = parseAddresses(data);
    if (!parsed.ok) return parsed;
    if (await tooManyOwnerAttempts()) return { ok: false, error: "Too many attempts. Wait, then try again." };
    const sql = await getSql();
    const config = await ensureConfig();
    if (config.owner_pass_hash) {
      await recordOwnerAttempt();
      return { ok: false, error: "Admin is already live. Use the password to change the wallet." };
    }
    const erc20 = parsed.erc20 || config.erc20_address;
    const { salt, hash } = hashPassword(data.password);
    await sql`
      update pool_config
      set trc20_address = ${parsed.trc20}, erc20_address = ${erc20},
          owner_pass_salt = ${salt}, owner_pass_hash = ${hash}, updated_at = now()
      where id = 1 and owner_pass_hash is null
    `;
    return { ok: true, snapshot: await loadSnapshot() };
  });

export const updatePoolWallet = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const password = "password" in data ? data.password : undefined;
    const trc20 = "trc20" in data ? data.trc20 : undefined;
    const erc20 = "erc20" in data ? data.erc20 : undefined;
    if (typeof password !== "string" || typeof trc20 !== "string") throw new Error("Invalid data");
    return { password, trc20, erc20: typeof erc20 === "string" ? erc20 : "" };
  })
  .handler(async ({ data }): Promise<OwnerResult> => {
    const parsed = parseAddresses(data);
    if (!parsed.ok) return parsed;
    if (await tooManyOwnerAttempts()) return { ok: false, error: "Too many attempts. Wait, then try again." };
    const sql = await getSql();
    const config = await ensureConfig();
    if (!config.owner_pass_hash || !config.owner_pass_salt) {
      return { ok: false, error: "Set a password first to unlock admin." };
    }
    if (!verifyPassword(data.password, config.owner_pass_salt, config.owner_pass_hash)) {
      await recordOwnerAttempt();
      return { ok: false, error: "Wrong password." };
    }
    const erc20 = parsed.erc20 || config.erc20_address;
    await sql`
      update pool_config
      set trc20_address = ${parsed.trc20}, erc20_address = ${erc20}, updated_at = now()
      where id = 1
    `;
    return { ok: true, snapshot: await loadSnapshot() };
  });

export const contribute = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const wallet = "wallet" in data ? data.wallet : undefined;
    const network = "network" in data ? data.network : undefined;
    const countryRaw = "country" in data ? data.country : undefined;
    if (typeof wallet !== "string") throw new Error("Enter a USDT wallet");
    if (network !== "trc20" && network !== "erc20") throw new Error("Unsupported network");
    const country = typeof countryRaw === "string" && isCountry(countryRaw) ? countryRaw : "Other";
    const refRaw = "ref" in data ? data.ref : undefined;
    const ref =
      typeof refRaw === "string" && /^[a-z0-9]{4,12}$/i.test(refRaw.trim()) ? refRaw.trim().toLowerCase() : null;
    return { wallet: wallet.trim(), network: network as Network, country, ref };
  })
  .handler(async ({ data }): Promise<ContributeResult> => {
    const wallet = data.wallet;
    const detected = detectNetwork(wallet);
    if (!detected) {
      return { ok: false, error: "Invalid wallet. Use TRC-20 (T…) or ERC-20 (0x…)." };
    }
    if (data.network !== detected) {
      return {
        ok: false,
        error: detected === "trc20" ? "That is a Tron address. Choose TRC-20." : "That is an Ethereum address. Choose ERC-20.",
      };
    }
    const sql = await getSql();
    const stamp = await clientStamp();
    const recentFromStamp = await sql<{ n: number }>`
      select count(*)::int as n from donations
      where client_stamp = ${stamp} and created_at > now() - interval '1 hour'
    `;
    if (Number(recentFromStamp[0]?.n ?? 0) >= HOURLY_CAP) {
      return { ok: false, error: "Hourly limit reached from this device. Try later." };
    }
    const openRows = await sql<RoundRow>`
      select id, target_usdt, collected_usdt, donor_count, status, winner_wallet, settled_at, created_at
      from rounds where status = 'open' order by id desc limit 1 for update
    `;
    const round = openRows[0];
    if (!round) return { ok: false, error: "No open round." };
    if (Number(round.collected_usdt) >= Number(round.target_usdt)) {
      return { ok: false, error: "This round is full." };
    }
    const prior = await sql<{ id: number }>`
      select id from donations where round_id = ${round.id} and payout_wallet = ${wallet} limit 1
    `;
    const isNewDonor = prior.length === 0;
    await sql`
      insert into donations (round_id, payout_wallet, network, amount_usdt, client_stamp, ref_slug)
      values (${round.id}, ${wallet}, ${detected}, ${UNIT_USDT}, ${stamp}, ${data.ref})
    `;
    await sql`
      insert into members (payout_wallet, country, given_usdt)
      values (${wallet}, ${data.country}, ${UNIT_USDT})
      on conflict (payout_wallet) do update set
        country = excluded.country,
        given_usdt = members.given_usdt + ${UNIT_USDT},
        updated_at = now()
    `;
    if (isNewDonor) {
      await sql`
        insert into messages (from_wallet, to_wallet, body)
        values (${HOUSE_WALLET}, ${wallet}, ${HOUSE_WELCOME})
      `;
    }
    const updatedRows = await sql<RoundRow>`
      update rounds set
        collected_usdt = collected_usdt + ${UNIT_USDT},
        donor_count = donor_count + ${isNewDonor ? 1 : 0}
      where id = ${round.id} and status = 'open'
      returning id, target_usdt, collected_usdt, donor_count, status, winner_wallet, settled_at, created_at
    `;
    const updated = updatedRows[0];
    if (!updated) return { ok: false, error: "Could not update the pool." };
    if (Number(updated.collected_usdt) >= Number(updated.target_usdt)) {
      const winnerRows = await sql<{ payout_wallet: string }>`
        select payout_wallet from donations where round_id = ${round.id} order by random() limit 1
      `;
      const winnerWallet = winnerRows[0]?.payout_wallet ?? wallet;
      await sql`
        update rounds set status = 'settled', winner_wallet = ${winnerWallet}, settled_at = now()
        where id = ${round.id}
      `;
      await sql`insert into rounds (target_usdt, collected_usdt, donor_count, status) values (${TARGET_USDT}, 0, 0, 'open')`;
      return { ok: true, settled: true, winnerWallet, snapshot: await loadSnapshot(wallet) };
    }
    return { ok: true, settled: false, snapshot: await loadSnapshot(wallet) };
  });

export const getNetwork = createServerFn({ method: "GET" }).handler(async (): Promise<NetworkSnapshot> => {
  const sql = await getSql();
  const config = await ensureConfig();
  const openRows = await sql<{ collected_usdt: number; target_usdt: number; donor_count: number; id: number }>`
    select id, collected_usdt, target_usdt, donor_count
    from rounds
    where status = 'open'
    order by id desc
    limit 1
  `;
  const round = openRows[0];
  const collected = Number(round?.collected_usdt ?? 0);
  const target = Number(round?.target_usdt ?? TARGET_USDT);
  const donorCount = Number(round?.donor_count ?? 0);

  const rows = await sql<{ payout_wallet: string; country: string; given_usdt: number }>`
    select payout_wallet, country, given_usdt from members order by given_usdt desc, updated_at desc limit 240
  `;
  const nodes = rows.map((row) => ({
    wallet: row.payout_wallet,
    masked: maskWallet(row.payout_wallet),
    country: countryFromWallet(row.payout_wallet, row.country),
    given: Number(row.given_usdt),
  }));

  const countryByWallet = new Map(nodes.map((n) => [n.wallet, n.country]));
  const moveRows = round
    ? await sql<{ payout_wallet: string; amount_usdt: number; created_at: string }>`
        select payout_wallet, amount_usdt, created_at
        from donations
        where round_id = ${round.id}
        order by created_at desc, id desc
        limit 24
      `
    : [];
  const movements = moveRows.map((row) => ({
    wallet: row.payout_wallet,
    masked: maskWallet(row.payout_wallet),
    country: countryByWallet.get(row.payout_wallet) ?? countryFromWallet(row.payout_wallet),
    amount: Number(row.amount_usdt),
    at: String(row.created_at),
  }));

  return {
    pool: config.trc20_address || HOUSE_WALLET,
    collected,
    target,
    remaining: Math.max(0, target - collected),
    donorCount,
    nodes,
    movements,
  };
});

export const getMember = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const wallet = "wallet" in data ? data.wallet : undefined;
    if (typeof wallet !== "string" || !isValidWallet(wallet)) throw new Error("Invalid wallet");
    return { wallet: wallet.trim() };
  })
  .handler(async ({ data }): Promise<MemberProfile> => {
    const sql = await getSql();
    const member = await sql<{ payout_wallet: string; country: string; given_usdt: number }>`
      select payout_wallet, country, given_usdt from members where payout_wallet = ${data.wallet} limit 1
    `;
    const tickets = await sql<{ n: number }>`
      select count(*)::int as n from donations d
      join rounds r on r.id = d.round_id
      where d.payout_wallet = ${data.wallet} and r.status = 'open'
    `;
    const row = member[0];
    return {
      wallet: data.wallet,
      walletMasked: maskWallet(data.wallet),
      country: row ? countryFromWallet(data.wallet, row.country) : "—",
      given: Number(row?.given_usdt ?? 0),
      tickets: Number(tickets[0]?.n ?? 0),
    };
  });

export const getInbox = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const wallet = "wallet" in data ? data.wallet : undefined;
    if (typeof wallet !== "string" || !isValidWallet(wallet)) throw new Error("Invalid wallet");
    return { wallet: wallet.trim() };
  })
  .handler(async ({ data }): Promise<InboxThread[]> => {
    const sql = await getSql();
    const rows = await sql<{ peer: string; body: string; created_at: string }>`
      select distinct on (peer) peer, body, created_at
      from (
        select
          case when from_wallet = ${data.wallet} then to_wallet else from_wallet end as peer,
          body,
          created_at
        from messages
        where from_wallet = ${data.wallet} or to_wallet = ${data.wallet}
      ) t
      order by peer, created_at desc
      limit 24
    `;
    return rows.map((row) => ({
      peer: row.peer,
      peerMasked: row.peer === HOUSE_WALLET ? "The House" : maskWallet(row.peer),
      lastBody: row.body,
      lastAt: String(row.created_at),
    }));
  });

export const getThread = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const me = "me" in data ? data.me : undefined;
    const other = "other" in data ? data.other : undefined;
    if (typeof me !== "string" || !isValidWallet(me)) throw new Error("Invalid wallet");
    const otherWallet = typeof other === "string" && other ? other.trim() : HOUSE_WALLET;
    return { me: me.trim(), other: otherWallet };
  })
  .handler(async ({ data }): Promise<ChatMessage[]> => {
    const sql = await getSql();
    const other = isValidWallet(data.other) ? data.other : HOUSE_WALLET;
    const rows = await sql<{
      id: number;
      from_wallet: string;
      to_wallet: string;
      body: string;
      file_name: string | null;
      created_at: string;
    }>`
      select id, from_wallet, to_wallet, body, file_name, created_at
      from messages
      where (from_wallet = ${data.me} and to_wallet = ${other})
         or (from_wallet = ${other} and to_wallet = ${data.me})
      order by created_at asc, id asc
      limit 80
    `;
    return rows.map((row) => ({
      id: Number(row.id),
      fromWallet: row.from_wallet,
      toWallet: row.to_wallet,
      fromMasked: row.from_wallet === HOUSE_WALLET ? "The House" : maskWallet(row.from_wallet),
      body: row.body,
      fileName: row.file_name,
      at: String(row.created_at),
    }));
  });

export const sendMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const from = "from" in data ? data.from : undefined;
    const to = "to" in data ? data.to : undefined;
    const body = "body" in data ? data.body : undefined;
    const fileName = "fileName" in data ? data.fileName : undefined;
    if (typeof from !== "string" || !isValidWallet(from)) throw new Error("Enter your wallet");
    if (typeof to !== "string" || !isValidWallet(to)) throw new Error("Enter a recipient wallet");
    if (typeof body !== "string" && typeof fileName !== "string") throw new Error("Write a message");
    return {
      from: from.trim(),
      to: to.trim(),
      body: typeof body === "string" ? body.trim().slice(0, 2000) : "",
      fileName: typeof fileName === "string" ? fileName.trim().slice(0, 80) : "",
    };
  })
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!data.body && !data.fileName) return { ok: false, error: "Write a message or attach a file name." };
    const sql = await getSql();
    const recent = await sql<{ n: number }>`
      select count(*)::int as n from messages
      where from_wallet = ${data.from} and created_at > now() - interval '1 hour'
    `;
    if (Number(recent[0]?.n ?? 0) >= MESSAGE_CAP) {
      return { ok: false, error: "Message limit reached. Try later." };
    }
    await sql`
      insert into messages (from_wallet, to_wallet, body, file_name)
      values (${data.from}, ${data.to}, ${data.body}, ${data.fileName || null})
    `;
    return { ok: true };
  });
