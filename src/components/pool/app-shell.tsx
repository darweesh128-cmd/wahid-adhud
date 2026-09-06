import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/pool/site-header";
import { ShareOverlay } from "@/components/pool/share-panel";
import { getPool } from "@/lib/pool-api";
import { OWNER_STORAGE_KEY, type PoolSnapshot } from "@/lib/pool";

export function AppShell({
  initial,
  children,
}: {
  initial?: PoolSnapshot;
  children: ReactNode;
}) {
  const [ownerMode, setOwnerMode] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(OWNER_STORAGE_KEY) === "1") setOwnerMode(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (logoTaps === 0) return;
    const id = window.setTimeout(() => setLogoTaps(0), 2500);
    return () => window.clearTimeout(id);
  }, [logoTaps]);

  const { data } = useQuery({
    queryKey: ["pool"],
    queryFn: () => getPool({ data: {} }),
    initialData: initial,
    refetchInterval: 12_000,
  });
  const pool = data ?? initial;

  function onLogoTap() {
    setLogoTaps((count) => {
      const next = count + 1;
      if (next >= 5) {
        setOwnerMode(true);
        return 0;
      }
      return next;
    });
  }

  if (!pool) return <div className="min-h-dvh bg-bg">{children}</div>;

  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <div aria-hidden className="hero-wash pointer-events-none absolute inset-x-0 top-0 h-72" />
      <SiteHeader
        pool={pool}
        ownerMode={ownerMode}
        onLogoTap={onLogoTap}
        onShare={() => setShareOpen(true)}
        onRevealed={() => setOwnerMode(true)}
      />
      {children}
      <ShareOverlay open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
