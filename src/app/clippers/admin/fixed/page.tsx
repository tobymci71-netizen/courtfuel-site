import { redirect } from "next/navigation";
import { getUser } from "@/lib/clippers/auth";
import { ensureSchema, sql } from "@/lib/clippers/db";
import { fmtUsd, fmtViews } from "@/lib/clippers/engine";
import {
  adminRefreshViews,
  recordPayment,
  reviewAccount,
  setPayType,
  stopTracking,
} from "@/lib/clippers/actions";
import {
  PaymentForm,
  PayTypeForm,
  RefreshButton,
} from "@/components/clippers/forms";
import {
  AdminTabs,
  ApproveButtons,
  CountBadge,
  NeedsAttention,
  StatusPill,
  ViewsChart,
  nextDue,
  type UnreadableVideo,
} from "@/components/clippers/admin-ui";

export const maxDuration = 300;

type PendingAccount = {
  id: number;
  url: string;
  handle: string;
  email: string;
  display_name: string;
};

type FixedCreator = {
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
  paid: string;
};

type AccountSummary = {
  id: number;
  handle: string;
  url: string;
  status: string;
  display_name: string;
  videos: string;
  views: string;
};

type DrillVideo = {
  account_id: number;
  user_id: number;
  url: string;
  status: string;
  views: number;
  last_checked: string | null;
};
type Snapshot = { captured_at: string; value: string };

export default async function AdminFixedPage() {
  const user = await getUser();
  if (!user) redirect("/clippers/login");
  if (user.role !== "admin") redirect("/clippers/dashboard");

  await ensureSchema();
  const [
    pendingAccounts,
    creators,
    accountSummaries,
    drillVideos,
    totals,
    snapshots,
    lastRefresh,
    unreadable,
  ] = await Promise.all([
    sql<PendingAccount[]>`
      SELECT a.id, a.url, a.handle, u.email, u.display_name
      FROM cf_accounts a JOIN cf_users u ON u.id = a.user_id
      WHERE a.status = 'pending' AND u.pay_type = 'fixed'
      ORDER BY a.created_at`,
    sql<FixedCreator[]>`
      SELECT u.id AS user_id, u.display_name, u.email, u.payout_method,
             u.deal_amount_cents, u.deal_period, u.deal_started_at,
             (SELECT MAX(p.created_at) FROM cf_payments p WHERE p.user_id = u.id) AS last_paid_at,
             COUNT(v.id) FILTER (WHERE v.status = 'approved') AS videos,
             COALESCE(SUM(v.views) FILTER (WHERE v.status = 'approved'), 0) AS views,
             COALESCE((SELECT SUM(p.amount_cents) FROM cf_payments p WHERE p.user_id = u.id), 0) AS paid
      FROM cf_users u
      LEFT JOIN cf_videos v ON v.user_id = u.id
      WHERE u.role = 'clipper' AND u.pay_type = 'fixed'
      GROUP BY u.id
      ORDER BY views DESC`,
    sql<AccountSummary[]>`
      SELECT a.id, a.handle, a.url, a.status, u.display_name,
             COUNT(v.id) FILTER (WHERE v.status = 'approved') AS videos,
             COALESCE(SUM(v.views) FILTER (WHERE v.status = 'approved'), 0) AS views
      FROM cf_accounts a
      JOIN cf_users u ON u.id = a.user_id
      LEFT JOIN cf_videos v ON v.account_id = a.id
      WHERE u.pay_type = 'fixed'
      GROUP BY a.id, u.display_name
      ORDER BY views DESC, a.handle`,
    sql<DrillVideo[]>`
      SELECT v.account_id, v.user_id, v.url, v.status, v.views, v.last_checked
      FROM cf_videos v JOIN cf_users u ON u.id = v.user_id
      WHERE u.pay_type = 'fixed' ORDER BY v.views DESC`,
    sql<{ views: string; n: string }[]>`
      SELECT COALESCE(SUM(v.views), 0) AS views, COUNT(*) AS n
      FROM cf_videos v JOIN cf_users u ON u.id = v.user_id
      WHERE v.status = 'approved' AND u.pay_type = 'fixed'`,
    sql<Snapshot[]>`
      SELECT captured_at, fixed_views AS value FROM cf_snapshots
      ORDER BY captured_at ASC LIMIT 500`,
    sql<{ t: string | null }[]>`
      SELECT MAX(last_checked) AS t FROM cf_videos WHERE status = 'approved'`,
    sql<UnreadableVideo[]>`
      SELECT v.id, v.url, v.track_error, v.last_checked, a.handle, u.display_name
      FROM cf_videos v
      JOIN cf_accounts a ON a.id = v.account_id
      JOIN cf_users u ON u.id = v.user_id
      WHERE v.status = 'approved' AND v.track_error <> '' AND u.pay_type = 'fixed'
      ORDER BY v.last_checked DESC NULLS LAST`,
  ]);

  const totalViews = Number(totals[0]?.views ?? 0);
  const trackedVideos = Number(totals[0]?.n ?? 0);
  const dueCount = creators.filter((c) => nextDue(c).overdue).length;
  const monthlyCommit = creators.reduce((s, c) => {
    const amt = Number(c.deal_amount_cents);
    return s + (c.deal_period === "monthly" ? amt : amt * 4.33);
  }, 0);
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
      label: "Fixed views",
      value: fmtViews(totalViews),
      sub: `${trackedVideos} tracked videos`,
      href: "#accounts",
    },
    {
      icon: "🤝",
      label: "Creators on deals",
      value: String(creators.length),
      sub: `${accountSummaries.length} accounts`,
      href: "#deals",
    },
    {
      icon: "🚨",
      label: "Payments due",
      value: String(dueCount),
      sub: "check the deals table",
      alert: dueCount > 0,
      href: "#deals",
    },
    {
      icon: "📅",
      label: "≈ Monthly commit",
      value: fmtUsd(Math.round(monthlyCommit)),
      sub: "all deals combined",
      href: "#deals",
    },
    {
      icon: "⏳",
      label: "Waiting on you",
      value: String(pendingAccounts.length),
      sub: "account approvals",
      alert: pendingAccounts.length > 0,
      href: "#approvals",
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
            Fixed <span className="cf-text-gradient">deals</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Views last refreshed: {refreshedAt} · every post on approved
            accounts is scanned automatically — no submissions needed
          </p>
        </div>
        <RefreshButton action={adminRefreshViews} />
      </div>

      <div className="cf-fade-up cf-delay-1">
        <AdminTabs active="fixed" />
      </div>

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

      {/* Analytics */}
      <section id="analytics" className="cf-fade-up cf-delay-2 cf-card scroll-mt-24 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              📈 Fixed-deal views over time
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Every auto-tracked video across all fixed-rate accounts.
            </p>
          </div>
          <p className="text-3xl font-bold tabular-nums text-cf-orange">
            {fmtViews(totalViews)}
          </p>
        </div>
        <ViewsChart points={snapshots} />
      </section>

      {/* Deals table */}
      <section id="deals" className="cf-fade-up cf-delay-2 cf-card scroll-mt-24 p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          🤝 Deals &amp; payments
          <CountBadge n={dueCount} color="red" />
        </h2>
        <p className="mt-1 text-sm text-white/60">
          &quot;Next due&quot; = last recorded payment (or deal start) plus the
          period. Record each payment and the date rolls forward.
        </p>
        {creators.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">
            Nobody on a fixed rate yet — use &quot;Move to fixed rate&quot; on
            the RPM page.
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
                {creators.map((c) => {
                  const due = nextDue(c);
                  return (
                    <tr key={c.user_id} className="transition hover:bg-white/[0.02]">
                      <td className="max-w-[180px] py-3 pr-4">
                        <p className="truncate font-medium">{c.display_name}</p>
                        <p className="truncate text-xs text-white/50">{c.email}</p>
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

      <div className="cf-fade-up cf-delay-3">
        <NeedsAttention videos={unreadable} action={stopTracking} />
      </div>

      {/* Account approvals */}
      <section id="approvals" className="cf-fade-up cf-delay-3 cf-card scroll-mt-24 p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          👤 Account approvals
          <CountBadge n={pendingAccounts.length} />
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Approving an account starts automatic scanning of everything they
          post.
        </p>
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

      {/* Views by account with per-video breakdown */}
      <section id="accounts" className="cf-fade-up cf-delay-3 cf-card scroll-mt-24 p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          📱 Accounts &amp; auto-tracked videos
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Every fixed-rate account, its total, and each scanned video&apos;s
          views. Click an account to expand.
        </p>
        {accountSummaries.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">No accounts yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {accountSummaries.map((a) => {
              const accVideos = drillVideos.filter(
                (v) => v.account_id === a.id,
              );
              return (
                <details
                  key={a.id}
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
                        <p className="truncate font-semibold text-cf-orange">
                          @{a.handle}{" "}
                          <span className="ml-1 align-middle">
                            <StatusPill status={a.status} />
                          </span>
                        </p>
                        <p className="truncate text-xs text-white/50">
                          {a.display_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{fmtViews(a.views)}</p>
                      <p className="text-xs text-white/50">
                        total views · {a.videos}{" "}
                        {Number(a.videos) === 1 ? "video" : "videos"}
                      </p>
                    </div>
                  </summary>
                  <div className="border-t border-white/10 px-5 py-4">
                    {accVideos.length === 0 ? (
                      <p className="text-sm text-white/40">
                        Nothing scanned yet — videos appear after the next view
                        refresh.
                      </p>
                    ) : (
                      <ul className="divide-y divide-white/5 rounded-lg border border-white/10 bg-white/[0.02]">
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
                                className="block max-w-[360px] truncate text-sm text-white/85 hover:text-cf-orange"
                              >
                                {v.url.replace("https://www.tiktok.com/", "")}
                              </a>
                              <p className="text-xs text-white/40">
                                {v.last_checked
                                  ? `checked ${new Date(v.last_checked).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                                  : "not checked yet"}
                              </p>
                            </div>
                            <p className="text-sm font-bold tabular-nums">
                              {fmtViews(v.views)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              );
            })}
            <div className="flex items-center justify-between rounded-xl border-2 border-cf-orange/30 bg-cf-orange/5 px-5 py-4">
              <p className="font-bold">All fixed accounts total</p>
              <p className="text-lg font-bold tabular-nums text-cf-orange">
                {fmtViews(
                  accountSummaries.reduce((s, a) => s + Number(a.views), 0),
                )}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
