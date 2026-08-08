import Link from "next/link";

export function ApproveButtons({
  action,
  id,
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="approved" />
        <button className="rounded-full bg-emerald-500/15 px-4 py-1.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/25">
          Approve
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="rejected" />
        <button className="rounded-full bg-red-500/15 px-4 py-1.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/25">
          Reject
        </button>
      </form>
    </div>
  );
}

export type UnreadableVideo = {
  id: number;
  url: string;
  handle: string;
  display_name: string;
  track_error: string;
  last_checked: string | null;
  views: number;
  tracking: boolean;
};

export function NeedsAttention({
  videos,
  action,
}: {
  videos: UnreadableVideo[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <section
      id="attention"
      className={`cf-card scroll-mt-24 p-6 ${videos.length > 0 ? "border-amber-400/40 bg-amber-400/5" : ""}`}
    >
      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
        📦 No longer public
        <CountBadge n={videos.length} />
      </h2>
      {videos.length === 0 ? (
        <p className="mt-3 text-sm text-white/40">
          Every post is reading fine ✓
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-white/70">
            These posts aren&apos;t public any more — deleted, or set to
            private on a reupload. They&apos;ve been{" "}
            <strong>removed from every total</strong>: their views no longer
            count, they&apos;re not re-checked, and any budget they used has
            been credited back. A reupload is picked up as a new post on its
            own. If one goes public again it comes back automatically — or
            hit Restore.
          </p>
          <ul className="mt-4 divide-y divide-white/10">
            {videos.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-[340px] truncate font-medium text-cf-orange hover:underline"
                  >
                    {v.url.replace("https://www.tiktok.com/", "")}
                  </a>
                  <p className="truncate text-xs text-white/50">
                    @{v.handle} · {v.display_name} ·{" "}
                    {v.tracking
                      ? `${Number(v.views).toLocaleString("en-US")} views — retrying`
                      : `${Number(v.views).toLocaleString("en-US")} views removed from totals`}
                    {v.last_checked &&
                      ` · last read ${new Date(v.last_checked).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
                <form action={action}>
                  <input type="hidden" name="id" value={v.id} />
                  <input
                    type="hidden"
                    name="resume"
                    value={v.tracking ? "0" : "1"}
                  />
                  <button className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-cf-orange hover:text-cf-black">
                    {v.tracking ? "Remove now" : "Restore"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function CountBadge({ n, color = "orange" }: { n: number; color?: string }) {
  if (n === 0) return null;
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
        color === "red" ? "bg-red-500 text-white" : "bg-cf-orange text-cf-black"
      }`}
    >
      {n}
    </span>
  );
}

export function AdminTabs({ active }: { active: "rpm" | "fixed" }) {
  const tab = (href: string, label: string, isActive: boolean) => (
    <Link
      href={href}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
        isActive
          ? "bg-cf-orange text-cf-black shadow-[0_8px_30px_-8px_rgba(255,107,26,0.6)]"
          : "border border-white/15 bg-white/[0.04] text-white/70 hover:border-cf-orange/50 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {tab("/clippers/admin", "⚡ RPM campaign", active === "rpm")}
      {tab("/clippers/admin/fixed", "🤝 Fixed deals", active === "fixed")}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        status === "approved"
          ? "bg-emerald-500/15 text-emerald-400"
          : status === "rejected"
            ? "bg-red-500/15 text-red-400"
            : "bg-amber-500/15 text-amber-400"
      }`}
    >
      {status}
    </span>
  );
}

// Next payment due for a fixed deal: last payment (or deal start) + period.
export function nextDue(c: {
  last_paid_at: string | null;
  deal_started_at: string | null;
  deal_period: string;
}): { label: string; overdue: boolean } {
  const base = c.last_paid_at ?? c.deal_started_at;
  if (!base) return { label: "—", overdue: false };
  const d = new Date(base);
  if (c.deal_period === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 7);
  const overdue = d.getTime() <= Date.now();
  return {
    label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    overdue,
  };
}

export function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export type ChartPoint = { captured_at: string; value: string | number };

/* Server-rendered SVG area chart of views over time. */
export function ViewsChart({ points }: { points: ChartPoint[] }) {
  const pts = points.map((s) => ({
    t: new Date(s.captured_at).getTime(),
    v: Number(s.value),
  }));
  if (pts.length < 2) {
    return (
      <p className="mt-4 rounded-xl border border-white/10 bg-cf-black/40 px-5 py-8 text-center text-sm text-white/50">
        The graph draws itself from view refreshes — after a couple of days of
        the daily auto-refresh (or a few manual refreshes) the growth curve
        shows here.
      </p>
    );
  }

  const W = 800;
  const H = 240;
  const PAD_L = 52;
  const PAD_R = 16;
  const PAD_T = 18;
  const PAD_B = 30;
  const minT = pts[0].t;
  const maxT = pts[pts.length - 1].t;
  const maxV = Math.max(...pts.map((p) => p.v), 1) * 1.08;
  const x = (t: number) =>
    PAD_L + ((t - minT) / Math.max(1, maxT - minT)) * (W - PAD_L - PAD_R);
  const y = (v: number) => H - PAD_B - (v / maxV) * (H - PAD_T - PAD_B);

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(maxT).toFixed(1)},${H - PAD_B} L${x(minT).toFixed(1)},${H - PAD_B} Z`;
  const last = pts[pts.length - 1];
  const gridVals = [0.25, 0.5, 0.75, 1].map((f) => maxV * f);
  const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-4 w-full"
      role="img"
      aria-label="Views over time"
    >
      <defs>
        <linearGradient id="cfArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6b1a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff6b1a" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {gridVals.map((v) => (
        <g key={v}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y(v)}
            y2={y(v)}
            stroke="rgba(255,255,255,0.07)"
            strokeDasharray="4 4"
          />
          <text
            x={PAD_L - 8}
            y={y(v) + 4}
            textAnchor="end"
            fontSize="11"
            fill="rgba(255,255,255,0.4)"
          >
            {fmtCompact(Math.round(v))}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#cfArea)" />
      <path
        d={line}
        fill="none"
        stroke="#ff6b1a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(last.t)} cy={y(last.v)} r="4.5" fill="#ff6b1a" />
      <circle cx={x(last.t)} cy={y(last.v)} r="8" fill="#ff6b1a" opacity="0.25" />
      <text x={PAD_L} y={H - 8} fontSize="11" fill="rgba(255,255,255,0.4)">
        {fmtDate(minT)}
      </text>
      <text
        x={W - PAD_R}
        y={H - 8}
        textAnchor="end"
        fontSize="11"
        fill="rgba(255,255,255,0.4)"
      >
        {fmtDate(maxT)}
      </text>
    </svg>
  );
}
