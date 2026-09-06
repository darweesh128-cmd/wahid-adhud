import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/pool/app-shell";
import { MemberDesk } from "@/components/pool/member-desk";
import { getPool } from "@/lib/pool-api";
import { isValidWallet } from "@/lib/pool";

export const Route = createFileRoute("/adhud/$wallet")({
  loader: async ({ params }) => {
    const pool = await getPool({ data: { wallet: params.wallet } });
    return { pool, wallet: params.wallet };
  },
  component: DeskPage,
});

function DeskPage() {
  const { pool, wallet } = Route.useLoaderData();
  const valid = isValidWallet(wallet);
  return (
    <AppShell initial={pool}>
      <main className="relative mx-auto w-full max-w-5xl px-5 pb-16">
        {valid ? (
          <MemberDesk wallet={wallet} />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h1 className="text-xl font-medium">Unknown wallet</h1>
            <p className="mt-2 text-sm text-fg-muted">Enter a TRC-20 or ERC-20 address to open a desk.</p>
            <Link to="/" hash="join" className="mt-4 inline-flex text-sm text-accent hover:underline">
              Join from the House
            </Link>
          </div>
        )}
      </main>
    </AppShell>
  );
}
