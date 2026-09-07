import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RefreshCw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkAdhudUsername, createAdhudAccount, suggestAdhudUsername } from "@/lib/account-api";
import { COUNTRIES, ACCOUNT_USERNAME_STORAGE_KEY, CHECKOUT_SESSION_STORAGE_KEY, isCountry } from "@/lib/pool";
import { getStoredRef } from "@/lib/ref";
import { countryLabel, useI18n } from "@/lib/i18n";
import { usernameHint } from "@/lib/username";
import { cn } from "@/lib/utils";

type JoinAccountPanelProps = {
  country: string;
  onCountryChange: (country: string) => void;
  onJoined?: (username: string) => void;
};

export function JoinAccountPanel({ country, onCountryChange, onJoined }: JoinAccountPanelProps) {
  const { t, lang } = useI18n();
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<"unknown" | "available" | "taken" | "invalid">("unknown");
  const [checking, setChecking] = useState(false);

  const trimmed = username.trim().toLowerCase();
  const hint = trimmed ? usernameHint(trimmed) : null;

  useEffect(() => {
    if (!trimmed || hint) {
      setAvailability(hint ? "invalid" : "unknown");
      return;
    }
    let cancelled = false;
    setChecking(true);
    void checkAdhudUsername({ data: { username: trimmed } })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setAvailability("invalid");
          return;
        }
        setAvailability(result.available ? "available" : "taken");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trimmed, hint]);

  const suggestMutation = useMutation({
    mutationFn: () => suggestAdhudUsername(),
    onSuccess: (result) => setUsername(result.username),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdhudAccount({
        data: {
          username: trimmed,
          country,
          ref: getStoredRef(),
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      try {
        localStorage.setItem(ACCOUNT_USERNAME_STORAGE_KEY, result.username);
        localStorage.setItem(CHECKOUT_SESSION_STORAGE_KEY, result.sessionId);
        if (isCountry(country)) {
          localStorage.setItem("waahid-country", country);
        }
      } catch {
        /* ignore */
      }
      onJoined?.(result.username);
      toast.loading(t("checkoutRedirecting"));
      window.location.href = result.checkoutUrl;
    },
    onError: () => toast.error(t("checkoutFail")),
  });

  const canSubmit =
    Boolean(trimmed) &&
    !hint &&
    availability === "available" &&
    !checking &&
    !createMutation.isPending &&
    !suggestMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-xs font-medium text-fg-muted">
          {t("chooseUsername")}
        </label>
        <div className="flex gap-2">
          <Input
            id="username"
            name="username"
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            placeholder="adhud_arm42"
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            aria-invalid={Boolean(hint) || availability === "taken"}
            className="font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => suggestMutation.mutate()}
            disabled={suggestMutation.isPending}
            aria-label={t("suggestUsername")}
          >
            <RefreshCw className={cn("size-4", suggestMutation.isPending && "animate-spin")} />
          </Button>
        </div>
        {hint ? <p className="text-xs text-danger">{hint}</p> : null}
        {!hint && trimmed && availability === "taken" ? (
          <p className="text-xs text-danger">{t("usernameTaken")}</p>
        ) : null}
        {!hint && trimmed && availability === "available" ? (
          <p className="text-xs text-accent">{t("usernameAvailable")}</p>
        ) : null}
        <p className="text-xs text-fg-subtle">{t("usernameRules")}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="account-country" className="text-xs font-medium text-fg-muted">
          {t("serveCountry")}
        </label>
        <select
          id="account-country"
          value={country}
          onChange={(event) => onCountryChange(event.target.value)}
          className="flex h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-fg"
        >
          {COUNTRIES.map((item) => (
            <option key={item} value={item}>
              {countryLabel(item, lang)}
            </option>
          ))}
        </select>
      </div>

      <Button type="button" size="lg" className="w-full" disabled={!canSubmit} onClick={() => createMutation.mutate()}>
        <UserRound className="size-4" />
        {createMutation.isPending ? t("creatingAccount") : t("continueToPay")}
      </Button>
      <p className="text-center text-xs text-fg-muted">{t("cardCheckoutHint")}</p>
    </div>
  );
}

export function ActiveAccountBanner({ username }: { username: string }) {
  const { t } = useI18n();
  return (
    <div className="mt-4 rounded-md border border-border bg-accent-soft px-4 py-3">
      <p className="text-xs text-fg-muted">{t("yourAccount")}</p>
      <p className="mt-1 font-mono text-lg text-accent">@{username}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/member/$username" params={{ username }}>
            {t("openDesk")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
