import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Fingerprint, ScanLine, Shield, Users, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/pool/copy-button";
import { AppShell } from "@/components/pool/app-shell";
import { NetworkMap } from "@/components/pool/network-map";
import { ShareOverlay } from "@/components/pool/share-panel";
import { WalletQr } from "@/components/pool/wallet-qr";
import { ActiveAccountBanner, JoinAccountPanel } from "@/components/pool/join-account-panel";
import { contribute, getMembershipCheckoutStatus, getNetwork, getPool } from "@/lib/pool-api";
import { membershipCheckoutV2 } from "@/lib/membership";
import { inviteRef } from "@/lib/share";
import { captureRefFromSearch, getStoredRef } from "@/lib/ref";
import {
  ACCOUNT_USERNAME_STORAGE_KEY,
  CHECKOUT_SESSION_STORAGE_KEY,
  COUNTRIES,
  COUNTRY_STORAGE_KEY,
  DEFAULT_POOL_ADDRESSES,
  NETWORK_STORAGE_KEY,
  USDT_CONTRACTS,
  WALLET_STORAGE_KEY,
  detectNetwork,
  formatTimeAgo,
  formatUsd,
  isCountry,
  walletHintKey,
  type Network,
  type NetworkSnapshot,
  type PoolSnapshot,
} from "@/lib/pool";
import { HINT_KEYS, countryLabel, useI18n, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PoolApp({ initial, network: initialNetwork }: { initial: PoolSnapshot; network: NetworkSnapshot }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [wallet, setWallet] = useState("");
  const [network, setNetwork] = useState<Network>("trc20");
  const [country, setCountry] = useState("Other");
  const [winner, setWinner] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [shareOpen, setShareOpen] = useState(false);
  const [justJoined, setJustJoined] = useState(false);
  const [showUsdtJoin, setShowUsdtJoin] = useState(false);
  const [accountUsername, setAccountUsername] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      const savedNet = localStorage.getItem(NETWORK_STORAGE_KEY);
      const savedCountry = localStorage.getItem(COUNTRY_STORAGE_KEY);
      const savedUsername = localStorage.getItem(ACCOUNT_USERNAME_STORAGE_KEY);
      if (saved) setWallet(saved);
      if (savedNet === "trc20" || savedNet === "erc20") setNetwork(savedNet);
      if (savedCountry && isCountry(savedCountry)) setCountry(savedCountry);
      if (savedUsername) setAccountUsername(savedUsername);
    } catch {
      /* ignore */
    }
    captureRefFromSearch(window.location.search);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    let sessionId = params.get("session_id");
    const paymentIdParam = params.get("pid");
    if (!sessionId) {
      try {
        sessionId = localStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY);
      } catch {
        sessionId = null;
      }
    }
    if (checkout === "cancelled") {
      toast.message(t("checkoutCancelled"));
      window.history.replaceState({}, "", `${window.location.pathname}#join`);
      return;
    }
    if (checkout !== "success" || (!sessionId && !paymentIdParam)) return;

    void (async () => {
      const pendingToast = toast.loading(t("checkoutPending"));
      const statusPayload = sessionId
        ? { sessionId }
        : { paymentId: Number(paymentIdParam) };
      try {
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const result = await getMembershipCheckoutStatus({ data: statusPayload });
          if (!result.ok) {
            toast.error(result.error, { id: pendingToast });
            return;
          }
          if (result.status === "completed") {
            try {
              localStorage.setItem(ACCOUNT_USERNAME_STORAGE_KEY, result.username);
              localStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY);
            } catch {
              /* ignore */
            }
            setAccountUsername(result.username);
            queryClient.setQueryData(["pool", undefined], result.snapshot);
            void queryClient.invalidateQueries({ queryKey: ["pool"] });
            void queryClient.invalidateQueries({ queryKey: ["network"] });
            toast.success(t("toastJoined"), { id: pendingToast });
            setJustJoined(true);
            setShareOpen(true);
            window.history.replaceState({}, "", `${window.location.pathname}#join`);
            return;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }
        toast.message(t("checkoutPending"), { id: pendingToast });
      } catch {
        toast.error(t("checkoutFail"), { id: pendingToast });
      }
    })();
  }, [queryClient, t]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const trimmed = wallet.trim();
  const { data } = useQuery({
    queryKey: ["pool", trimmed],
    queryFn: () => getPool({ data: { wallet: trimmed || undefined } }),
    initialData: initial,
    placeholderData: initial,
    refetchInterval: 8_000,
  });
  const pool = data ?? initial;

  const networkQuery = useQuery({
    queryKey: ["network"],
    queryFn: () => getNetwork(),
    initialData: initialNetwork,
    placeholderData: initialNetwork,
    refetchInterval: 8_000,
  });
  const graph = networkQuery.data ?? initialNetwork;

  const mutation = useMutation({
    mutationFn: () => contribute({ data: { wallet: trimmed, network, country, ref: getStoredRef() } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      try {
        localStorage.setItem(WALLET_STORAGE_KEY, trimmed);
        localStorage.setItem(NETWORK_STORAGE_KEY, network);
        localStorage.setItem(COUNTRY_STORAGE_KEY, country);
      } catch {
        /* ignore */
      }
      queryClient.setQueryData(["pool", trimmed], result.snapshot);
      void queryClient.invalidateQueries({ queryKey: ["pool"] });
      void queryClient.invalidateQueries({ queryKey: ["network"] });
      if (result.settled) {
        setWinner(result.winnerWallet);
        toast.success(t("toastMillion"));
      } else {
        toast.success(t("toastJoined"));
        setJustJoined(true);
        setShareOpen(true);
      }
    },
    onError: () => toast.error(t("toastJoinFail")),
  });

  const address = (pool.addresses ?? DEFAULT_POOL_ADDRESSES)[network];
  const contract = USDT_CONTRACTS[network];
  const detected = trimmed ? detectNetwork(trimmed) : null;
  const hint = trimmed.length > 0 ? walletHintKey(trimmed) : null;
  const walletError =
    trimmed.length > 0
      ? (hint ? t(HINT_KEYS[hint]) : null) ??
        (detected && detected !== network
          ? detected === "trc20"
            ? t("mismatchTrc")
            : t("mismatchErc")
          : null)
      : null;

  function onWalletChange(value: string) {
    setWallet(value);
    const next = detectNetwork(value);
    if (next) setNetwork(next);
  }

  function scrollToJoin() {
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppShell initial={pool}>
      <main className="relative mx-auto w-full max-w-5xl px-5 pb-28 pt-2 md:pb-16">
        <section className="stagger-in max-w-2xl">
          <p className="text-xs font-medium text-accent">
            {t(membershipCheckoutV2 ? "storyKickerV2" : "storyKicker")}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-5xl">
            {t("storyH1a")}
            <span className="mt-2 block text-fg-muted">{t("storyH1b")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-fg sm:text-lg">
            {t(membershipCheckoutV2 ? "storyP1V2" : "storyP1")}
          </p>
          <dl className="mt-6 max-w-xl space-y-4 border-s-2 border-accent ps-4">
            <div>
              <dt className="text-sm font-medium tracking-wide text-accent">{t("storyEtymWord1")}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-fg-muted sm:text-base">{t("storyEtym1")}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium tracking-wide text-accent">{t("storyEtymWord2")}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-fg-muted sm:text-base">{t("storyEtym2")}</dd>
            </div>
          </dl>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base">
            {t(membershipCheckoutV2 ? "storyP2V2" : "storyP2")}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button size="lg" onClick={scrollToJoin}>
              {membershipCheckoutV2 ? t("createAccountCta") : t("joinCta")}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setShareOpen(true)}>
              {t("sendThree")}
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/network">{t("openNetwork")}</Link>
            </Button>
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          {membershipCheckoutV2 && showUsdtJoin ? (
            <article className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ScanLine className="size-4 text-accent" />
                  <h2 className="text-sm font-medium">{t("houseWallet")}</h2>
                </div>
                <Badge variant="outline">TRC-20 · 5 USDT</Badge>
              </div>
              <UsdtJoinInstructions
                address={address}
                contract={contract}
                network={network}
                setNetwork={setNetwork}
                t={t}
              />
            </article>
          ) : membershipCheckoutV2 ? (
            <article className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <p className="text-xs font-medium text-accent">{t("accountFlowKicker")}</p>
              <h2 className="mt-2 text-lg font-medium">{t("accountFlowTitle")}</h2>
              <ol className="mt-4 space-y-3 text-sm text-fg-muted">
                <li>{t("accountFlow1")}</li>
                <li>{t("accountFlow2")}</li>
                <li>{t("accountFlow3")}</li>
              </ol>
              <p className="mt-4 text-xs text-fg-subtle">{t("cardCheckoutHint")}</p>
            </article>
          ) : (
            <article className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ScanLine className="size-4 text-accent" />
                  <h2 className="text-sm font-medium">{t("houseWallet")}</h2>
                </div>
                <Badge variant="outline">TRC-20 · 5 USDT</Badge>
              </div>
              <UsdtJoinInstructions
                address={address}
                contract={contract}
                network={network}
                setNetwork={setNetwork}
                t={t}
              />
            </article>
          )}

          <article id="join" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            {membershipCheckoutV2 ? (
              <>
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-accent" />
                  <h2 className="text-sm font-medium">{t("accountJoinTitle")}</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{t("accountJoinBody")}</p>
                <div className="mt-5">
                  <JoinAccountPanel country={country} onCountryChange={setCountry} />
                </div>
                {accountUsername ? <ActiveAccountBanner username={accountUsername} /> : null}
                <Separator className="my-5" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-fg-muted"
                  onClick={() => setShowUsdtJoin((value) => !value)}
                >
                  {showUsdtJoin ? t("hideUsdtJoin") : t("orPayUsdt")}
                </Button>
                {showUsdtJoin ? (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    <p className="text-xs text-fg-muted">{t("legacyUsdtBody")}</p>
                    <UsdtJoinForm
                      wallet={wallet}
                      network={network}
                      country={country}
                      walletError={walletError}
                      mutationPending={mutation.isPending}
                      trimmed={trimmed}
                      onWalletChange={onWalletChange}
                      onCountryChange={setCountry}
                      onSubmit={() => mutation.mutate()}
                      lang={lang}
                      t={t}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-accent" />
                  <h2 className="text-sm font-medium">{t("joinTitle")}</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{t("joinBody")}</p>
                <UsdtJoinForm
                  wallet={wallet}
                  network={network}
                  country={country}
                  walletError={walletError}
                  mutationPending={mutation.isPending}
                  trimmed={trimmed}
                  onWalletChange={onWalletChange}
                  onCountryChange={setCountry}
                  onSubmit={() => mutation.mutate()}
                  lang={lang}
                  t={t}
                  className="mt-5"
                />
              </>
            )}

            {pool.yourTickets > 0 ? (
              <div className="mt-4 rounded-md border border-border bg-accent-soft px-4 py-3">
                <p className="text-xs text-fg-muted">{t("yourGift")}</p>
                <p className="mt-1 font-mono text-lg tabular-nums text-accent">
                  {pool.yourTickets} USDT
                  <span className="ms-2 text-xs text-fg-muted">
                    · {pool.yourTickets} {t("of")} {formatUsd(pool.target, lang)}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setJustJoined(true);
                      setShareOpen(true);
                    }}
                  >
                    {t("sendThree")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to="/adhud/$wallet" params={{ wallet: trimmed }}>
                      {t("openDesk")}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}

            <Separator className="my-5" />
            <ul className="space-y-3 text-sm text-fg-muted">
              <li className="flex gap-3">
                <Fingerprint className="mt-0.5 size-4 shrink-0 text-accent" />
                {t(membershipCheckoutV2 ? "point1V2" : "point1")}
              </li>
              <li className="flex gap-3">
                <Shield className="mt-0.5 size-4 shrink-0 text-accent" />
                {t("point2")}
              </li>
              <li className="flex gap-3">
                <Users className="mt-0.5 size-4 shrink-0 text-accent" />
                {t("point3")}
              </li>
            </ul>
          </article>
        </section>

        <section className="mt-12">
          <p className="text-xs font-medium text-accent">{t("networkTitle")}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">{t("networkLead")}</p>
          <div className="mt-6">
            <NetworkMap data={graph} compact />
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">{t("newAdhuds")}</h2>
            <span className="flex items-center gap-2 text-[11px] text-fg-subtle">
              <span className="live-dot size-1.5 rounded-full bg-accent" />
              {t("live")}
            </span>
          </div>
          <ol className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {pool.recent.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-fg-muted">{t("noAdhud")}</li>
            ) : (
              pool.recent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    {row.displayName ? (
                      <Link
                        to="/member/$username"
                        params={{ username: row.displayName }}
                        className="truncate text-left font-mono text-sm hover:text-accent"
                        dir="ltr"
                      >
                        {row.walletMasked}
                      </Link>
                    ) : (
                      <Link
                        to="/adhud/$wallet"
                        params={{ wallet: row.wallet }}
                        className="truncate text-left font-mono text-sm hover:text-accent"
                        dir="ltr"
                      >
                        {row.walletMasked}
                      </Link>
                    )}
                    <p className="mt-0.5 text-[11px] text-fg-subtle">
                      {row.network === "trc20" ? "TRC-20" : "ERC-20"} · {formatTimeAgo(row.at, now, lang)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm tabular-nums text-accent">+{row.amount}</p>
                </li>
              ))
            )}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium">{t("howTitle")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Step n="01" title={t("step1t")}>
              {t(membershipCheckoutV2 ? "step1V2" : "step1")}
            </Step>
            <Step n="02" title={t("step2t")}>
              {t("step2")}
            </Step>
            <Step n="03" title={t("step3t")}>
              {t("step3")}
            </Step>
          </div>
        </section>

        {pool.previous ? (
          <section className="mt-10 rounded-xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-xs tracking-wide text-fg-subtle">{t("prevKicker")}</p>
            <h2 className="mt-2 text-lg font-medium">{t("prevTitle")}</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="min-w-0 flex-1 break-all text-left font-mono text-sm" dir="ltr">
                {pool.previous.winnerWallet}
              </p>
              <CopyButton value={pool.previous.winnerWallet} size="sm" variant="outline" label={t("copyAddress")} />
            </div>
            <p className="mt-3 text-xs text-fg-muted">
              {formatUsd(pool.previous.collected, lang)} USDT · {formatUsd(pool.previous.donorCount, lang)} {t("adhuds")} ·{" "}
              {t("round")} {pool.previous.roundId}
            </p>
          </section>
        ) : null}

        <footer className="mt-14 border-t border-border pt-8 text-sm text-fg-muted">
          <p className="font-medium text-fg">{t("footerLead")}</p>
          <p className="mt-2 max-w-2xl leading-relaxed">
            {t(membershipCheckoutV2 ? "footerBodyV2" : "footerBody")}
          </p>
          <p className="mt-6 text-[11px] text-fg-subtle">
            {t("brand")} · {t("family")}
          </p>
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 p-3 backdrop-blur md:hidden">
        {pool.yourTickets > 0 ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              setJustJoined(true);
              setShareOpen(true);
            }}
          >
            {t("sendThree")}
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={scrollToJoin}>
            {membershipCheckoutV2 ? t("createAccountCta") : t("joinCta")}
          </Button>
        )}
      </div>

      <ShareOverlay
        open={shareOpen}
        justJoined={justJoined}
        ref={inviteRef(trimmed) ?? getStoredRef()}
        onClose={() => {
          setShareOpen(false);
          setJustJoined(false);
        }}
      />

      {winner ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-5">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-soft">
            <button
              type="button"
              className="absolute end-4 top-4 grid size-9 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
              onClick={() => setWinner(null)}
              aria-label={t("close")}
            >
              <X className="size-4" />
            </button>
            <p className="text-xs tracking-wide text-accent">{t("aidArrived")}</p>
            <h2 className="mt-2 text-2xl font-medium">{t("millionReached")}</h2>
            <p className="mt-3 text-sm text-fg-muted">{t("millionBody")}</p>
            <p className="mt-5 break-all rounded-md border border-border bg-surface-2 p-3 text-left font-mono text-sm" dir="ltr">
              {winner}
            </p>
            <div className="mt-4 flex gap-2">
              <CopyButton value={winner} size="default" variant="secondary" label={t("copyWallet")} />
              <Button className="flex-1" onClick={() => setWinner(null)}>
                {t("continue")}
                <ArrowUpRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function NetworkTab({
  active,
  onClick,
  children,
  recommended,
  advanced,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  recommended?: boolean;
  advanced?: boolean;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1 rounded-md text-xs font-medium transition-colors duration-150",
        active ? "bg-surface text-fg shadow-none" : "text-fg-muted hover:text-fg",
      )}
    >
      {children}
      {recommended ? <span className="ms-1 text-[10px] text-accent">{t("best")}</span> : null}
      {advanced ? <span className="ms-1 text-[10px] text-fg-subtle">{t("advanced")}</span> : null}
    </button>
  );
}

function JoinFlowStep({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[11px] text-accent">
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{children}</p>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <p className="font-mono text-[11px] text-accent">{n}</p>
      <h3 className="mt-2 text-sm font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{children}</p>
    </article>
  );
}

function UsdtJoinInstructions({
  address,
  contract,
  network,
  setNetwork,
  t,
}: {
  address: string;
  contract: string;
  network: Network;
  setNetwork: (network: Network) => void;
  t: (key: CopyKey) => string;
}) {
  return (
    <>
      <div className="mt-5 space-y-3">
        <p className="text-xs font-medium text-accent">{t("joinFlowTitle")}</p>
        <JoinFlowStep n="1" title={t("joinFlow1t")}>{t("joinFlow1")}</JoinFlowStep>
        <JoinFlowStep n="2" title={t("joinFlow2t")}>{t("joinFlow2")}</JoinFlowStep>
        <JoinFlowStep n="3" title={t("joinFlow3t")}>{t("joinFlow3")}</JoinFlowStep>
      </div>
      <div className="mt-4 space-y-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-xs leading-relaxed text-fg-muted">
        <p>{t("joinWarnNetwork")}</p>
        <p>{t("joinWarnAmount")}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1">
        <NetworkTab active={network === "trc20"} onClick={() => setNetwork("trc20")} recommended>
          TRC-20
        </NetworkTab>
        <NetworkTab active={network === "erc20"} onClick={() => setNetwork("erc20")} advanced>
          ERC-20
        </NetworkTab>
      </div>
      <div className="mx-auto mt-4 aspect-square w-full max-w-[220px] rounded-lg bg-paper p-3">
        <WalletQr value={address} />
      </div>
      <p className="mt-3 text-center text-xs text-fg-subtle">{t("scanHint")}</p>
      <div className="mt-4 rounded-md border border-border bg-surface-2 p-3">
        <p className="text-[11px] text-fg-subtle">{t("address")}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <p className="min-w-0 flex-1 break-all text-left font-mono text-[12px] leading-relaxed text-fg" dir="ltr">
            {address}
          </p>
          <CopyButton value={address} />
        </div>
      </div>
      <p className="mt-3 text-left font-mono text-[11px] leading-relaxed text-fg-subtle" dir="ltr">
        USDT {contract}
      </p>
      {network === "erc20" ? (
        <p className="mt-2 text-xs text-fg-muted">{t("ethGas")}</p>
      ) : (
        <p className="mt-2 text-xs text-fg-muted">{t("tronFees")}</p>
      )}
    </>
  );
}

function UsdtJoinForm({
  wallet,
  network,
  country,
  walletError,
  mutationPending,
  trimmed,
  onWalletChange,
  onCountryChange,
  onSubmit,
  lang,
  t,
  className,
}: {
  wallet: string;
  network: Network;
  country: string;
  walletError: string | null;
  mutationPending: boolean;
  trimmed: string;
  onWalletChange: (value: string) => void;
  onCountryChange: (country: string) => void;
  onSubmit: () => void;
  lang: "ar" | "en";
  t: (key: CopyKey) => string;
  className?: string;
}) {
  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (walletError || !trimmed) return;
        onSubmit();
      }}
    >
      <div className="space-y-2">
        <label htmlFor="wallet" className="text-xs font-medium text-fg-muted">
          {t("payoutWallet")}
        </label>
        <Input
          id="wallet"
          name="wallet"
          autoComplete="off"
          spellCheck={false}
          dir="ltr"
          placeholder={network === "trc20" ? "T................................" : "0x................................"}
          value={wallet}
          onChange={(event) => onWalletChange(event.target.value)}
          aria-invalid={Boolean(walletError)}
        />
        {walletError ? <p className="text-xs text-danger">{walletError}</p> : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="country" className="text-xs font-medium text-fg-muted">
          {t("serveCountry")}
        </label>
        <select
          id="country"
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
      <Button type="submit" size="lg" className="w-full" disabled={mutationPending || !trimmed || Boolean(walletError)}>
        {mutationPending ? t("joining") : membershipCheckoutV2 ? t("joinUsdtCta") : t("joinCta")}
      </Button>
    </form>
  );
}
