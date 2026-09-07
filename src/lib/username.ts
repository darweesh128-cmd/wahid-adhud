const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;
const RESERVED = new Set([
  "admin",
  "adhud",
  "house",
  "member",
  "network",
  "support",
  "wahid",
  "owner",
  "api",
  "www",
]);

const SUGGEST_PREFIXES = ["adhud", "arm", "aid", "node", "waahid"] as const;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  const username = normalizeUsername(value);
  if (!USERNAME_RE.test(username)) return false;
  if (RESERVED.has(username)) return false;
  return true;
}

export function usernameHint(value: string): string | null {
  const username = normalizeUsername(value);
  if (!username) return null;
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (username.length > 20) return "Username must be 20 characters or fewer.";
  if (!/^[a-z]/.test(username)) return "Username must start with a letter.";
  if (!USERNAME_RE.test(username)) return "Use lowercase letters, numbers, and underscores only.";
  if (RESERVED.has(username)) return "That username is reserved.";
  return null;
}

export function randomUsernameSuffix(length = 4): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function suggestUsername(): string {
  const prefix = SUGGEST_PREFIXES[Math.floor(Math.random() * SUGGEST_PREFIXES.length)];
  return `${prefix}_${randomUsernameSuffix(4)}`;
}

export function accountDeskWallet(accountId: number): string {
  return `acct:${accountId}`;
}

export function isAccountDeskWallet(wallet: string): boolean {
  return /^acct:\d+$/.test(wallet.trim());
}
