import { createFileRoute } from "@tanstack/react-router";
import { getNetwork, getPool } from "@/lib/pool-api";
import { PoolApp } from "@/components/pool/pool-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wahid · Join with 5 USDT TRC-20 | The ʿAḍud" },
      {
        name: "description",
        content:
          "Pay 5 USDT on TRC-20 and become ʿAḍīd. Wallet-level mutual aid — no account, no KYC. Your wallet is your desk.",
      },
      { property: "og:title", content: "Wahid · Join with 5 USDT TRC-20" },
      {
        property: "og:description",
        content: "The ʿAḍud — 5 USDT on TRC-20. No KYC. Send to three after you join.",
      },
    ],
  }),
  loader: async () => {
    const [pool, network] = await Promise.all([getPool(), getNetwork()]);
    return { pool, network };
  },
  component: Home,
});

function Home() {
  const { pool, network } = Route.useLoaderData();
  return <PoolApp initial={pool} network={network} />;
}
