import { createFileRoute } from "@tanstack/react-router";
import { getNetwork, getPool } from "@/lib/pool-api";
import { PoolApp } from "@/components/pool/pool-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "واحد · انضم بـ 5 USDT TRC-20 | عائلة العضد" },
      {
        name: "description",
        content:
          "ادفع 5 USDT على TRC-20 وتصبح عضيداً. مساعدة متبادلة بلا حساب — محفظتك هي مكتبك. Wahid · The ʿAḍud mutual aid.",
      },
      { property: "og:title", content: "واحد · انضم بـ 5 USDT TRC-20" },
      {
        property: "og:description",
        content: "عائلة العضد — 5 USDT على TRC-20. بلا KYC. أرسل لثلاثة بعد الانضمام.",
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
