export const TARGET_USDT = 1_000_000;
export const UNIT_USDT = 5;
export const HOUSE_WALLET = "TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER";

export const DEFAULT_POOL_ADDRESSES = {
  trc20: HOUSE_WALLET,
  erc20: "0x576161686964506f6f6c00000000000000000001",
} as const;

export const USDT_CONTRACTS = {
  trc20: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  erc20: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
} as const;

export const COUNTRIES = [
  "Algeria",
  "Bahrain",
  "Canada",
  "Egypt",
  "France",
  "Germany",
  "India",
  "Indonesia",
  "Iraq",
  "Jordan",
  "Kenya",
  "Kuwait",
  "Malaysia",
  "Morocco",
  "Nigeria",
  "Oman",
  "Pakistan",
  "Qatar",
  "Saudi Arabia",
  "South Africa",
  "Tunisia",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Yemen",
  "Other",
] as const;

export type Country = (typeof COUNTRIES)[number];

export type Network = "trc20" | "erc20";

export type PoolAddresses = {
  trc20: string;
  erc20: string;
};

export type DonationPreview = {
  id: number;
  wallet: string;
  walletMasked: string;
  displayName: string | null;
  network: Network;
  amount: number;
  at: string;
};

export type PreviousRound = {
  roundId: number;
  winnerWallet: string;
  winnerMasked: string;
  settledAt: string;
  collected: number;
  donorCount: number;
};

export type PoolSnapshot = {
  roundId: number;
  target: number;
  collected: number;
  donorCount: number;
  remaining: number;
  progress: number;
  status: "open" | "settled";
  winnerWallet: string | null;
  winnerMasked: string | null;
  recent: DonationPreview[];
  previous: PreviousRound | null;
  yourTickets: number;
  addresses: PoolAddresses;
  hasOwnerLock: boolean;
};

export type MemberProfile = {
  wallet: string;
  walletMasked: string;
  country: string;
  given: number;
  tickets: number;
};

export type NetworkNode = {
  wallet: string;
  masked: string;
  country: string;
  given: number;
};

export type NetworkMovement = {
  wallet: string;
  masked: string;
  country: string;
  amount: number;
  at: string;
};

export type NetworkSnapshot = {
  pool: string;
  collected: number;
  target: number;
  remaining: number;
  donorCount: number;
  nodes: NetworkNode[];
  movements: NetworkMovement[];
};

export type ChatMessage = {
  id: number;
  fromWallet: string;
  toWallet: string;
  fromMasked: string;
  body: string;
  fileName: string | null;
  at: string;
};

export type InboxThread = {
  peer: string;
  peerMasked: string;
  lastBody: string;
  lastAt: string;
};

const TRC20_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const ERC20_RE = /^0x[a-fA-F0-9]{40}$/;
const BTC_RE = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/i;

export function detectNetwork(wallet: string): Network | null {
  const value = wallet.trim();
  if (TRC20_RE.test(value)) return "trc20";
  if (ERC20_RE.test(value)) return "erc20";
  return null;
}

export function isValidWallet(wallet: string, network?: Network): boolean {
  const value = wallet.trim();
  if (network === "trc20") return TRC20_RE.test(value);
  if (network === "erc20") return ERC20_RE.test(value);
  return detectNetwork(value) !== null;
}

export function isCountry(value: string): value is Country {
  return (COUNTRIES as readonly string[]).includes(value);
}

export function walletHintKey(wallet: string, expect?: Network): "btc" | "trc20" | "erc20" | "invalid" | null {
  const value = wallet.trim();
  if (!value) return null;
  if (BTC_RE.test(value)) return "btc";
  if (expect === "trc20" && !TRC20_RE.test(value)) return "trc20";
  if (expect === "erc20" && !ERC20_RE.test(value)) return "erc20";
  if (!isValidWallet(value, expect)) return "invalid";
  return null;
}

export function walletHint(wallet: string, expect?: Network): string | null {
  const key = walletHintKey(wallet, expect);
  if (key === "btc") {
    return "That is a Bitcoin address, not USDT. Open USDT on Tron (TRC-20) and copy an address starting with T.";
  }
  if (key === "trc20") return "Invalid TRC-20 address. It must start with T.";
  if (key === "erc20") return "Invalid ERC-20 address. It must start with 0x.";
  if (key === "invalid") return "Invalid address. TRC-20 starts with T. ERC-20 starts with 0x.";
  return null;
}

export function maskWallet(wallet: string): string {
  const value = wallet.trim();
  if (value.length < 10) return value;
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}

export function formatUsd(n: number, lang: "ar" | "en" = "en"): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", { numberingSystem: "latn" }).format(n);
}

export function formatTimeAgo(iso: string, now = Date.now(), lang: "ar" | "en" = "en"): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const delta = Math.max(0, Math.floor((now - then) / 1000));
  if (delta < 45) return lang === "ar" ? "الآن" : "now";
  if (delta < 3600) return lang === "ar" ? `${Math.floor(delta / 60)}د` : `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return lang === "ar" ? `${Math.floor(delta / 3600)}س` : `${Math.floor(delta / 3600)}h ago`;
  const days = Math.floor(delta / 86400);
  if (days < 30) return lang === "ar" ? `${days}ي` : `${days}d ago`;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", { dateStyle: "medium" }).format(new Date(iso));
}

export function countryFromWallet(_wallet: string, stored?: string | null): string {
  if (stored && stored !== "Unknown" && stored.trim()) return stored;
  return "Other";
}

export const WALLET_STORAGE_KEY = "waahid-wallet";
export const NETWORK_STORAGE_KEY = "waahid-network";
export const OWNER_STORAGE_KEY = "waahid-owner";
export const COUNTRY_STORAGE_KEY = "waahid-country";
export const ACCOUNT_USERNAME_STORAGE_KEY = "waahid-username";
export const CHECKOUT_SESSION_STORAGE_KEY = "waahid-checkout-session";
