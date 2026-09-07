import { getSql } from "@/lib/db";
import { MEMBERSHIP_UNIT_USDT } from "@/lib/membership";
import { accountDeskWallet } from "@/lib/username";
import {
  HOUSE_WALLET,
  TARGET_USDT,
  UNIT_USDT,
  detectNetwork,
  isValidWallet,
  type Network,
  type PoolSnapshot,
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

const HOUSE_WELCOME =
  "The House is open. This desk is yours — ledger, messages, any ʿAḍīd. Your dollar is an arm.";

export type ActivateMembershipInput = {
  wallet: string;
  country: string;
  ref: string | null;
  stamp: string;
  /** Defaults to legacy 5 USDT; card checkout passes 1. */
  amountUsdt?: number;
};

/**
 * Core join logic shared by the legacy USDT self-attest path and verified card checkout.
 * Inserts donation + member rows, sends welcome message, updates round totals.
 */
export type ActivateMembershipResult =
  | { ok: true; settled: false; snapshot: PoolSnapshot; donationId?: number }
  | { ok: true; settled: true; winnerWallet: string; snapshot: PoolSnapshot; donationId?: number }
  | { ok: false; error: string };

export async function activateMembership(
  input: ActivateMembershipInput,
  loadSnapshot: (wallet?: string) => Promise<PoolSnapshot>,
): Promise<ActivateMembershipResult> {
  const wallet = input.wallet.trim();
  const detected = detectNetwork(wallet);
  if (!detected || !isValidWallet(wallet)) {
    return { ok: false, error: "Invalid wallet. Use TRC-20 (T…) or ERC-20 (0x…)." };
  }

  const amountUsdt = input.amountUsdt ?? UNIT_USDT;
  const sql = await getSql();

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

  const inserted = await sql<{ id: number }>`
    insert into donations (round_id, payout_wallet, network, amount_usdt, client_stamp, ref_slug)
    values (${round.id}, ${wallet}, ${detected}, ${amountUsdt}, ${input.stamp}, ${input.ref})
    returning id
  `;
  const donationId = Number(inserted[0]?.id ?? 0);

  await sql`
    insert into members (payout_wallet, country, given_usdt)
    values (${wallet}, ${input.country}, ${amountUsdt})
    on conflict (payout_wallet) do update set
      country = excluded.country,
      given_usdt = members.given_usdt + ${amountUsdt},
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
      collected_usdt = collected_usdt + ${amountUsdt},
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
    const snapshot = await loadSnapshot(wallet);
    return { ok: true, settled: true, winnerWallet, snapshot, donationId };
  }

  const snapshot = await loadSnapshot(wallet);
  return { ok: true, settled: false, snapshot, donationId };
}

export type ActivateAccountMembershipInput = {
  accountId: number;
  username: string;
  country: string;
  ref: string | null;
  stamp: string;
  amountUsdt?: number;
};

export async function activateAccountMembership(
  input: ActivateAccountMembershipInput,
  loadSnapshot: (wallet?: string) => Promise<PoolSnapshot>,
): Promise<ActivateMembershipResult> {
  const amountUsdt = input.amountUsdt ?? MEMBERSHIP_UNIT_USDT;
  const wallet = accountDeskWallet(input.accountId);
  const sql = await getSql();

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
    select id from donations where round_id = ${round.id} and account_id = ${input.accountId} limit 1
  `;
  const isNewDonor = prior.length === 0;

  const inserted = await sql<{ id: number }>`
    insert into donations (
      round_id, payout_wallet, network, amount_usdt, client_stamp, ref_slug, display_name, account_id
    )
    values (
      ${round.id},
      ${wallet},
      'trc20',
      ${amountUsdt},
      ${input.stamp},
      ${input.ref},
      ${input.username},
      ${input.accountId}
    )
    returning id
  `;
  const donationId = Number(inserted[0]?.id ?? 0);

  await sql`
    insert into members (payout_wallet, country, given_usdt, username, account_id)
    values (${wallet}, ${input.country}, ${amountUsdt}, ${input.username}, ${input.accountId})
    on conflict (payout_wallet) do update set
      country = excluded.country,
      given_usdt = members.given_usdt + ${amountUsdt},
      username = excluded.username,
      account_id = excluded.account_id,
      updated_at = now()
  `;

  await sql`
    update adhud_accounts
    set status = 'active', activated_at = now(), updated_at = now()
    where id = ${input.accountId}
  `;

  if (isNewDonor) {
    await sql`
      insert into messages (from_wallet, to_wallet, body)
      values (${HOUSE_WALLET}, ${wallet}, ${HOUSE_WELCOME})
    `;
  }

  const updatedRows = await sql<RoundRow>`
    update rounds set
      collected_usdt = collected_usdt + ${amountUsdt},
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
    const snapshot = await loadSnapshot(wallet);
    return { ok: true, settled: true, winnerWallet, snapshot, donationId };
  }

  const snapshot = await loadSnapshot(wallet);
  return { ok: true, settled: false, snapshot, donationId };
}

/** Amount credited for a verified card checkout session. */
export const cardCheckoutAmountUsdt = MEMBERSHIP_UNIT_USDT;
