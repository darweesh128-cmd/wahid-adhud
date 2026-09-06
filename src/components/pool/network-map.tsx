import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { formatTimeAgo, formatUsd, type NetworkSnapshot } from "@/lib/pool";
import { cn } from "@/lib/utils";

type Laid = {
  wallet: string;
  masked: string;
  country: string;
  given: number;
  x: number;
  y: number;
};

type Hit = Laid & { px: number; py: number };

export function NetworkMap({
  data,
  compact = false,
}: {
  data: NetworkSnapshot;
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitsRef = useRef<Hit[]>([]);
  const navigate = useNavigate();
  const laid = useMemo(() => layout(data), [data]);
  const totals = useMemo(
    () => ({
      collected: data.collected,
      target: data.target,
      remaining: data.remaining,
      donorCount: data.donorCount,
      percent: data.target > 0 ? Math.min(100, (data.collected / data.target) * 100) : 0,
    }),
    [data.collected, data.donorCount, data.remaining, data.target],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function draw() {
      const node = canvasRef.current;
      if (!node || !ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = node.clientWidth;
      const h = node.clientHeight;
      if (node.width !== Math.floor(w * dpr) || node.height !== Math.floor(h * dpr)) {
        node.width = Math.floor(w * dpr);
        node.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      frame += 1;
      const hits: Hit[] = [];
      const scale = Math.min(w, h) * 0.4;

      ctx.save();
      ctx.strokeStyle = "rgba(125, 219, 178, 0.08)";
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      for (const item of laid) {
        const x = cx + item.x * scale;
        const y = cy + item.y * scale;
        hits.push({ ...item, px: x, py: y });
        ctx.strokeStyle = "rgba(125, 219, 178, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        if (!reduce) {
          const t = ((frame * 0.011 + hash(item.wallet)) % 1 + 1) % 1;
          const ease = t * t;
          const px = cx + (x - cx) * (1 - ease);
          const py = cy + (y - cy) * (1 - ease);
          ctx.fillStyle = `rgba(125, 219, 178, ${0.35 + (1 - ease) * 0.65})`;
          ctx.beginPath();
          ctx.arc(px, py, 2.4, 0, Math.PI * 2);
          ctx.fill();
          if (ease < 0.92) {
            ctx.fillStyle = "rgba(232, 238, 233, 0.9)";
            ctx.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace";
            ctx.textAlign = "center";
            ctx.fillText("$1", px, py - 6);
          }
        }

        ctx.fillStyle = "#9ee8c9";
        ctx.beginPath();
        ctx.arc(x, y, 3.5 + Math.min(4, item.given * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      const groups = new Map<string, { x: number; y: number; n: number }>();
      for (const item of laid) {
        const x = cx + item.x * scale;
        const y = cy + item.y * scale;
        const g = groups.get(item.country) ?? { x: 0, y: 0, n: 0 };
        g.x += x;
        g.y += y;
        g.n += 1;
        groups.set(item.country, g);
      }
      ctx.fillStyle = "rgba(139, 147, 140, 0.9)";
      ctx.font = "500 11px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = "center";
      for (const [name, g] of groups) {
        if (g.n < 1) continue;
        const lx = g.x / g.n;
        const ly = g.y / g.n;
        const outward = 18;
        const dx = lx - cx;
        const dy = ly - cy;
        const len = Math.hypot(dx, dy) || 1;
        ctx.fillText(name, lx + (dx / len) * outward, ly + (dy / len) * outward);
      }

      ctx.fillStyle = "#7ddbb2";
      ctx.beginPath();
      ctx.arc(cx, cy, compact ? 38 : 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#08110e";
      ctx.font = "600 11px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TOTAL", cx, cy - 10);
      ctx.font = "700 16px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.fillText(formatUsd(totals.collected), cx, cy + 8);
      ctx.font = "500 10px 'IBM Plex Sans', sans-serif";
      ctx.fillText("USDT", cx, cy + 22);
      hitsRef.current = hits;

      raf = window.requestAnimationFrame(draw);
    }
    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, [compact, laid, totals.collected]);

  const countries = useMemo(() => {
    const map = new Map<string, NetworkSnapshot["nodes"]>();
    for (const n of data.nodes) {
      const list = map.get(n.country) ?? [];
      list.push(n);
      map.set(n.country, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [data.nodes]);

  function onCanvasClick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let best: Hit | null = null;
    let bestDist = 18;
    for (const hit of hitsRef.current) {
      const d = Math.hypot(hit.px - x, hit.py - y);
      if (d < bestDist) {
        best = hit;
        bestDist = d;
      }
    }
    if (best) {
      void navigate({ to: "/adhud/$wallet", params: { wallet: best.wallet } });
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)]">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs text-fg-subtle">The total this round</p>
            <p className="mt-1 font-mono text-2xl font-medium tabular-nums tracking-tight sm:text-3xl">
              {formatUsd(totals.collected)}
              <span className="ml-2 text-sm text-fg-subtle">USDT</span>
            </p>
          </div>
          <div className="text-end">
            <p className="font-mono text-sm tabular-nums text-fg-muted">of {formatUsd(totals.target)}</p>
            <p className="mt-1 font-mono text-xs tabular-nums text-accent">{totals.percent.toFixed(2)}%</p>
          </div>
        </div>
        <div className="px-4 pt-3 sm:px-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${totals.percent}%` }}
            />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 pb-3">
            <div>
              <dt className="text-[11px] text-fg-subtle">Adhuds</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums">{formatUsd(totals.donorCount)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-fg-subtle">Remaining</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums">{formatUsd(totals.remaining)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-fg-subtle">In motion</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-accent">{data.movements.length} $1</dd>
            </div>
          </dl>
        </div>
        <canvas
          ref={canvasRef}
          className={cn("w-full cursor-pointer", compact ? "h-[340px] sm:h-[420px]" : "h-[420px] sm:h-[520px]")}
          onClick={onCanvasClick}
          aria-label="Live example. Dollars move to the House. The center is the total. Click a node to open a desk."
        />
      </div>
      {compact ? (
        <LiveMoves data={data} />
      ) : (
        <aside className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs tracking-wide text-accent">Movements</p>
          <h2 className="mt-2 text-lg font-medium">$1 leaving each node</h2>
          <LiveMoves data={data} nested />
          <p className="mt-6 text-xs tracking-wide text-accent">Service countries</p>
          <ol className="mt-3 max-h-[220px] space-y-3 overflow-auto text-sm">
            {countries.length === 0 ? (
              <li className="text-fg-muted">No Adhuds yet.</li>
            ) : (
              countries.map(([name, members]) => (
                <li key={name}>
                  <div className="flex items-center justify-between gap-3">
                    <span>{name}</span>
                    <span className="font-mono tabular-nums text-accent">{members.length}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {members.slice(0, 6).map((member) => (
                      <Link
                        key={member.wallet}
                        to="/adhud/$wallet"
                        params={{ wallet: member.wallet }}
                        className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-fg-muted hover:border-accent hover:text-fg"
                      >
                        {member.masked}
                      </Link>
                    ))}
                  </div>
                </li>
              ))
            )}
          </ol>
        </aside>
      )}
    </div>
  );
}

function LiveMoves({ data, nested = false }: { data: NetworkSnapshot; nested?: boolean }) {
  const now = Date.now();
  const rows = data.movements;
  const body = (
    <ol className={cn("space-y-2 overflow-auto text-sm", nested ? "mt-4 max-h-[200px]" : "max-h-[220px]")}>
      {rows.length === 0 ? (
        <li className="text-fg-muted">No movement yet. The first $1 starts the example.</li>
      ) : (
        rows.map((row) => (
          <li key={`${row.wallet}-${row.at}`} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/adhud/$wallet"
                params={{ wallet: row.wallet }}
                className="truncate font-mono text-xs hover:text-accent"
              >
                {row.masked}
              </Link>
              <p className="text-[11px] text-fg-subtle">
                {row.country} · {formatTimeAgo(row.at, now)}
              </p>
            </div>
            <p className="shrink-0 font-mono text-xs tabular-nums text-accent">+{row.amount} → House</p>
          </li>
        ))
      )}
    </ol>
  );
  if (nested) return body;
  return (
    <aside className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-wide text-accent">Live movements</p>
        <span className="flex items-center gap-2 text-[11px] text-fg-subtle">
          <span className="live-dot size-1.5 rounded-full bg-accent" />
          $1 in
        </span>
      </div>
      <h2 className="mt-2 text-lg font-medium">Each dollar travels to the House</h2>
      <div className="mt-4">{body}</div>
    </aside>
  );
}

function layout(data: NetworkSnapshot): Laid[] {
  const groups = new Map<string, NetworkSnapshot["nodes"]>();
  for (const node of data.nodes) {
    const list = groups.get(node.country) ?? [];
    list.push(node);
    groups.set(node.country, list);
  }
  const countries = [...groups.keys()];
  const laid: Laid[] = [];
  countries.forEach((country, ci) => {
    const members = groups.get(country) ?? [];
    const angle = (ci / Math.max(1, countries.length)) * Math.PI * 2 - Math.PI / 2;
    members.forEach((member, mi) => {
      const spread = (mi - (members.length - 1) / 2) * 0.2;
      const radius = 0.5 + (ci % 3) * 0.08 + (mi % 4) * 0.1;
      laid.push({
        ...member,
        x: Math.cos(angle + spread) * radius,
        y: Math.sin(angle + spread) * radius,
      });
    });
  });
  return laid;
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 33 + value.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
