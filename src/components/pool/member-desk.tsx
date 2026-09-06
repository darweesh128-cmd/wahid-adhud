import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/pool/copy-button";
import { getInbox, getMember, getNetwork, getThread, sendMessage } from "@/lib/pool-api";
import { HOUSE_WALLET, formatTimeAgo, isValidWallet, type MemberProfile } from "@/lib/pool";

export function MemberDesk({ wallet }: { wallet: string }) {
  const queryClient = useQueryClient();
  const [peer, setPeer] = useState(HOUSE_WALLET);
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [now] = useState(() => Date.now());

  const profile = useQuery({
    queryKey: ["member", wallet],
    queryFn: () => getMember({ data: { wallet } }),
  });
  const inbox = useQuery({
    queryKey: ["inbox", wallet],
    queryFn: () => getInbox({ data: { wallet } }),
    refetchInterval: 8_000,
  });
  const network = useQuery({
    queryKey: ["network"],
    queryFn: () => getNetwork(),
  });
  const thread = useQuery({
    queryKey: ["thread", wallet, peer],
    queryFn: () => getThread({ data: { me: wallet, other: peer } }),
    refetchInterval: 6_000,
  });

  const send = useMutation({
    mutationFn: () => sendMessage({ data: { from: wallet, to: peer, body, fileName } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBody("");
      setFileName("");
      void queryClient.invalidateQueries({ queryKey: ["thread", wallet, peer] });
      void queryClient.invalidateQueries({ queryKey: ["inbox", wallet] });
      toast.success("Sent.");
    },
    onError: () => toast.error("Could not send."),
  });

  const member: MemberProfile | undefined = profile.data;
  const peerError = peer.trim() && !isValidWallet(peer) ? "Invalid recipient wallet" : null;
  const messages = thread.data ?? [];
  const talkingToHouse = peer.trim() === HOUSE_WALLET;
  const title = useMemo(() => (talkingToHouse ? "The House" : peer), [peer, talkingToHouse]);
  const others = (network.data?.nodes ?? []).filter((node) => node.wallet !== wallet).slice(0, 8);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
      <aside className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs tracking-wide text-accent">Adhud desk</p>
        <h1 className="mt-2 text-2xl font-medium">Your ledger</h1>
        <p className="mt-3 break-all font-mono text-sm text-left" dir="ltr">
          {wallet}
        </p>
        <div className="mt-4">
          <CopyButton value={wallet} size="sm" variant="outline" label="Copy wallet" />
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[11px] text-fg-subtle">Given</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-accent">{member?.given ?? 0} USDT</dd>
          </div>
          <div>
            <dt className="text-[11px] text-fg-subtle">This round</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums">{member?.tickets ?? 0}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[11px] text-fg-subtle">Serves from</dt>
            <dd className="mt-1">{member?.country ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-6 space-y-2">
          <p className="text-[11px] text-fg-subtle">Threads</p>
          <button
            type="button"
            onClick={() => setPeer(HOUSE_WALLET)}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${talkingToHouse ? "bg-accent-soft text-fg" : "text-fg-muted hover:bg-surface-2"}`}
          >
            The House
          </button>
          {(inbox.data ?? []).map((row) =>
            row.peer === HOUSE_WALLET ? null : (
              <button
                key={row.peer}
                type="button"
                onClick={() => setPeer(row.peer)}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm ${peer === row.peer ? "bg-accent-soft text-fg" : "text-fg-muted hover:bg-surface-2"}`}
              >
                <span className="block font-mono text-xs">{row.peerMasked}</span>
                <span className="mt-0.5 block truncate text-[11px] text-fg-subtle">{row.lastBody || "file"}</span>
              </button>
            ),
          )}
        </div>
        <div className="mt-6 flex flex-col gap-2 text-sm">
          <Button variant="secondary" asChild>
            <Link to="/network">Open the network</Link>
          </Button>
        </div>
      </aside>

      <section className="flex min-h-[480px] flex-col rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium">Messages</h2>
        <p className="mt-1 text-xs text-fg-muted">
          Wallet to wallet. Talk to the House, or paste any Adhud address. Attach a file so they know the name — send the file itself off-band.
        </p>
        <label className="mt-4 text-xs text-fg-muted" htmlFor="peer">
          Recipient wallet
        </label>
        <Input
          id="peer"
          className="mt-1.5"
          value={peer}
          onChange={(event) => setPeer(event.target.value.trim())}
          placeholder="T… or 0x…"
        />
        {peerError ? <p className="mt-1 text-xs text-danger">{peerError}</p> : null}
        <p className="mt-2 text-[11px] text-fg-subtle">Talking to {title}</p>
        {others.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {others.map((node) => (
              <button
                key={node.wallet}
                type="button"
                onClick={() => setPeer(node.wallet)}
                className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-fg-muted hover:border-accent hover:text-fg"
              >
                {node.masked}
              </button>
            ))}
          </div>
        ) : null}

        <ol className="mt-4 min-h-0 flex-1 space-y-3 overflow-auto rounded-md border border-border bg-surface-2 p-3">
          {messages.length === 0 ? (
            <li className="py-8 text-center text-sm text-fg-muted">No messages yet.</li>
          ) : (
            messages.map((row) => {
              const mine = row.fromWallet === wallet;
              return (
                <li key={row.id} className={mine ? "text-right" : "text-left"}>
                  <p className="text-[11px] text-fg-subtle">
                    {mine ? "You" : row.fromMasked} · {formatTimeAgo(row.at, now)}
                  </p>
                  {row.body ? <p className="mt-1 text-sm">{row.body}</p> : null}
                  {row.fileName ? (
                    <p className="mt-1 font-mono text-xs text-accent">file: {row.fileName}</p>
                  ) : null}
                </li>
              );
            })
          )}
        </ol>

        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (peerError || !peer.trim()) return;
            send.mutate();
          }}
        >
          <Input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write to this Adhud"
            className="font-sans"
            dir="ltr"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="Optional file name"
              className="font-sans"
            />
            <label className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-md border border-border px-3 text-xs text-fg-muted hover:text-fg">
              Attach
              <input
                type="file"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setFileName(file.name.slice(0, 80));
                  event.target.value = "";
                }}
              />
            </label>
            <Button type="submit" disabled={send.isPending || Boolean(peerError) || (!body.trim() && !fileName.trim())}>
              {send.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
