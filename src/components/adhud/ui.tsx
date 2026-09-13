import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "muted" | "ink";
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-4 py-16 sm:px-6 sm:py-20",
        tone === "muted" && "bg-surface/60",
        tone === "ink" && "bg-ink text-paper",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  lead,
  kicker,
  light,
}: {
  title: string;
  lead?: string;
  kicker?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-10 max-w-3xl stagger-in">
      {kicker ? (
        <p className={cn("mb-2 text-sm font-medium", light ? "text-brass" : "text-accent")}>{kicker}</p>
      ) : null}
      <h2 className={cn("font-display text-3xl font-bold sm:text-4xl", light ? "text-paper" : "text-fg")}>
        {title}
      </h2>
      {lead ? (
        <p className={cn("mt-3 text-base leading-relaxed sm:text-lg", light ? "text-paper/75" : "text-fg-muted")}>
          {lead}
        </p>
      ) : null}
    </div>
  );
}

export function PageHero({
  brand,
  title,
  lead,
  actions,
}: {
  brand?: string;
  title: string;
  lead: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="hero-plane absolute inset-0 -z-10" />
      <div className="mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-20 sm:min-h-[78vh] sm:px-6 sm:pb-20">
        <div className="max-w-3xl stagger-in">
          {brand ? <p className="font-display text-5xl font-bold text-fg sm:text-7xl">{brand}</p> : null}
          <h1
            className={cn(
              "font-display font-bold text-fg",
              brand ? "mt-4 text-2xl sm:text-3xl" : "text-4xl sm:text-5xl",
            )}
          >
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">{lead}</p>
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function CtaLink({
  to,
  children,
  variant = "primary",
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const className = cn(
    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors",
    variant === "primary" && "bg-ink text-paper hover:bg-ink/90",
    variant === "secondary" && "border border-border bg-bg/70 text-fg hover:bg-surface",
    variant === "ghost" && "text-fg underline-offset-4 hover:underline",
  );

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}
