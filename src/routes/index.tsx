import { createFileRoute } from "@tanstack/react-router";
import { getNetwork, getPool } from "@/lib/pool-api";
import { PoolApp } from "@/components/pool/pool-app";

export const Route = createFileRoute("/")({
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
