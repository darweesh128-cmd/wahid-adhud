import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inviteRef, nativeShare, pageUrl, shareMessage, whatsappHref, xHref } from "@/lib/share";
import { useI18n } from "@/lib/i18n";
import { CopyButton } from "@/components/pool/copy-button";
import { cn } from "@/lib/utils";

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
  ref,
}: {
  open: boolean;
  onClose: () => void;
  justJoined?: boolean;
  ref?: string | null;
}) {
  const { t, lang } = useI18n();
  if (!open) return null;

  const message = shareMessage(lang, ref);
  const joined = Boolean(justJoined);

  async function onNative() {
    const result = await nativeShare(lang, ref);
    if (result === "shared") toast.success(t("sent"));
    if (result === "copied") toast.success(t("copiedPaste"));
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/90 p-4 backdrop-blur-sm sm:p-5"
      onClick={joined ? undefined : onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className={cn(
          "relative w-full max-w-md rounded-xl border bg-surface p-6 shadow-soft",
          joined ? "border-accent ring-2 ring-accent/40 share-pulse" : "border-border",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {!joined ? (
          <button
            type="button"
            className="absolute end-4 top-4 grid size-9 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X className="size-4" />
          </button>
        ) : null}
        <p className="text-xs font-medium tracking-wide text-accent">{joined ? t("shareKickerNew") : t("shareKicker")}</p>
        <h2 id="share-title" className={cn("mt-2 font-medium", joined ? "text-2xl sm:text-3xl" : "text-xl")}>
          {joined ? t("shareTitleJoined") : t("shareTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{joined ? t("shareBodyJoined") : t("shareBody")}</p>
        <pre className="mt-5 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-4 text-sm leading-relaxed text-fg">
          {message}
        </pre>
        <div className="mt-5 grid gap-2">
          <Button className="w-full" size="lg" asChild>
            <a href={whatsappHref(lang, ref)} target="_blank" rel="noreferrer">
              {t("wa")}
            </a>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" asChild>
              <a href={xHref(lang, ref)} target="_blank" rel="noreferrer">
                {t("postX")}
              </a>
            </Button>
            <CopyButton value={message} size="default" label={t("copyText")} />
          </div>
          <Button variant="ghost" onClick={() => void onNative()}>
            {t("shareDevice")}
          </Button>
          {joined ? (
            <Button variant="outline" className="mt-1" onClick={onClose}>
              {t("shareDismissLater")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Persistent invite block for member desks. */
export function InviteCard({ wallet }: { wallet: string }) {
  const { t, lang } = useI18n();
  const ref = inviteRef(wallet);
  const message = shareMessage(lang, ref);
  const link = pageUrl(ref);

  return (
    <section className="mt-6 rounded-xl border border-accent/30 bg-accent-soft p-4">
      <p className="text-xs font-medium tracking-wide text-accent">{t("invite")}</p>
      <h2 className="mt-1 text-lg font-medium">{t("inviteDeskTitle")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("inviteDeskBody")}</p>
      <div className="mt-4 space-y-2">
        <p className="text-[11px] text-fg-subtle">{t("inviteLink")}</p>
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-mono text-xs" dir="ltr">{link}</p>
          <CopyButton value={link} size="sm" variant="outline" />
        </div>
      </div>
      <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-xs leading-relaxed text-fg">
        {message}
      </pre>
      <div className="mt-3 grid gap-2">
        <Button className="w-full" size="sm" asChild>
          <a href={whatsappHref(lang, ref)} target="_blank" rel="noreferrer">
            {t("wa")}
          </a>
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" asChild>
            <a href={xHref(lang, ref)} target="_blank" rel="noreferrer">
              {t("postX")}
            </a>
          </Button>
          <CopyButton value={message} size="sm" label={t("copyInvite")} />
        </div>
      </div>
    </section>
  );
}
