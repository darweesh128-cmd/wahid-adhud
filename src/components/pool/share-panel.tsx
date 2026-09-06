import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { nativeShare, shareMessage, whatsappHref, xHref } from "@/lib/share";
import { SHARE_COPY, useI18n } from "@/lib/i18n";
import { CopyButton } from "@/components/pool/copy-button";

export function ShareTrigger({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onOpen} className="text-fg-muted">
      <Share2 className="size-4" />
      <span className="hidden sm:inline">{t("invite")}</span>
    </Button>
  );
}

export function ShareOverlay({
  open,
  onClose,
  justJoined,
}: {
  open: boolean;
  onClose: () => void;
  justJoined?: boolean;
}) {
  const { t, lang } = useI18n();
  if (!open) return null;

  async function onNative() {
    const result = await nativeShare(lang);
    if (result === "shared") toast.success(t("sent"));
    if (result === "copied") toast.success(t("copiedPaste"));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-5">
      <div
        role="dialog"
        aria-labelledby="share-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-soft"
      >
        <button
          type="button"
          className="absolute end-4 top-4 grid size-9 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
          onClick={onClose}
          aria-label={t("close")}
        >
          <X className="size-4" />
        </button>
        <p className="text-xs tracking-wide text-accent">{justJoined ? t("shareKickerNew") : t("shareKicker")}</p>
        <h2 id="share-title" className="mt-2 text-xl font-medium">
          {t("shareTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("shareBody")}</p>
        <pre className="mt-5 whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-4 text-sm leading-relaxed text-fg">
          {SHARE_COPY[lang]}
        </pre>
        <div className="mt-5 grid gap-2">
          <Button className="w-full" size="lg" asChild>
            <a href={whatsappHref(lang)} target="_blank" rel="noreferrer">
              {t("wa")}
            </a>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" asChild>
              <a href={xHref(lang)} target="_blank" rel="noreferrer">
                {t("postX")}
              </a>
            </Button>
            <CopyButton value={shareMessage(lang)} size="default" label={t("copyText")} />
          </div>
          <Button variant="ghost" onClick={() => void onNative()}>
            {t("shareDevice")}
          </Button>
        </div>
      </div>
    </div>
  );
}
