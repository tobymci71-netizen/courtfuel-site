import { redirect } from "next/navigation";
import { getUser } from "@/lib/clippers/auth";
import { ensureSchema, sql } from "@/lib/clippers/db";
import { fmtUsd, fmtViews, getSettings } from "@/lib/clippers/engine";
import {
  adminRefreshViews,
  recordPayment,
  reviewAccount,
  reviewVideo,
  setPayType,
  updateSettings,
} from "@/lib/clippers/actions";
import {
  PaymentForm,
  PayTypeForm,
  RefreshButton,
  SettingsForm,
} from "@/components/clippers/forms";

type PendingAccount = {
  id: number;
  url: string;
  handle: string;
  email: string;
  display_name: string;
};

type PendingVideo = {
  id: number;
  url: string;
  handle: string;
  display_name: string;
};

type ClipperSummary = {
  user_id: number;
  display_name: string;
  email: string;
  payout_method: string;
  deal_amount_cents: string;
  deal_period: string;
  deal_started_at: string | null;
  last_paid_at: string | null;
  videos: string;
  views: string;
  earned: string;
  paid: string;
};

type TopVideo = {
  url: string;
  views: number;
  earned_cents: number;
  handle: string;
  display_name: string;
  pay_type: string;
};

type DrillUser = {
  id: number;
  display_name: string;
  email: string;
  pay_type: string;
};

type DrillAccount = {
  id: number;
  user_id: number;
  handle: string;
  url: string;
  status: string;
};

type DrillVideo = {
  account_id: number;
  user_id: number;
  url: string;
  status: string;
  views: number;
  earned_cents: number;
  last_checked: string | null;
};

function ApproveButtons({
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

function CountBadge({ n, color = "orange" }: { n: number; color?: string }) {
  if (n === 0) return null;
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
        color === "red"
          ? "bg-red-500 text-white"
          : "bg-cf-orange text-cf-black"
      }`}
    >
      {n}
    </span>
  );
}

// Next payment due for a fixed deal: last payment (or deal start) + period.
function nextDue(c: ClipperSummary): { label: string; overdue: boolean } {
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

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/clippers/login");
  if (user.role !== "admin") redirect("/clippers/dashboard");

  await ensureSchema();
  const [
    settings,
    pendingAccounts,
    pendingVideos,
    clippers,
    fixedCreators,
    totals,
    topVideos,
    lastRefresh,
    drillUsers,
    drillAccounts,
    drillVideos,
  ] = await Promise.all([
    getSettings(),
    sql<PendingAccount[]>`
      SELECT a.id, a.url, a.handle, u.email, u.display_name
      FROM cf_accounts a JOIN cf_users u ON u.id = a.user_id
      WHERE a.status = 'pending' ORDER BY a.created_at`,
    sql<PendingVideo[]>`
      SELECT v.id, v.url, a.handle, u.display_name
      FROM cf_videos v
      JOIN cf_accounts a ON a.id = v.account_id
      JOIN cf_users u ON u.id = v.user_id
      WHERE v.status = 'pending' ORDER BY v.created_at`,
    sql<ClipperSummary[]>`
      SELECT u.id AS user_id, u.display_name, u.email, u.payout_method,
             u.deal_amount_cents, u.deal_period, u.deal_started_at,
             (SELECT MAX(p.created_at) FROM cf_payments p WHERE p.user_id = u.id) AS last_paid_at,
             COUNT(v.id) FILTER (WHERE v.status = 'approved') AS videos,
             COALESCE(SUM(v.views) FILTER (WHERE v.status = 'approved'), 0) AS views,
             COALESCE(SUM(v.earned_cents), 0) AS earned,
             COALESCE((SELECT SUM(p.amount_cents) FROM cf_payments p WHERE p.user_id = u.id), 0) AS paid
      FROM cf_users u
      LEFT JOIN cf_videos v ON v.user_id = u.id
      WHERE u.role = 'clipper' AND u.pay_type = 'per_view'
      GROUP BY u.id
      ORDER BY earned DESC`,
    sql<ClipperSummary[]>`
      SELECT u.id AS user_id, u.display_name, u.email, u.payout_method,
             u.deal_amount_cents, u.deal_period, u.deal_started_at,
             (SELECT MAX(p.created_at) FROM cf_payments p WHERE p.user_id = u.id) AS last_paid_at,
             COUNT(v.id) FILTER (WHERE v.status = 'approved') AS videos,
             COALESCE(SUM(v.views) FILTER (WHERE v.status = 'approved'), 0) AS views,
             COALESCE(SUM(v.earned_cents), 0) AS earned,
             COALESCE((SELECT SUM(p.amount_cents) FROM cf_payments p WHERE p.user_id = u.id), 0) AS paid
      FROM cf_users u
      LEFT JOIN cf_videos v ON v.user_id = u.id
      WHERE u.role = 'clipper' AND u.pay_type = 'fixed'
      GROUP BY u.id
      ORDER BY views DESC`,
    sql<{ views: string; n: string }[]>`
      SELECT COALESCE(SUM(views), 0) AS views, COUNT(*) AS n
      FROM cf_videos WHERE status = 'approved'`,
    sql<TopVideo[]>`
      SELECT v.url, v.views, v.earned_cents, a.handle, u.display_name, u.pay_type
      FROM cf_videos v
      JOIN cf_accounts a ON a.id = v.account_id
      JOIN cf_users u ON u.id = v.user_id
      WHERE v.status = 'approved' AND v.views > 0
      ORDER BY v.views DESC LIMIT 5`,
    sql<{ t: string | null }[]>`
      SELECT MAX(last_checked) AS t FROM cf_videos WHERE status = 'approved'`,
    sql<DrillUser[]>`
      SELECT id, display_name, email, pay_type
      FROM cf_users WHERE role = 'clipper' ORDER BY display_name`,
    sql<DrillAccount[]>`
      SELECT id, user_id, handle, url, status FROM cf_accounts ORDER BY handle`,
    sql<DrillVideo[]>`
      SELECT account_id, user_id, url, status, views, earned_cents, last_checked
      FROM cf_videos ORDER BY views DESC`,
  ]);

  const spent = Number(settings.total_earned_cents);
  const budget = Number(settings.budget_cents);
  const remaining = Math.max(0, budget - spent);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const totalOwed = clippers.reduce(
    (sum, c) => sum + Math.max(0, Number(c.earned) - Number(c.paid)),
    0,
  );
  const totalViews = Number(totals[0]?.views ?? 0);
  const approvedCount = Number(totals[0]?.n ?? 0);
  const pendingCount = pendingAccounts.length + pendingVideos.length;
  const fixedDueCount = fixedCreators.filter((c) => nextDue(c).overdue).length;
  const refreshedAt = lastRefresh[0]?.t
    ? new Date(lastRefresh[0].t).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "never";

  const kpis = [
    {
      icon: "👀",
      label: "Total views",
      value: fmtViews(totalViews),
      sub: `${approvedCount} live videos`,
      href: "#creators",
    },
    {
      icon: "💰",
      label: "Budget left",
      value: fmtUsd(remaining),
      sub: `of ${fmtUsd(budget)}`,
      alert: budget > 0 && remaining === 0,
      href: "#settings",
    },
    {
      icon: "📤",
      label: "Owed to clippers",
      value: fmtUsd(totalOwed),
      sub: `${clippers.length} per-view clippers`,
      href: "#clippers",
    },
    {
      icon: "⏳",
      label: "Waiting on you",
      value: String(pendingCount),
      sub: "approvals in queue",
      alert: pendingCount > 0,
      href: "#approvals",
    },
    {
      icon: "🤝",
      label: "Fixed-rate due",
      value: String(fixedDueCount),
      sub: `${fixedCreators.length} on fixed deals`,
      alert: fixedDueCount > 0,
      href: "#fixed",
    },
  ];

  return (
    <div className="relative isolate space-y-8 py-8">
      <div
        aria-hidden="true"
        className="cf-glow pointer-events-none absolute left-1/2 top-[-6%] -z-10 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.18),transparent)] blur-2xl"
      />

      {/* Header */}
      <div className="cf-fade-up flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Campaign <span className="cf-text-gradient">HQ</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Views last refreshed: {refreshedAt} · auto-refresh runs daily
            {!settings.campaign_active && (
              <span className="ml-2 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                CAMPAIGN PAUSED
              </span>
            )}
          </p>
        </div>
        <RefreshButton action={adminRefreshViews} />
      </div>

      {/* Quick jump */}
      <nav className="cf-fade-up cf-delay-1 -mt-2 flex flex-wrap gap-2 text-sm">
        {[
          ["#approvals", "⏳ Approvals"],
          ["#creators", "👥 Creator accounts"],
          ["#top", "🏆 Top videos"],
          ["#clippers", "✂️ Clippers"],
          ["#fixed", "🤝 Fixed deals"],
          ["#settings", "⚙️ Settings"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 font-medium text-white/70 transition hover:border-cf-orange/50 hover:text-white"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* KPI tiles */}
      <div className="cf-fade-up cf-delay-1 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((k) => (
          <a
            key={k.label}
            href={k.href}
            className={`cf-card block p-5 ${k.alert ? "border-cf-orange/50 bg-cf-orange/5" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{k.icon}</span>
              {k.alert && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-cf-orange" />
              )}
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">{k.value}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-white/50">
              {k.label}
            </p>
            <p className="text-xs text-white/40">{k.sub}</p>
          </a>
        ))}
      </div>

      {/* Budget + settings side by side */}
      <div id="settings" className="cf-fade-up cf-delay-2 grid scroll-mt-24 gap-6 lg:grid-cols-2">
        <section className="cf-card p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            💸 Budget this round
          </h2>
          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="text-3xl font-bold tabular-nums">
              {fmtUsd(spent)}{" "}
              <span className="text-base font-medium text-white/50">
                of {fmtUsd(budget)} used
              </span>
            </p>
            <p
              className={`text-xl font-bold tabular-nums ${remaining === 0 && budget > 0 ? "text-red-400" : "text-cf-orange"}`}
            >
              {fmtUsd(remaining)} left
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-red-500" : "bg-gradient-to-r from-cf-orange/70 to-cf-orange"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {remaining === 0 && budget > 0 && (
            <p className="mt-3 text-sm text-red-400">
              Budget fully used — earnings paused. Raise it in settings to
              resume.
            </p>
          )}
        </section>

        <section className="cf-card p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            ⚙️ Campaign settings
          </h2>
          <div className="mt-4">
            <SettingsForm
              action={updateSettings}
              rpm={settings.rpm_cents / 100}
              budget={budget / 100}
              active={settings.campaign_active}
            />
          </div>
        </section>
      </div>

      {/* Approvals side by side */}
      <div id="approvals" className="cf-fade-up cf-delay-3 grid scroll-mt-24 gap-6 lg:grid-cols-2">
        <section className="cf-card p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            👤 Account approvals
            <CountBadge n={pendingAccounts.length} />
          </h2>
          {pendingAccounts.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">Queue clear ✓</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {pendingAccounts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-cf-orange hover:underline"
                    >
                      @{a.handle}
                    </a>
                    <p className="truncate text-xs text-white/50">
                      {a.display_name} · {a.email}
                    </p>
                  </div>
                  <ApproveButtons action={reviewAccount} id={a.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cf-card p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            🎬 Video approvals
            <CountBadge n={pendingVideos.length} />
          </h2>
          {pendingVideos.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">Queue clear ✓</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {pendingVideos.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-[280px] truncate font-medium text-cf-orange hover:underline"
                    >
                      {v.url.replace("https://www.tiktok.com/", "")}
                    </a>
                    <p className="text-xs text-white/50">
                      @{v.handle} · {v.display_name}
                    </p>
                  </div>
                  <ApproveButtons action={reviewVideo} id={v.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Everyone: accounts & videos drill-down */}
      <section id="creators" className="cf-fade-up cf-delay-4 cf-card scroll-mt-24 p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          👥 Creator accounts &amp; videos
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Click a person to see every account and video under their email,
          with views per video and their total.
        </p>
        {drillUsers.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">Nobody signed up yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {drillUsers.map((u) => {
              const accounts = drillAccounts.filter(
                (a) => a.user_id === u.id,
              );
              const userVideos = drillVideos.filter(
                (v) => v.user_id === u.id,
              );
              const totalUserViews = userVideos
                .filter((v) => v.status === "approved")
                .reduce((s, v) => s + Number(v.views), 0);
              return (
                <details
                  key={u.id}
                  className="group rounded-xl border border-white/10 bg-cf-black/40 transition open:border-cf-orange/30"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="text-cf-orange transition-transform duration-200 group-open:rotate-90"
                        aria-hidden="true"
                      >
                        ▸
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {u.display_name}
                          {u.pay_type === "fixed" && (
                            <span className="ml-2 rounded-full bg-cf-orange/15 px-2 py-0.5 text-xs font-semibold text-cf-orange">
                              fixed rate
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-white/50">
                          {u.email}
                        </p>
                        {accounts.length > 0 && (
                          <p className="mt-1 flex flex-wrap gap-1.5">
                            {accounts.map((acc) => (
                              <span
                                key={acc.id}
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  acc.status === "approved"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : acc.status === "rejected"
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                @{acc.handle}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">
                        {fmtViews(totalUserViews)}
                      </p>
                      <p className="text-xs text-white/50">
                        total views · {accounts.length}{" "}
                        {accounts.length === 1 ? "account" : "accounts"} ·{" "}
                        {userVideos.length}{" "}
                        {userVideos.length === 1 ? "video" : "videos"}
                      </p>
                    </div>
                  </summary>
                  <div className="space-y-4 border-t border-white/10 px-5 py-4">
                    {accounts.length === 0 && (
                      <p className="text-sm text-white/40">
                        No accounts submitted yet.
                      </p>
                    )}
                    {accounts.map((acc) => {
                      const accVideos = userVideos.filter(
                        (v) => v.account_id === acc.id,
                      );
                      const accViews = accVideos
                        .filter((v) => v.status === "approved")
                        .reduce((s, v) => s + Number(v.views), 0);
                      return (
                        <div key={acc.id}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm">
                              <a
                                href={acc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-cf-orange hover:underline"
                              >
                                @{acc.handle}
                              </a>
                              <span
                                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                                  acc.status === "approved"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : acc.status === "rejected"
                                      ? "bg-red-500/15 text-red-400"
                                      : "bg-amber-500/15 text-amber-400"
                                }`}
                              >
                                {acc.status}
                              </span>
                            </p>
                            <p className="text-xs text-white/50">
                              {fmtViews(accViews)} views on this account
                            </p>
                          </div>
                          {accVideos.length > 0 && (
                            <ul className="mt-2 divide-y divide-white/5 rounded-lg border border-white/10 bg-white/[0.02]">
                              {accVideos.map((v) => (
                                <li
                                  key={v.url}
                                  className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
                                >
                                  <div className="min-w-0">
                                    <a
                                      href={v.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block max-w-[320px] truncate text-sm text-white/85 hover:text-cf-orange"
                                    >
                                      {v.url.replace(
                                        "https://www.tiktok.com/",
                                        "",
                                      )}
                                    </a>
                                    <p className="text-xs text-white/40 capitalize">
                                      {v.status}
                                      {v.last_checked &&
                                        ` · checked ${new Date(v.last_checked).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold tabular-nums">
                                      {fmtViews(v.views)}
                                    </p>
                                    {u.pay_type === "per_view" &&
                                      Number(v.earned_cents) > 0 && (
                                        <p className="text-xs text-white/50">
                                          {fmtUsd(v.earned_cents)}
                                        </p>
                                      )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>


      {/* Top videos */}
      {topVideos.length > 0 && (
        <section id="top" className="cf-fade-up cf-delay-3 cf-card scroll-mt-24 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            🏆 Top videos
          </h2>
          <ul className="mt-4 divide-y divide-white/10">
            {topVideos.map((v, i) => (
              <li key={v.url} className="flex items-center gap-4 py-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    i === 0
                      ? "bg-cf-orange text-cf-black"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-[420px] truncate text-sm font-medium text-white hover:text-cf-orange"
                  >
                    {v.url.replace("https://www.tiktok.com/", "")}
                  </a>
                  <p className="text-xs text-white/50">
                    @{v.handle} · {v.display_name}
                    {v.pay_type === "fixed" && " · fixed rate"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums">{fmtViews(v.views)}</p>
                  <p className="text-xs text-white/50">
                    {v.pay_type === "fixed" ? "views" : fmtUsd(v.earned_cents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-view clippers */}
      <section id="clippers" className="cf-fade-up cf-delay-4 cf-card scroll-mt-24 p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          ✂️ Clippers &amp; payouts
          <CountBadge n={clippers.filter((c) => Number(c.earned) > Number(c.paid)).length} />
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Paid per 1K views from the campaign budget. Pay them (PayPal etc.),
          then record it so &quot;owed&quot; stays accurate.
        </p>
        {clippers.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">No clippers yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-white/40">
                  <th className="py-2 pr-4 font-medium">Clipper</th>
                  <th className="py-2 pr-4 text-right font-medium">Videos</th>
                  <th className="py-2 pr-4 text-right font-medium">Views</th>
                  <th className="py-2 pr-4 text-right font-medium">Earned</th>
                  <th className="py-2 pr-4 text-right font-medium">Paid</th>
                  <th className="py-2 pr-4 text-right font-medium">Owed</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {clippers.map((c) => {
                  const owed = Math.max(0, Number(c.earned) - Number(c.paid));
                  return (
                    <tr key={c.user_id} className="transition hover:bg-white/[0.02]">
                      <td className="max-w-[200px] py-3 pr-4">
                        <p className="truncate font-medium">{c.display_name}</p>
                        <p className="truncate text-xs text-white/50">
                          {c.email}
                        </p>
                        {c.payout_method && (
                          <p className="truncate text-xs text-cf-orange/80">
                            {c.payout_method}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {c.videos}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {fmtViews(c.views)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {fmtUsd(c.earned)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {fmtUsd(c.paid)}
                      </td>
                      <td
                        className={`py-3 pr-4 text-right font-semibold tabular-nums ${owed > 0 ? "text-cf-orange" : "text-white/40"}`}
                      >
                        {fmtUsd(owed)}
                      </td>
                      <td className="py-3">
                        <div className="space-y-2">
                          <PaymentForm action={recordPayment} userId={c.user_id} />
                          <PayTypeForm
                            action={setPayType}
                            userId={c.user_id}
                            current="per_view"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Fixed-rate creators */}
      <section id="fixed" className="cf-fade-up cf-delay-4 cf-card scroll-mt-24 p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          🤝 Fixed-rate creators
          <CountBadge n={fixedDueCount} color="red" />
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Flat weekly or monthly deals. Views tracked like everyone else&apos;s
          — no RPM, no campaign budget. &quot;Next due&quot; = last payment (or
          deal start) plus the period.
        </p>
        {fixedCreators.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">
            Nobody on a fixed rate yet — use &quot;Move to fixed rate&quot; on
            a clipper above.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-white/40">
                  <th className="py-2 pr-4 font-medium">Creator</th>
                  <th className="py-2 pr-4 font-medium">Deal</th>
                  <th className="py-2 pr-4 font-medium">Next due</th>
                  <th className="py-2 pr-4 text-right font-medium">Videos</th>
                  <th className="py-2 pr-4 text-right font-medium">Views</th>
                  <th className="py-2 pr-4 text-right font-medium">Paid</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {fixedCreators.map((c) => {
                  const due = nextDue(c);
                  return (
                    <tr key={c.user_id} className="transition hover:bg-white/[0.02]">
                      <td className="max-w-[180px] py-3 pr-4">
                        <p className="truncate font-medium">{c.display_name}</p>
                        <p className="truncate text-xs text-white/50">
                          {c.email}
                        </p>
                        {c.payout_method && (
                          <p className="truncate text-xs text-cf-orange/80">
                            {c.payout_method}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="whitespace-nowrap rounded-full bg-cf-orange/15 px-2.5 py-1 text-xs font-semibold text-cf-orange">
                          {fmtUsd(c.deal_amount_cents)} /{" "}
                          {c.deal_period === "monthly" ? "month" : "week"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {due.overdue ? (
                          <span className="whitespace-nowrap rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400">
                            DUE NOW
                          </span>
                        ) : (
                          <span className="text-white/70">{due.label}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {c.videos}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                        {fmtViews(c.views)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {fmtUsd(c.paid)}
                      </td>
                      <td className="py-3">
                        <div className="space-y-2">
                          <PaymentForm action={recordPayment} userId={c.user_id} />
                          <div className="flex flex-wrap gap-2">
                            <PayTypeForm
                              action={setPayType}
                              userId={c.user_id}
                              current="per_view"
                              dealAmount={Number(c.deal_amount_cents) / 100}
                              dealPeriod={c.deal_period}
                              label="Update deal"
                            />
                            <PayTypeForm
                              action={setPayType}
                              userId={c.user_id}
                              current="fixed"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
