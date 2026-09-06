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
import { contribute, getNetwork, getPool } from "@/lib/pool-api";
import {
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
  walletHint,
  type Network,
  type NetworkSnapshot,
  type PoolSnapshot,
} from "@/lib/pool";
import { cn } from "@/lib/utils";

export function PoolApp({ initial, network: initialNetwork }: { initial: PoolSnapshot; network: NetworkSnapshot }) {
  const queryClient = useQueryClient();
  const [wallet, setWallet] = useState("");
  const [network, setNetwork] = useState<Network>("trc20");
  const [country, setCountry] = useState("Saudi Arabia");
  const [winner, setWinner] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [shareOpen, setShareOpen] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      const savedNet = localStorage.getItem(NETWORK_STORAGE_KEY);
      const savedCountry = localStorage.getItem(COUNTRY_STORAGE_KEY);
      if (saved) setWallet(saved);
      if (savedNet === "trc20" || savedNet === "erc20") setNetwork(savedNet);
      if (savedCountry && isCountry(savedCountry)) setCountry(savedCountry);
    } catch {
      /* ignore */
    }
  }, []);

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
    mutationFn: () => contribute({ data: { wallet: trimmed, network, country } }),
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
        toast.success("The million landed. Aid reached an Adhud.");
      } else {
        toast.success("You are an Adhud. Send this to three people.");
        setJustJoined(true);
        setShareOpen(true);
      }
    },
    onError: () => toast.error("Could not join. Try again."),
  });

  const address = (pool.addresses ?? DEFAULT_POOL_ADDRESSES)[network];
  const contract = USDT_CONTRACTS[network];
  const detected = trimmed ? detectNetwork(trimmed) : null;
  const walletError =
    trimmed.length > 0
      ? walletHint(trimmed) ??
        (detected && detected !== network
          ? detected === "trc20"
            ? "That is a Tron address — choose TRC-20."
            : "That is an Ethereum address — choose ERC-20."
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
          <p className="text-xs font-medium text-accent">Wallet-level · no account · USDT</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            You may be fine today.
            <span className="mt-2 block text-fg-muted">Someone else is not.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base">
            One dollar. Become an Adhud. Do not join to take — join because you are someone's arm.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button size="lg" onClick={scrollToJoin}>
              Become an Adhud · 1 USDT
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setShareOpen(true)}>
              Send to three
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/network">Open the network</Link>
            </Button>
          </div>
        </section>

        <section className="mt-10">
          <p className="text-xs font-medium text-accent">The example</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">The total, and the dollars moving.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
            Center is the House sum. Each pulse is $1 USDT leaving an Adhud. Clusters are countries they can serve from.
          </p>
          <div className="mt-6">
            <NetworkMap data={graph} compact />
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <article className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ScanLine className="size-4 text-accent" />
                <h2 className="text-sm font-medium">House wallet</h2>
              </div>
              <Badge variant="outline">{network === "trc20" ? "TRC-20" : "ERC-20"}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1">
              <NetworkTab active={network === "trc20"} onClick={() => setNetwork("trc20")} recommended>
                TRC-20
              </NetworkTab>
              <NetworkTab active={network === "erc20"} onClick={() => setNetwork("erc20")}>
                ERC-20
              </NetworkTab>
            </div>
            <div className="mx-auto mt-4 aspect-square w-full max-w-[220px] rounded-lg bg-paper p-3">
              <WalletQr value={address} />
            </div>
            <p className="mt-3 text-center text-xs text-fg-subtle">Scan, send 1 USDT, become an Adhud</p>
            <div className="mt-4 rounded-md border border-border bg-surface-2 p-3">
              <p className="text-[11px] text-fg-subtle">Address</p>
              <div className="mt-1.5 flex items-center gap-2">
                <p className="min-w-0 flex-1 break-all font-mono text-[12px] leading-relaxed text-fg text-left" dir="ltr">
                  {address}
                </p>
                <CopyButton value={address} />
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-fg-subtle text-left" dir="ltr">
              USDT {contract}
            </p>
            {network === "erc20" ? (
              <p className="mt-2 text-xs text-fg-muted">Ethereum gas can exceed one dollar. TRC-20 is the right network for 1 USDT.</p>
            ) : (
              <p className="mt-2 text-xs text-fg-muted">Tron fees stay low — built for a one-dollar gift.</p>
            )}
          </article>

          <article id="join" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-accent" />
              <h2 className="text-sm font-medium">Enter your wallet. Become an Adhud.</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              No name. No login. Your wallet is the desk. Pick the country you can serve from — that is your node on the network.
            </p>
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (walletError || !trimmed) return;
                mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <label htmlFor="wallet" className="text-xs font-medium text-fg-muted">
                  Payout wallet
                </label>
                <Input
                  id="wallet"
                  name="wallet"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={network === "trc20" ? "T................................" : "0x................................"}
                  value={wallet}
                  onChange={(event) => onWalletChange(event.target.value)}
                  aria-invalid={Boolean(walletError)}
                />
                {walletError ? <p className="text-xs text-danger">{walletError}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="country" className="text-xs font-medium text-fg-muted">
                  Country you can serve
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="flex h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-fg"
                >
                  {COUNTRIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending || !trimmed || Boolean(walletError)}>
                {mutation.isPending ? "Joining…" : "Become an Adhud · 1 USDT"}
              </Button>
            </form>

            {pool.yourTickets > 0 ? (
              <div className="mt-4 rounded-md border border-border bg-accent-soft px-4 py-3">
                <p className="text-xs text-fg-muted">Your gift this round</p>
                <p className="mt-1 font-mono text-lg tabular-nums text-accent">
                  {pool.yourTickets} USDT
                  <span className="ml-2 text-xs text-fg-muted">
                    · {pool.yourTickets} of {formatUsd(pool.target)}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setJustJoined(true); setShareOpen(true); }}>
                    Send to three
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to="/adhud/$wallet" params={{ wallet: trimmed }}>
                      Open my desk
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}

            <Separator className="my-5" />
            <ul className="space-y-3 text-sm text-fg-muted">
              <li className="flex gap-3">
                <Fingerprint className="mt-0.5 size-4 shrink-0 text-accent" />
                No account. Every payer is an Adhud. The wallet is the name.
              </li>
              <li className="flex gap-3">
                <Shield className="mt-0.5 size-4 shrink-0 text-accent" />
                Do not join to take. Join because someone needs an arm.
              </li>
              <li className="flex gap-3">
                <Users className="mt-0.5 size-4 shrink-0 text-accent" />
                Money, service, force, influence. Every million aids one of us.
              </li>
            </ul>
          </article>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">New Adhuds</h2>
            <span className="flex items-center gap-2 text-[11px] text-fg-subtle">
              <span className="live-dot size-1.5 rounded-full bg-accent" />
              Live
            </span>
          </div>
          <ol className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {pool.recent.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-fg-muted">No Adhud yet. Be the first.</li>
            ) : (
              pool.recent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      to="/adhud/$wallet"
                      params={{ wallet: row.wallet }}
                      className="truncate font-mono text-sm text-left hover:text-accent"
                      dir="ltr"
                    >
                      {row.walletMasked}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-fg-subtle">
                      {row.network === "trc20" ? "TRC-20" : "ERC-20"} · {formatTimeAgo(row.at, now)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm tabular-nums text-accent">+{row.amount}</p>
                </li>
              ))
            )}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium">How the House works</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Step n="01" title="Become an Adhud">
              Scan, send 1 USDT, register your wallet and the country you can serve.
            </Step>
            <Step n="02" title="The arm strengthens">
              Target: {formatUsd(pool.target)} USDT. Every dollar is visible on the live ledger and the network.
            </Step>
            <Step n="03" title="Aid reaches an Adhud">
              At one million, aid lands with one of us. A new round begins.
            </Step>
          </div>
        </section>

        {pool.previous ? (
          <section className="mt-10 rounded-xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-xs tracking-wide text-fg-subtle">Previous round · aid arrived</p>
            <h2 className="mt-2 text-lg font-medium">This Adhud received the million.</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="min-w-0 flex-1 break-all font-mono text-sm text-left" dir="ltr">
                {pool.previous.winnerWallet}
              </p>
              <CopyButton value={pool.previous.winnerWallet} size="sm" variant="outline" label="Copy address" />
            </div>
            <p className="mt-3 text-xs text-fg-muted">
              {formatUsd(pool.previous.collected)} USDT · {formatUsd(pool.previous.donorCount)} Adhuds · round{" "}
              {pool.previous.roundId}
            </p>
          </section>
        ) : null}

        <footer className="mt-14 border-t border-border pt-8 text-sm text-fg-muted">
          <p className="font-medium text-fg">We are the Adhud. Every payer is one of us.</p>
          <p className="mt-2 max-w-2xl leading-relaxed">
            No state. No bank. No account. USDT transfers are final. Each dollar is an arm. Each million is aid.
          </p>
          <p className="mt-6 text-[11px] text-fg-subtle">Wahid · The Adhud</p>
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 p-3 backdrop-blur md:hidden">
        {pool.yourTickets > 0 ? (
          <Button className="w-full" size="lg" onClick={() => { setJustJoined(true); setShareOpen(true); }}>
            Send to three
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={scrollToJoin}>
            Become an Adhud · 1 USDT
          </Button>
        )}
      </div>

      <ShareOverlay open={shareOpen} justJoined={justJoined} onClose={() => setShareOpen(false)} />

      {winner ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-5">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-soft">
            <button
              type="button"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
              onClick={() => setWinner(null)}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <p className="text-xs tracking-wide text-accent">Aid arrived</p>
            <h2 className="mt-2 text-2xl font-medium">The million reached one of us</h2>
            <p className="mt-3 text-sm text-fg-muted">This wallet received the House aid. A new round is open.</p>
            <p className="mt-5 break-all rounded-md border border-border bg-surface-2 p-3 font-mono text-sm text-left" dir="ltr">
              {winner}
            </p>
            <div className="mt-4 flex gap-2">
              <CopyButton value={winner} size="default" variant="secondary" label="Copy wallet" />
              <Button className="flex-1" onClick={() => setWinner(null)}>
                Continue
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
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  recommended?: boolean;
}) {
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
      {recommended ? <span className="ml-1 text-[10px] text-accent">best</span> : null}
    </button>
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
