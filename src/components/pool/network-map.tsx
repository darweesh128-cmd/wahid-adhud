import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { formatUsd, type NetworkSnapshot } from "@/lib/pool";
import { countryLabel, useI18n } from "@/lib/i18n";
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
  const { t, lang } = useI18n();
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
    const totalLabel = t("totalShort");
    const collectedLabel = formatUsd(totals.collected, lang);
    const sans = lang === "ar" ? "IBM Plex Sans Arabic, IBM Plex Sans, sans-serif" : "IBM Plex Sans, sans-serif";

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
      ctx.direction = lang === "ar" ? "rtl" : "ltr";

      const cx = w / 2;
      const cy = h / 2;
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
      ctx.font = `500 11px ${sans}`;
      ctx.textAlign = "center";
      for (const [name, g] of groups) {
        if (g.n < 1) continue;
        const lx = g.x / g.n;
        const ly = g.y / g.n;
        const outward = 18;
        const dx = lx - cx;
        const dy = ly - cy;
        const len = Math.hypot(dx, dy) || 1;
        ctx.fillText(countryLabel(name, lang), lx + (dx / len) * outward, ly + (dy / len) * outward);
      }

      ctx.fillStyle = "#7ddbb2";
      ctx.beginPath();
      ctx.arc(cx, cy, compact ? 38 : 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#08110e";
      ctx.font = `600 11px ${sans}`;
      ctx.textAlign = "center";
      ctx.fillText(totalLabel, cx, cy - 10);
      ctx.font = "700 16px IBM Plex Mono, ui-monospace, monospace";
      ctx.fillText(collectedLabel, cx, cy + 8);
      ctx.font = `500 10px ${sans}`;
      ctx.fillText("USDT", cx, cy + 22);
      hitsRef.current = hits;
    }

    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    draw();
    return () => ro.disconnect();
  }, [compact, laid, lang, t, totals.collected]);

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
            <p className="text-xs text-fg-subtle">{t("totalRound")}</p>
            <p className="mt-1 font-mono text-2xl font-medium tabular-nums tracking-tight sm:text-3xl">
              {formatUsd(totals.collected, lang)}
              <span className="ms-2 text-sm text-fg-subtle">USDT</span>
            </p>
          </div>
          <div className="text-end">
            <p className="font-mono text-sm tabular-nums text-fg-muted">
              {t("of")} {formatUsd(totals.target, lang)}
            </p>
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
          <dl className="mt-3 grid grid-cols-2 gap-3 pb-3">
            <div>
              <dt className="text-[11px] text-fg-subtle">{t("adhuds")}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums">{formatUsd(totals.donorCount, lang)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-fg-subtle">{t("remaining")}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums">{formatUsd(totals.remaining, lang)}</dd>
            </div>
          </dl>
        </div>
        <canvas
          ref={canvasRef}
          className={cn("w-full cursor-pointer", compact ? "h-[340px] sm:h-[420px]" : "h-[420px] sm:h-[520px]")}
          onClick={onCanvasClick}
          aria-label={t("mapAria")}
        />
      </div>
      <aside className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs tracking-wide text-accent">{t("serveCountries")}</p>
        <h2 className="mt-2 text-lg font-medium">{t("whereServe")}</h2>
        <ol className={cn("mt-4 space-y-3 overflow-auto text-sm", compact ? "max-h-[280px]" : "max-h-[420px]")}>
          {countries.length === 0 ? (
            <li className="text-fg-muted">{t("noneYet")}</li>
          ) : (
            countries.map(([name, members]) => (
              <li key={name}>
                <div className="flex items-center justify-between gap-3">
                  <span>{countryLabel(name, lang)}</span>
                  <span className="font-mono tabular-nums text-accent">{members.length}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {members.slice(0, 6).map((member) => (
                    <Link
                      key={member.wallet}
                      to="/adhud/$wallet"
                      params={{ wallet: member.wallet }}
                      className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-fg-muted hover:border-accent hover:text-fg"
                      dir="ltr"
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
    </div>
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
