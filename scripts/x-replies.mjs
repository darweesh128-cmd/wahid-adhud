/** Mystery + takaful reply bank for @adudadid celebrity-thread comments. English-first. */
export const SITE = "https://www.adhud.xyz";
export const NETWORK = `${SITE}/network`;

/** Strength of the voice — quiet circle, mutual aid, growing map. Never scam/pyramid/USDT-lead. */
export const POWER = {
  name: "The quiet house",
  rule: "Mystery invites. Trust keeps. The site explains. Do not beg. Do not sell. Point to the door.",
  never: ["USDT lead", "scam/pitch framing", "@Tarkou78", "Arabic-country spam", "mass-identical comments"],
};

export const REPLIES = [
  {
    id: "r1",
    use: "general / viral",
    image: "home.png",
    text: `Some rooms stay quiet on purpose.

A circle is already forming.
Those who understand will open a desk.

${SITE}`,
  },
  {
    id: "r2",
    use: "hardship / money / help threads",
    image: "home.png",
    text: `You may be fine today.
Someone else is not.

Mutual aid. One house. $1 to stand as someone's arm.

${SITE}`,
  },
  {
    id: "r3",
    use: "maps / networks / community",
    image: "network.png",
    text: `Not a pitch. A house.

Members. Countries. One total.
The map is live — look once.

${NETWORK}`,
  },
  {
    id: "r4",
    use: "trust / privacy / institutions",
    image: "home.png",
    text: `No circus. A quiet membership.

Trust first. Then the desk.
The ones who enter already knew.

${SITE}`,
  },
  {
    id: "r5",
    use: "brotherhood / family / together",
    image: "network.png",
    text: `Brotherhood is not a slogan when the desk is real.

A cooperating circle. Growing.
Do not join to take.

${SITE}`,
  },
  {
    id: "r6",
    use: "send-this / share energy",
    image: "home.png",
    text: `Send this to three. Do not explain.

The words work alone.
The house is open.

${SITE}`,
  },
  {
    id: "r7",
    use: "success / wealth / famous life",
    image: "home.png",
    text: `Strength is not standing alone.

A small door. A growing map.
Open account — become ʿAḍīd.

${SITE}`,
  },
  {
    id: "r8",
    use: "news / chaos / the world is loud",
    image: "network.png",
    text: `While the feed shouts, a quieter network fills in.

See who stands as whose arm.

${NETWORK}`,
  },
];

export function pickReply(index) {
  return REPLIES[index % REPLIES.length];
}
