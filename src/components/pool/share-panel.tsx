import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { nativeShare, SHARE_BODY, shareMessage, whatsappHref, xHref } from "@/lib/share";
import { CopyButton } from "@/components/pool/copy-button";

export function ShareTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onOpen} className="text-fg-muted">
      <Share2 className="size-4" />
      <span className="hidden sm:inline">Invite</span>
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
  if (!open) return null;

  async function onNative() {
    const result = await nativeShare();
    if (result === "shared") toast.success("Sent.");
    if (result === "copied") toast.success("Copied. Paste it anywhere.");
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
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <p className="text-xs tracking-wide text-accent">{justJoined ? "You are an Adhud" : "Spread"}</p>
        <h2 id="share-title" className="mt-2 text-xl font-medium">
          Send this to three people. Do not explain.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          WhatsApp first. The words work alone. Every Adhud is a publisher.
        </p>
        <pre className="mt-5 whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-4 text-sm leading-relaxed text-fg">
          {SHARE_BODY}
        </pre>
        <div className="mt-5 grid gap-2">
          <Button className="w-full" size="lg" asChild>
            <a href={whatsappHref()} target="_blank" rel="noreferrer">
              Send on WhatsApp
            </a>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" asChild>
              <a href={xHref()} target="_blank" rel="noreferrer">
                Post on X
              </a>
            </Button>
            <CopyButton value={shareMessage()} size="default" label="Copy text" />
          </div>
          <Button variant="ghost" onClick={() => void onNative()}>
            Share from this device
          </Button>
        </div>
      </div>
    </div>
  );
}
