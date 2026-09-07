import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/pool/app-shell";
import { Button } from "@/components/ui/button";
import { payMockCheckout } from "@/lib/account-api";
import { getPool } from "@/lib/pool-api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/checkout/mock")({
  validateSearch: (search: Record<string, unknown>) => ({
    pid: typeof search.pid === "string" ? Number(search.pid) : typeof search.pid === "number" ? search.pid : 0,
    token: typeof search.token === "string" ? search.token : "",
  }),
  loader: async () => {
    const pool = await getPool();
    return { pool };
  },
  component: MockCheckoutPage,
});

function MockCheckoutPage() {
  const { pool } = Route.useLoaderData();
  const { pid, token } = Route.useSearch();
  const { t } = useI18n();
  const router = useRouter();
  const [paying, setPaying] = useState(false);

  async function onPay() {
    if (!pid || !token) {
      toast.error(t("checkoutFail"));
      return;
    }
    setPaying(true);
    try {
      const result = await payMockCheckout({ data: { paymentId: pid, token } });
      if (!result.ok) {
        toast.error(result.error);
        setPaying(false);
        return;
      }
      toast.success(t("mockPaid"));
      await router.navigate({
        to: "/",
        search: { checkout: "success", session_id: result.sessionId },
        hash: "join",
      });
    } catch {
      toast.error(t("checkoutFail"));
      setPaying(false);
    }
  }

  return (
    <AppShell initial={pool}>
      <main className="relative mx-auto flex min-h-[60vh] w-full max-w-lg flex-col justify-center px-5 py-16">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-xs font-medium text-accent">{t("mockCheckoutKicker")}</p>
          <h1 className="mt-2 text-2xl font-medium">{t("mockCheckoutTitle")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">{t("mockCheckoutBody")}</p>
          <p className="mt-4 rounded-md border border-border bg-surface-2 px-4 py-3 font-mono text-lg text-accent">
            $1.00 USD
          </p>
          <Button className="mt-6 w-full" size="lg" disabled={paying || !pid || !token} onClick={() => void onPay()}>
            {paying ? t("mockPaying") : t("mockPayCta")}
          </Button>
          <Button className="mt-3 w-full" variant="ghost" size="sm" asChild>
            <Link to="/" hash="join">{t("mockCancel")}</Link>
          </Button>
        </div>
      </main>
    </AppShell>
  );
}
