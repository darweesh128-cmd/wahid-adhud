import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { activateMembership } from "@/lib/membership-activate";
import { getSql } from "@/lib/db";
import { loadPoolConfig, loadSnapshot } from "@/lib/pool-snapshot";
import {
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
  type PoolSnapshot,
} from "@/lib/pool";
import { loadMembershipPaymentSessionById } from "@/lib/membership-fulfill";
import {
  completeCheckoutSession,
} from "@/lib/stripe-checkout";
import { accountDeskWallet } from "@/lib/username";

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

const HOURLY_CAP = 12;
const OWNER_ATTEMPT_CAP = 8;
const MESSAGE_CAP = 30;

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

async function ensureConfig() {
  return loadPoolConfig();
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
    return activateMembership(
      { wallet, country: data.country, ref: data.ref, stamp, amountUsdt: UNIT_USDT },
      loadSnapshot,
    );
  });

export type CheckoutStatusResult =
  | { ok: true; status: "completed"; snapshot: PoolSnapshot; username: string }
  | { ok: true; status: "pending" }
  | { ok: false; error: string };

function parseCheckoutPaymentId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
  }
  return undefined;
}

export const getMembershipCheckoutStatus = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (data == null || typeof data !== "object") throw new Error("Invalid data");
    const sessionId =
      "sessionId" in data && typeof data.sessionId === "string" && data.sessionId.trim()
        ? data.sessionId.trim().slice(0, 256)
        : undefined;
    const paymentId = parseCheckoutPaymentId("paymentId" in data ? data.paymentId : undefined);
    if (!sessionId && !paymentId) throw new Error("Missing session id or payment id");
    return { sessionId, paymentId };
  })
  .handler(async ({ data }): Promise<CheckoutStatusResult> => {
    let sessionId = data.sessionId;
    if (!sessionId && data.paymentId) {
      const payment = await loadMembershipPaymentSessionById(data.paymentId);
      if (!payment) return { ok: false, error: "Checkout session not found." };
      if (payment.status === "completed" && payment.donation_id && payment.username) {
        const sql = await getSql();
        const rows = await sql<{ id: number }>`
          select id from adhud_accounts where lower(username) = ${payment.username!.toLowerCase()} limit 1
        `;
        const accountId = rows[0]?.id;
        const wallet = accountId ? accountDeskWallet(accountId) : undefined;
        return {
          ok: true,
          status: "completed",
          username: payment.username,
          snapshot: await loadSnapshot(wallet),
        };
      }
      sessionId = payment.stripe_session_id?.trim() || undefined;
      if (!sessionId) return { ok: true, status: "pending" };
    }
    const stamp = await clientStamp();
    const result = await completeCheckoutSession(sessionId, stamp);
    if (result.status === "completed" && result.username) {
      const sql = await getSql();
      const rows = await sql<{ id: number }>`
        select id from adhud_accounts where lower(username) = ${result.username.toLowerCase()} limit 1
      `;
      const accountId = rows[0]?.id;
      const wallet = accountId ? accountDeskWallet(accountId) : undefined;
      return {
        ok: true,
        status: "completed",
        username: result.username,
        snapshot: await loadSnapshot(wallet),
      };
    }
    if (result.status === "pending") {
      return { ok: true, status: "pending" };
    }
    return { ok: false, error: result.error ?? "Checkout could not be confirmed." };
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
