import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/pool/app-shell";
import { NetworkMap } from "@/components/pool/network-map";
import { getNetwork, getPool } from "@/lib/pool-api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/network")({
  loader: async () => {
    const [pool, network] = await Promise.all([getPool({ data: {} }), getNetwork()]);
    return { pool, network };
  },
  component: NetworkPage,
});

function NetworkPage() {
  const { pool, network } = Route.useLoaderData();
  const { t } = useI18n();
  return (
    <AppShell initial={pool}>
      <main className="relative mx-auto w-full max-w-5xl px-5 pb-16">
        <p className="text-xs font-medium text-accent">{t("family")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("networkTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">{t("networkLead")}</p>
        <div className="mt-8">
          <NetworkMap data={network} />
        </div>
        <p className="mt-6 text-sm">
          <Link to="/" className="text-accent hover:underline">
            {t("backHouse")}
          </Link>
        </p>
      </main>
    </AppShell>
  );
}
