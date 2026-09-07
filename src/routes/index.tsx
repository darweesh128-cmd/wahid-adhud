import { createFileRoute } from "@tanstack/react-router";
import { getNetwork, getPool } from "@/lib/pool-api";
import { PoolApp } from "@/components/pool/pool-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wahid · Open account · $1 membership | The ʿAḍud" },
      {
        name: "description",
        content:
          "Open your account and join The ʿAḍud — $1 membership, mutual solidarity, trust first. Become ʿAḍīd. Do not join to take. Join because you are someone's arm.",
      },
      { property: "og:title", content: "Wahid · Open account · $1 membership" },
      {
        property: "og:description",
        content:
          "The ʿAḍud — open account, $1 membership. Mutual solidarity and trust. Send to three after you join.",
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
