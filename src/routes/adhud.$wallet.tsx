import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/pool/app-shell";
import { MemberDesk } from "@/components/pool/member-desk";
import { getPool } from "@/lib/pool-api";
import { isValidWallet } from "@/lib/pool";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/adhud/$wallet")({
  loader: async ({ params }) => {
    const pool = await getPool({ data: { wallet: params.wallet } });
    return { pool, wallet: params.wallet };
  },
  component: DeskPage,
});

function DeskPage() {
  const { pool, wallet } = Route.useLoaderData();
  const { t } = useI18n();
  const valid = isValidWallet(wallet);
  return (
    <AppShell initial={pool}>
      <main className="relative mx-auto w-full max-w-5xl px-5 pb-16">
        {valid ? (
          <MemberDesk wallet={wallet} />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h1 className="text-xl font-medium">{t("unknownWallet")}</h1>
            <p className="mt-2 text-sm text-fg-muted">{t("unknownBody")}</p>
            <Link to="/" hash="join" className="mt-4 inline-flex text-sm text-accent hover:underline">
              {t("joinFromHouse")}
            </Link>
          </div>
        )}
      </main>
    </AppShell>
  );
}
