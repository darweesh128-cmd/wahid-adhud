import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND, NAV } from "@/lib/adhud/content";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background,border-color,backdrop-filter] duration-300",
        scrolled || open
          ? "border-b border-border bg-bg/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="font-display text-2xl font-bold tracking-tight text-fg transition-opacity hover:opacity-80"
          onClick={() => setOpen(false)}
        >
          {BRAND}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-accent-soft hover:text-fg"
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "rounded-md px-3 py-2 text-sm text-fg bg-accent-soft" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/join"
            className="ms-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/90"
          >
            انضم
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-fg lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">القائمة</span>
          <span aria-hidden className="flex flex-col gap-1.5">
            <span className={cn("block h-0.5 w-5 bg-fg transition-transform", open && "translate-y-2 rotate-45")} />
            <span className={cn("block h-0.5 w-5 bg-fg transition-opacity", open && "opacity-0")} />
            <span className={cn("block h-0.5 w-5 bg-fg transition-transform", open && "-translate-y-2 -rotate-45")} />
          </span>
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-border bg-bg px-4 py-4 lg:hidden"
          aria-label="تنقل الجوال"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="block rounded-md px-3 py-3 text-base text-fg"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/join"
                className="mt-2 block rounded-md bg-ink px-3 py-3 text-center text-base font-medium text-paper"
                onClick={() => setOpen(false)}
              >
                انضم
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
