import { redirect } from "next/navigation";
import { getUser } from "@/lib/clippers/auth";
import { ensureSchema, sql } from "@/lib/clippers/db";
import { fmtUsd, fmtViews, getSettings } from "@/lib/clippers/engine";
import {
  adminRefreshViews,
  recordPayment,
  reviewAccount,
  reviewVideo,
  updateSettings,
} from "@/lib/clippers/actions";
import {
  PaymentForm,
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
  videos: string;
  views: string;
  earned: string;
  paid: string;
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

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/clippers/login");
  if (user.role !== "admin") redirect("/clippers/dashboard");

  await ensureSchema();
  const [settings, pendingAccounts, pendingVideos, clippers] =
    await Promise.all([
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
               COUNT(v.id) FILTER (WHERE v.status = 'approved') AS videos,
               COALESCE(SUM(v.views) FILTER (WHERE v.status = 'approved'), 0) AS views,
               COALESCE(SUM(v.earned_cents), 0) AS earned,
               COALESCE((SELECT SUM(p.amount_cents) FROM cf_payments p WHERE p.user_id = u.id), 0) AS paid
        FROM cf_users u
        LEFT JOIN cf_videos v ON v.user_id = u.id
        WHERE u.role = 'clipper'
        GROUP BY u.id
        ORDER BY earned DESC`,
    ]);

  const spent = Number(settings.total_earned_cents);
  const budget = Number(settings.budget_cents);
  const remaining = Math.max(0, budget - spent);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const totalOwed = clippers.reduce(
    (sum, c) => sum + Math.max(0, Number(c.earned) - Number(c.paid)),
    0,
  );

  return (
    <div className="space-y-10 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Campaign admin</h1>
        <RefreshButton action={adminRefreshViews} />
      </div>

      {/* Budget bar */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/60">Budget used</p>
            <p className="mt-1 text-3xl font-bold">
              {fmtUsd(spent)}{" "}
              <span className="text-lg font-medium text-white/50">
                of {fmtUsd(budget)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/60">Remaining</p>
            <p
              className={`mt-1 text-2xl font-bold ${remaining === 0 && budget > 0 ? "text-red-400" : "text-cf-orange"}`}
            >
              {fmtUsd(remaining)}
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : "bg-cf-orange"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {remaining === 0 && budget > 0 && (
          <p className="mt-3 text-sm text-red-400">
            Budget fully used — earnings are paused. Raise the budget below to
            resume.
          </p>
        )}
        <p className="mt-3 text-sm text-white/50">
          Total currently owed across all clippers: {fmtUsd(totalOwed)}
        </p>
      </section>

      {/* Settings */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">Campaign settings</h2>
        <p className="mt-1 text-sm text-white/60">
          Earnings can never exceed the budget — when it&apos;s used up,
          accrual stops automatically.
        </p>
        <div className="mt-5">
          <SettingsForm
            action={updateSettings}
            rpm={settings.rpm_cents / 100}
            budget={budget / 100}
            active={settings.campaign_active}
          />
        </div>
      </section>

      {/* Pending accounts */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">
          Account approvals{" "}
          {pendingAccounts.length > 0 && (
            <span className="ml-1 rounded-full bg-cf-orange px-2 py-0.5 text-xs font-bold text-cf-black">
              {pendingAccounts.length}
            </span>
          )}
        </h2>
        {pendingAccounts.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">Nothing waiting.</p>
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

      {/* Pending videos */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">
          Video approvals{" "}
          {pendingVideos.length > 0 && (
            <span className="ml-1 rounded-full bg-cf-orange px-2 py-0.5 text-xs font-bold text-cf-black">
              {pendingVideos.length}
            </span>
          )}
        </h2>
        {pendingVideos.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">Nothing waiting.</p>
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
                    className="block max-w-[340px] truncate font-medium text-cf-orange hover:underline"
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

      {/* Payouts */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">Clippers &amp; payouts</h2>
        <p className="mt-1 text-sm text-white/60">
          Pay people however you like (PayPal etc.), then record it here so
          &quot;owed&quot; stays accurate.
        </p>
        {clippers.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">No clippers yet.</p>
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
                  <th className="py-2 font-medium">Record payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {clippers.map((c) => {
                  const owed = Math.max(
                    0,
                    Number(c.earned) - Number(c.paid),
                  );
                  return (
                    <tr key={c.user_id}>
                      <td className="max-w-[200px] py-3 pr-4">
                        <p className="truncate font-medium">
                          {c.display_name}
                        </p>
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
                        className={`py-3 pr-4 text-right font-semibold tabular-nums ${owed > 0 ? "text-cf-orange" : ""}`}
                      >
                        {fmtUsd(owed)}
                      </td>
                      <td className="py-3">
                        <PaymentForm
                          action={recordPayment}
                          userId={c.user_id}
                        />
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
