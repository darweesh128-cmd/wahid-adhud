import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { isMembershipCheckoutV2Enabled } from "@/lib/membership";
import { isCountry } from "@/lib/pool";
import { checkoutAvailable, completeMockCheckout, createMembershipCheckoutForAccount } from "@/lib/stripe-checkout";
import { normalizeUsername, suggestUsername, usernameHint, accountDeskWallet } from "@/lib/username";

type AccountRow = {
  id: number;
  username: string;
  country: string;
  status: string;
  setup_token: string;
};

async function clientStamp(): Promise<string> {
  const { getRequestIP } = await import("@tanstack/react-start/server");
  const { createHash } = await import("node:crypto");
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  return createHash("sha256").update(`waahid:${ip}`).digest("hex").slice(0, 20);
}

async function isUsernameAvailable(username: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from adhud_accounts where lower(username) = ${username}
  `;
  return Number(rows[0]?.n ?? 0) === 0;
}

export const suggestAdhudUsername = createServerFn({ method: "GET" }).handler(async (): Promise<{ username: string }> => {
  let candidate = suggestUsername();
  for (let i = 0; i < 8; i += 1) {
    if (await isUsernameAvailable(candidate)) break;
    candidate = suggestUsername();
  }
  return { username: candidate };
});

export type UsernameCheckResult =
  | { ok: true; available: true }
  | { ok: true; available: false }
  | { ok: false; error: string };

export const checkAdhudUsername = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (data == null || typeof data !== "object") throw new Error("Invalid data");
    const username = "username" in data ? data.username : undefined;
    if (typeof username !== "string") throw new Error("Enter a username");
    return { username: username.trim().slice(0, 32) };
  })
  .handler(async ({ data }): Promise<UsernameCheckResult> => {
    const hint = usernameHint(data.username);
    if (hint) return { ok: false, error: hint };
    const username = normalizeUsername(data.username);
    const available = await isUsernameAvailable(username);
    return { ok: true, available };
  });

export type CreateAccountResult =
  | { ok: true; accountId: number; username: string; setupToken: string; checkoutUrl: string; sessionId: string }
  | { ok: false; error: string };

export const createAdhudAccount = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const username = "username" in data ? data.username : undefined;
    const countryRaw = "country" in data ? data.country : undefined;
    const origin = "origin" in data ? data.origin : undefined;
    if (typeof username !== "string") throw new Error("Enter a username");
    const country = typeof countryRaw === "string" && isCountry(countryRaw) ? countryRaw : "Other";
    const refRaw = "ref" in data ? data.ref : undefined;
    const ref =
      typeof refRaw === "string" && /^[a-z0-9]{4,12}$/i.test(refRaw.trim()) ? refRaw.trim().toLowerCase() : null;
    return {
      username: username.trim(),
      country,
      ref,
      origin: typeof origin === "string" ? origin.trim().slice(0, 256) : undefined,
    };
  })
  .handler(async ({ data }): Promise<CreateAccountResult> => {
    if (!isMembershipCheckoutV2Enabled()) {
      return { ok: false, error: "Account checkout is not enabled." };
    }
    const hint = usernameHint(data.username);
    if (hint) return { ok: false, error: hint };
    const username = normalizeUsername(data.username);
    if (!(await isUsernameAvailable(username))) {
      return { ok: false, error: "That username is already taken. Pick another." };
    }
    if (!checkoutAvailable()) {
      return { ok: false, error: "Checkout is not available on this deployment." };
    }

    const sql = await getSql();
    const setupToken = randomBytes(24).toString("hex");
    const stamp = await clientStamp();
    const created = await sql<AccountRow>`
      insert into adhud_accounts (username, country, status, setup_token, ref_slug)
      values (${username}, ${data.country}, 'pending', ${setupToken}, ${data.ref})
      returning id, username, country, status, setup_token
    `;
    const account = created[0];
    if (!account) return { ok: false, error: "Could not create account." };

    const checkout = await createMembershipCheckoutForAccount({
      accountId: account.id,
      username: account.username,
      country: account.country,
      setupToken: account.setup_token,
      ref: data.ref,
      stamp,
      origin: data.origin,
    });
    if (!checkout.ok) return checkout;

    return {
      ok: true,
      accountId: account.id,
      username: account.username,
      setupToken: account.setup_token,
      checkoutUrl: checkout.url,
      sessionId: checkout.sessionId,
    };
  });

export type AccountProfile = {
  accountId: number;
  username: string;
  country: string;
  status: "pending" | "active";
  wallet: string | null;
};

export const getAdhudAccount = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (data == null || typeof data !== "object") throw new Error("Invalid data");
    const username = "username" in data ? data.username : undefined;
    if (typeof username !== "string") throw new Error("Enter a username");
    return { username: normalizeUsername(username) };
  })
  .handler(async ({ data }): Promise<AccountProfile | null> => {
    const sql = await getSql();
    const rows = await sql<{ id: number; username: string; country: string; status: string; payout_wallet: string | null }>`
      select id, username, country, status, payout_wallet
      from adhud_accounts
      where lower(username) = ${data.username}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      accountId: row.id,
      username: row.username,
      country: row.country,
      status: row.status === "active" ? "active" : "pending",
      wallet: row.payout_wallet ?? accountDeskWallet(row.id),
    };
  });

export const payMockCheckout = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "object" || data == null) throw new Error("Invalid data");
    const paymentId = "paymentId" in data ? data.paymentId : undefined;
    const token = "token" in data ? data.token : undefined;
    if (typeof paymentId !== "number" && typeof paymentId !== "string") throw new Error("Invalid payment");
    if (typeof token !== "string" || !token.trim()) throw new Error("Invalid token");
    const id = typeof paymentId === "number" ? paymentId : Number(paymentId);
    if (!Number.isFinite(id) || id <= 0) throw new Error("Invalid payment");
    return { paymentId: id, token: token.trim() };
  })
  .handler(async ({ data }) => {
    const stamp = await clientStamp();
    return completeMockCheckout(data.paymentId, data.token, stamp);
  });
