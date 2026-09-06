import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimOwner, updatePoolWallet } from "@/lib/pool-api";
import { OWNER_STORAGE_KEY, walletHintKey, type PoolSnapshot } from "@/lib/pool";
import { HINT_KEYS, useI18n } from "@/lib/i18n";

export function OwnerPanel({
  pool,
  revealed,
  onRevealed,
}: {
  pool: PoolSnapshot;
  revealed: boolean;
  onRevealed: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [trc20, setTrc20] = useState(pool.addresses?.trc20 ?? "");
  const [erc20, setErc20] = useState(pool.addresses?.erc20 ?? "");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setTrc20(pool.addresses.trc20);
    setErc20(pool.addresses.erc20);
    setPassword("");
    setConfirm("");
  }, [open, pool.addresses.erc20, pool.addresses.trc20]);

  const setup = !pool.hasOwnerLock;

  const mutation = useMutation({
    mutationFn: () =>
      setup
        ? claimOwner({ data: { password, trc20, erc20 } })
        : updatePoolWallet({ data: { password, trc20, erc20 } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      try {
        localStorage.setItem(OWNER_STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      onRevealed();
      queryClient.setQueryData(["pool"], result.snapshot);
      void queryClient.invalidateQueries({ queryKey: ["pool"] });
      toast.success(setup ? t("adminLive") : t("walletUpdated"));
      setOpen(false);
    },
    onError: () => {
      toast.error(t("saveFail"));
    },
  });

  const trcKey = trc20.trim() ? walletHintKey(trc20, "trc20") : null;
  const ercKey = erc20.trim() ? walletHintKey(erc20, "erc20") : null;
  const trcError = trcKey ? t(HINT_KEYS[trcKey]) : null;
  const ercError = ercKey ? t(HINT_KEYS[ercKey]) : null;
  const passError = setup && password.length > 0 && password.length < 8 ? t("passShort") : null;
  const confirmError = setup && confirm.length > 0 && confirm !== password ? t("passMismatch") : null;
  const blocked =
    mutation.isPending ||
    !password ||
    !trc20.trim() ||
    Boolean(trcError || ercError || passError || confirmError) ||
    (setup && password !== confirm);

  if (!revealed) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 text-fg-muted"
        onClick={() => setOpen(true)}
        aria-label={t("houseAdmin")}
      >
        <Settings2 className="size-4" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-5">
          <div
            role="dialog"
            aria-labelledby="owner-title"
            className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-soft"
          >
            <button
              type="button"
              className="absolute end-4 top-4 grid size-9 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
            >
              <X className="size-4" />
            </button>

            <p className="text-xs tracking-wide text-accent">{t("houseOnly")}</p>
            <h2 id="owner-title" className="mt-2 text-xl font-medium">
              {setup ? t("activateAdmin") : t("editWallet")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{setup ? t("setupHelp") : t("editHelp")}</p>

            <form
              className="mt-5 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (blocked) return;
                mutation.mutate();
              }}
            >
              <Field
                id="owner-pass"
                label={t("adminPass")}
                type="password"
                autoComplete={setup ? "new-password" : "current-password"}
                value={password}
                onChange={setPassword}
                error={passError}
              />
              {setup ? (
                <Field
                  id="owner-confirm"
                  label={t("confirmPass")}
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={setConfirm}
                  error={confirmError}
                />
              ) : null}
              <Field
                id="owner-trc"
                label={t("houseTrc")}
                value={trc20}
                onChange={setTrc20}
                error={trcError}
                placeholder="T................................"
                ltr
              />
              <Field
                id="owner-erc"
                label={t("houseErc")}
                value={erc20}
                onChange={setErc20}
                error={ercError}
                placeholder="0x................................"
                ltr
              />
              <Button type="submit" className="w-full" size="lg" disabled={blocked}>
                {mutation.isPending ? t("saving") : setup ? t("saveActivate") : t("saveWallet")}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
  ltr,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  ltr?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-fg-muted">
        {label}
      </label>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        dir={ltr ? "ltr" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={type === "password" ? "font-sans" : undefined}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
