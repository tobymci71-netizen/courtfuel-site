"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { accountColor, fmtDay, yTicks, type DailySeries } from "@/lib/links/daily";

const TOTAL_COLOR = "#f2f2f4";

type Line = { key: string; label: string; color: string; values: number[] };

/* Both bio-link graphs: clicks per day by account, and all clicks per day. */
export function TapCharts({ series }: { series: DailySeries }) {
  const days = series.days.map((d) => d.day);
  const accountLines: Line[] = series.accounts.map((a, i) => ({
    key: a,
    label: a,
    color: accountColor(i),
    values: series.days.map((d) => d.counts[a] ?? 0),
  }));
  const totalLine: Line = {
    key: "__total",
    label: "All",
    color: TOTAL_COLOR,
    values: series.days.map((d) => d.total),
  };

  return (
    <div className="space-y-8">
      <figure>
        <figcaption className="text-sm font-semibold">Clicks per day, by account</figcaption>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {series.accounts.map((a, i) => (
            <li key={a} className="flex min-w-0 max-w-full items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-[3px] w-4 shrink-0 rounded-full"
                style={{ background: accountColor(i) }}
              />
              <span className="min-w-0 break-all">/go/{a}</span>
              <span className="tabular-nums text-white/50">{series.totals[a]}</span>
            </li>
          ))}
        </ul>
        <LineChart days={days} lines={accountLines} showTotalInTip />
      </figure>

      <figure>
        <figcaption className="text-sm font-semibold">
          All clicks per day{" "}
          <span className="font-normal tabular-nums text-white/50">
            ({series.total} in {days.length} {days.length === 1 ? "day" : "days"})
          </span>
        </figcaption>
        <LineChart days={days} lines={[totalLine]} area />
      </figure>
    </div>
  );
}

const H = 240;
const PAD_T = 14;
const PAD_B = 28;
const PAD_L = 34;
const LABEL_GAP = 13;

function shorten(s: string, max: number) {
  return s.length <= max ? s : `${s.slice(0, Math.max(1, max - 1))}…`;
}

/* One SVG line chart that sizes itself to its box, so text stays readable on
   a phone. Hover, tap or drag picks a day; arrow keys move it. */
function LineChart({
  days,
  lines,
  area = false,
  showTotalInTip = false,
}: {
  days: string[];
  lines: Line[];
  area?: boolean;
  showTotalInTip?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [sel, setSel] = useState<number | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipW, setTipW] = useState(0);

  // Measure the read-out so it can be kept inside the chart box.
  useLayoutEffect(() => {
    if (sel !== null && tipRef.current) setTipW(tipRef.current.offsetWidth);
  }, [sel, w]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setW(Math.max(240, Math.round(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = days.length;
  const max = Math.max(0, ...lines.flatMap((l) => l.values));
  const ticks = yTicks(max);
  const top = ticks[ticks.length - 1];

  // Room on the right for the line-end names.
  const longest = Math.max(...lines.map((l) => l.label.length), 1);
  const padR = Math.round(Math.min(w * 0.3, 112, 16 + longest * 6.6));
  const maxChars = Math.max(3, Math.floor((padR - 14) / 6.6));
  const plotW = w - PAD_L - padR;
  const plotH = H - PAD_T - PAD_B;

  const x = (i: number) => PAD_L + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD_T + plotH - (v / top) * plotH;

  // Date labels along the bottom: first, last and evenly spaced between.
  // Counted back from today in even steps, so the newest day always has a label.
  const slots = Math.max(2, Math.floor(plotW / 80) + 1);
  const step = Math.max(1, Math.ceil((n - 1) / (slots - 1)));
  const xIdx: number[] = [];
  for (let i = n - 1; i >= 0; i -= step) xIdx.unshift(i);
  if (xIdx[0] !== 0 && xIdx[0] >= step * 0.75) xIdx.unshift(0);
  else if (xIdx[0] !== 0) xIdx[0] = 0;

  // Line-end names, pushed apart so they never sit on top of each other.
  const ends = lines
    .map((l) => ({ l, y: y(l.values[n - 1] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) {
    if (ends[i].y - ends[i - 1].y < LABEL_GAP) ends[i].y = ends[i - 1].y + LABEL_GAP;
  }
  const floor = H - PAD_B;
  for (let i = ends.length - 1; i >= 0; i--) {
    const limit = i === ends.length - 1 ? floor : ends[i + 1].y - LABEL_GAP;
    if (ends[i].y > limit) ends[i].y = limit;
  }

  function pick(e: PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box || n === 0) return;
    const px = e.clientX - box.left;
    const i = n <= 1 ? 0 : Math.round(((px - PAD_L) / plotW) * (n - 1));
    setSel(Math.min(n - 1, Math.max(0, i)));
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? -1 : 1;
      setSel((s) => Math.min(n - 1, Math.max(0, (s ?? n - 1) + step)));
    } else if (e.key === "Escape") {
      setSel(null);
    }
  }

  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const tipRows =
    sel === null
      ? []
      : lines
          .map((l) => ({ l, v: l.values[sel] ?? 0 }))
          .sort((a, b) => b.v - a.v);
  const tipTotal = sel === null ? 0 : lines.reduce((s, l) => s + (l.values[sel] ?? 0), 0);
  const tipLeft = sel === null ? 0 : x(sel);
  const tipOnRight = tipLeft < w / 2;
  // On a phone the read-out sits under the chart instead of over the lines.
  const narrow = w < 480;
  const tipX = Math.max(0, Math.min(w - tipW, tipOnRight ? tipLeft + 10 : tipLeft - 10 - tipW));

  return (
    <div ref={boxRef} className="relative mt-3 w-full select-none">
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        className="block max-w-full outline-none focus-visible:ring-2 focus-visible:ring-cf-orange/60"
        role="img"
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setSel(null)}
        aria-label={`${lines.length === 1 ? lines[0].label : "Clicks by account"} per day, ${fmtDay(days[0])} to ${fmtDay(days[n - 1])}. Exact numbers are in the table below.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={PAD_L + plotW}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.07)"}
              strokeDasharray={t === 0 ? undefined : "4 4"}
            />
            <text x={PAD_L - 7} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.5)">
              {t}
            </text>
          </g>
        ))}

        {xIdx.map((i, k) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor={n <= 1 ? "middle" : k === 0 ? "start" : k === xIdx.length - 1 ? "end" : "middle"}
            fontSize="11"
            fill="rgba(255,255,255,0.5)"
          >
            {fmtDay(days[i])}
          </text>
        ))}

        {area && lines[0] && n > 1 && (
          <path
            d={`${path(lines[0].values)} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`}
            fill={lines[0].color}
            opacity="0.08"
          />
        )}

        {lines.map((l) => (
          <path
            key={l.key}
            d={path(l.values)}
            fill="none"
            stroke={l.color}
            strokeWidth={lines.length === 1 ? 2.5 : 2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {/* A dot on every day when there are few days, so one-day lines still show. */}
        {n <= 14 &&
          lines.map((l) =>
            l.values.map((v, i) => <circle key={`${l.key}-${i}`} cx={x(i)} cy={y(v)} r="2.5" fill={l.color} />),
          )}

        {ends.map(({ l, y: ly }) => (
          <g key={l.key}>
            <circle cx={x(n - 1)} cy={y(l.values[n - 1] ?? 0)} r="3.5" fill={l.color} />
            <text x={PAD_L + plotW + 8} y={ly + 4} fontSize="11.5" fontWeight="600" fill={l.color}>
              {shorten(l.label, maxChars)}
            </text>
          </g>
        ))}

        {sel !== null && (
          <g pointerEvents="none">
            <line x1={x(sel)} x2={x(sel)} y1={PAD_T} y2={H - PAD_B} stroke="rgba(255,255,255,0.35)" />
            {lines.map((l) => (
              <circle
                key={l.key}
                cx={x(sel)}
                cy={y(l.values[sel] ?? 0)}
                r="4.5"
                fill={l.color}
                stroke="#0a0a0a"
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}

        <rect
          x={PAD_L}
          y={0}
          width={Math.max(1, plotW)}
          height={H}
          fill="transparent"
          style={{ touchAction: "pan-y", cursor: "crosshair" }}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setSel(null);
          }}
        />
      </svg>

      {sel !== null && (
        <div
          className={
            narrow
              ? "mt-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs"
              : "pointer-events-none absolute top-1 z-10 w-max max-w-[70%] rounded-lg border border-white/15 bg-cf-black/95 px-3 py-2 text-xs shadow-lg"
          }
          ref={tipRef}
          style={narrow ? undefined : { left: tipX }}
        >
          <div className="font-semibold">{fmtDay(days[sel], true)}</div>
          {showTotalInTip && (
            <div className="mt-0.5 tabular-nums text-white/60">{tipTotal} total</div>
          )}
          <ul className="mt-1 space-y-0.5">
            {tipRows.map(({ l, v }) => (
              <li key={l.key} className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: l.color }} />
                <span className="min-w-0 truncate">{l.label}</span>
                <span className="ml-auto pl-3 font-semibold tabular-nums">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
