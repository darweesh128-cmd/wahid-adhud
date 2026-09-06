import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { OwnerPanel } from "@/components/pool/owner-panel";
import { ShareTrigger } from "@/components/pool/share-panel";
import { WALLET_STORAGE_KEY, type PoolSnapshot } from "@/lib/pool";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteHeader({
  pool,
  ownerMode,
  onLogoTap,
  onShare,
  onRevealed,
}: {
  pool: PoolSnapshot;
  ownerMode: boolean;
  onLogoTap: () => void;
  onShare: () => void;
  onRevealed: () => void;
}) {
  const { t, lang, setLang } = useI18n();
  const [me, setMe] = useState("");

  useEffect(() => {
    try {
      setMe(localStorage.getItem(WALLET_STORAGE_KEY) ?? "");
    } catch {
      setMe("");
    }
  }, []);

  return (
    <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onLogoTap}
          className="grid size-8 place-items-center rounded-sm bg-accent text-accent-fg"
          aria-label={t("markAria")}
        >
          <span className="font-sans text-sm font-semibold leading-none">W</span>
        </button>
        <Link to="/" className="leading-none">
          <p className="text-base font-semibold tracking-tight">{t("brand")}</p>
          <p className="mt-1 text-[11px] text-fg-subtle">{t("family")}</p>
        </Link>
      </div>
      <nav className="flex items-center gap-1 sm:gap-2">
        <div className="inline-flex h-9 items-center rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={cn(
              "h-8 min-w-9 rounded px-2 text-[11px]",
              lang === "en" ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg",
            )}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("ar")}
            className={cn(
              "h-8 min-w-9 rounded px-2 text-[11px]",
              lang === "ar" ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg",
            )}
            aria-pressed={lang === "ar"}
          >
            عربي
          </button>
        </div>
        <Link
          to="/network"
          className="inline-flex h-9 items-center rounded-md px-2 text-xs text-fg-muted hover:text-fg"
        >
          {t("networkNav")}
        </Link>
        {me ? (
          <Link
            to="/adhud/$wallet"
            params={{ wallet: me }}
            className="inline-flex h-9 items-center rounded-md px-2 text-xs text-fg-muted hover:text-fg"
          >
            {t("deskNav")}
          </Link>
        ) : (
          <Link
            to="/"
            hash="join"
            className="inline-flex h-9 items-center rounded-md px-2 text-xs text-fg-muted hover:text-fg"
          >
            {t("deskNav")}
          </Link>
        )}
        <Badge variant="accent" className="hidden sm:inline-flex">
          {t("family")}
        </Badge>
        <Badge variant="outline">
          {t("round")} {pool.roundId}
        </Badge>
        <ShareTrigger onOpen={onShare} />
        <OwnerPanel pool={pool} revealed={ownerMode} onRevealed={onRevealed} />
      </nav>
    </header>
  );
}
