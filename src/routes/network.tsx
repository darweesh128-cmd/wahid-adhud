import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/pool/app-shell";
import { NetworkMap } from "@/components/pool/network-map";
import { getNetwork, getPool } from "@/lib/pool-api";

export const Route = createFileRoute("/network")({
  loader: async () => {
    const [pool, network] = await Promise.all([getPool({ data: {} }), getNetwork()]);
    return { pool, network };
  },
  component: NetworkPage,
});

function NetworkPage() {
  const { pool, network } = Route.useLoaderData();
  return (
    <AppShell initial={pool}>
      <main className="relative mx-auto w-full max-w-5xl px-5 pb-16">
        <p className="text-xs font-medium text-accent">The example</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">The total, and the dollars moving</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Center is the House sum. Each $1 pulse leaves an Adhud and lands in the total. Clusters are
          the countries they can serve from.
        </p>
        <div className="mt-8">
          <NetworkMap data={network} />
        </div>
        <p className="mt-6 text-sm">
          <Link to="/" className="text-accent hover:underline">
            Back to the House
          </Link>
        </p>
      </main>
    </AppShell>
  );
}
