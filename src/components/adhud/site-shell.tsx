import type { ReactNode } from "react";
import { SiteFooter } from "@/components/adhud/site-footer";
import { SiteHeader } from "@/components/adhud/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 workshop-atmosphere" />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
