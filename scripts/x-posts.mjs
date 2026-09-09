/** English-first @adudadid post queue. Solidarity voice — not fundraising. */
export const X_HANDLE = "adudadid";
export const SITE_URL = "https://www.adhud.xyz";
export const FORBIDDEN_HANDLES = ["Tarkou78"];

export const POSTS = {
  a: `You may be fine today.
Someone else is not.

Open your account — $1 membership.
Become ʿAḍīd.

Do not join to take.
Join because you are someone's arm.

${SITE_URL}`,
  b: `$1. One username. One desk. Mutual solidarity — not a pitch.

Open account → ${SITE_URL}`,
  c: `The map is live: members, countries, the House total.

See who stands as whose arm → ${SITE_URL}/network`,
  d: `No KYC circus. Pick a username. Pay $1. Get your member desk.

Trust first → ${SITE_URL}`,
  e: `Send this to three people. Do not explain.

The words work alone.

${SITE_URL}`,
};

export const POST_KEYS = Object.keys(POSTS);

export const CADENCE = [
  { day: "Mon", key: "a" },
  { day: "Wed", key: "c" },
  { day: "Fri", key: "e" },
  { day: "Sat", key: "b" },
  { day: "Sun", key: "d" },
];

/** Suggested weekday (UTC) → post key. */
export function postKeyForUtcDate(date = new Date()) {
  const map = { 0: "d", 1: "a", 3: "c", 5: "e", 6: "b" };
  return map[date.getUTCDay()] ?? null;
}

export function assertAllowedHandle(handle) {
  const normalized = String(handle || "").replace(/^@/, "");
  if (FORBIDDEN_HANDLES.some((h) => h.toLowerCase() === normalized.toLowerCase())) {
    throw new Error(`Forbidden X account: @${normalized}`);
  }
  if (normalized && normalized.toLowerCase() !== X_HANDLE.toLowerCase()) {
    throw new Error(`Only @${X_HANDLE} is allowed (got @${normalized})`);
  }
}

export function tweetUrl(id, handle = X_HANDLE) {
  return `https://x.com/${handle}/status/${id}`;
}
