import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/pool/app-shell";
import { MemberDesk } from "@/components/pool/member-desk";
import { getAdhudAccount } from "@/lib/account-api";
import { getPool } from "@/lib/pool-api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/member/$username")({
  loader: async ({ params }) => {
    const pool = await getPool();
    const account = await getAdhudAccount({ data: { username: params.username } });
    if (!account || account.status !== "active") {
      return { account, pool, wallet: null, username: params.username };
    }
    const memberPool = await getPool({ data: { wallet: account.wallet ?? undefined } });
    return { account, pool: memberPool, wallet: account.wallet, username: account.username };
  },
  component: MemberPage,
});

function MemberPage() {
  const { account, pool, wallet, username } = Route.useLoaderData();
  const { t } = useI18n();

  if (!wallet || !account || account.status !== "active") {
    return (
      <AppShell initial={pool}>
        <main className="relative mx-auto w-full max-w-5xl px-5 pb-16">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h1 className="text-xl font-medium">{t("unknownAccount")}</h1>
            <p className="mt-2 text-sm text-fg-muted">{t("unknownAccountBody")}</p>
            <Link to="/" hash="join" className="mt-4 inline-flex text-sm text-accent hover:underline">
              {t("joinFromHouse")}
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell initial={pool}>
      <main className="relative mx-auto w-full max-w-5xl px-5 pb-16">
        <p className="mb-4 text-sm text-fg-muted">
          {t("memberDeskLead")} <span className="font-mono text-accent">@{username}</span>
        </p>
        <MemberDesk wallet={wallet} />
      </main>
    </AppShell>
  );
}
