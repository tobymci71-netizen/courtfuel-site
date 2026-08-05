import { redirect } from "next/navigation";
import { getUser } from "@/lib/clippers/auth";
import { ensureSchema, sql, type AccountRow, type VideoRow } from "@/lib/clippers/db";
import { fmtUsd, fmtViews, getSettings } from "@/lib/clippers/engine";
import {
  submitAccount,
  submitVideo,
  savePayoutMethod,
} from "@/lib/clippers/actions";
import { SingleFieldForm } from "@/components/clippers/forms";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge[status] ?? "bg-white/10 text-white/60"}`}
    >
      {status}
    </span>
  );
}

export default async function Dashboard() {
  const user = await getUser();
  if (!user) redirect("/clippers/login");

  await ensureSchema();
  const [accounts, videos, paidRows, settings] = await Promise.all([
    sql<AccountRow[]>`
      SELECT * FROM cf_accounts WHERE user_id = ${user.id} ORDER BY created_at DESC`,
    sql<VideoRow[]>`
      SELECT * FROM cf_videos WHERE user_id = ${user.id} ORDER BY created_at DESC`,
    sql<{ paid: string }[]>`
      SELECT COALESCE(SUM(amount_cents), 0) AS paid FROM cf_payments WHERE user_id = ${user.id}`,
    getSettings(),
  ]);

  const earned = videos.reduce((sum, v) => sum + Number(v.earned_cents), 0);
  const totalViews = videos.reduce((sum, v) => sum + Number(v.views), 0);
  const paid = Number(paidRows[0]?.paid ?? 0);
  const owed = Math.max(0, earned - paid);
  const hasApprovedAccount = accounts.some((a) => a.status === "approved");
  const isFixed = user.pay_type === "fixed";
  const budgetLeft = Math.max(
    0,
    Number(settings.budget_cents) - Number(settings.total_earned_cents),
  );

  const statCards = isFixed
    ? [
        { label: "Total views", value: fmtViews(totalViews), hot: true },
        { label: "Videos", value: String(videos.length) },
        { label: "Paid out", value: fmtUsd(paid) },
      ]
    : [
        { label: "Total views", value: fmtViews(totalViews) },
        { label: "Earned", value: fmtUsd(earned) },
        { label: "Paid out", value: fmtUsd(paid) },
        { label: "Owed to you", value: fmtUsd(owed), hot: true },
      ];

  return (
    <div className="space-y-10 py-8">
      <div>
        <h1 className="text-2xl font-bold">
          Hey {user.display_name.split(" ")[0]}
        </h1>
        {isFixed ? (
          <p className="mt-1 text-sm text-white/60">
            You&apos;re on a fixed-rate deal
            {Number(user.deal_amount_cents) > 0 && (
              <span className="ml-2 rounded-full bg-cf-orange/15 px-2.5 py-0.5 text-xs font-semibold text-cf-orange">
                {fmtUsd(user.deal_amount_cents)} /{" "}
                {user.deal_period === "monthly" ? "month" : "week"}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-1 text-sm text-white/60">
            Rate: {fmtUsd(settings.rpm_cents)} per 1K views · Campaign budget
            remaining: {fmtUsd(budgetLeft)}
            {!settings.campaign_active && (
              <span className="ml-2 text-amber-400">· campaign paused</span>
            )}
          </p>
        )}
      </div>

      {/* Totals */}
      <div className={`grid gap-4 ${isFixed ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        {statCards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border p-5 ${c.hot ? "border-cf-orange/50 bg-cf-orange/5" : "border-white/10 bg-white/[0.03]"}`}
          >
            <p className={`text-2xl font-bold ${c.hot ? "text-cf-orange" : ""}`}>
              {c.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-white/50">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* Accounts */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">Your TikTok accounts</h2>
        <p className="mt-1 text-sm text-white/60">
          Videos only count if they&apos;re posted from an approved account.
        </p>
        <div className="mt-4">
          <SingleFieldForm
            action={submitAccount}
            name="url"
            placeholder="https://www.tiktok.com/@yourhandle"
            buttonLabel="Submit account"
          />
        </div>
        {accounts.length > 0 && (
          <ul className="mt-5 divide-y divide-white/10">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-white/80 hover:text-white"
                >
                  @{a.handle}
                </a>
                <Badge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Videos */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">Your videos</h2>
        <p className="mt-1 text-sm text-white/60">
          {isFixed
            ? "No links needed — every video you post on your approved account is found and tracked automatically."
            : "Paste the link of each CourtFuel video or slideshow you post. Views refresh automatically."}
        </p>
        <div className="mt-4">
          {isFixed ? (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              ✓ Auto-tracking is on — just post.
            </p>
          ) : hasApprovedAccount ? (
            <SingleFieldForm
              action={submitVideo}
              name="url"
              placeholder="https://www.tiktok.com/@yourhandle/video/…"
              buttonLabel="Submit video"
            />
          ) : (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              Submit a TikTok account above and wait for approval before
              adding videos.
            </p>
          )}
        </div>
        {videos.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-white/40">
                  <th className="py-2 pr-4 font-medium">Video</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 text-right font-medium">Views</th>
                  {!isFixed && (
                    <th className="py-2 text-right font-medium">Earned</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {videos.map((v) => (
                  <tr key={v.id}>
                    <td className="max-w-[220px] truncate py-3 pr-4">
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 hover:text-white"
                      >
                        {v.url.replace("https://www.tiktok.com/", "")}
                      </a>
                      {v.track_error && (
                        <p className="mt-0.5 text-xs text-amber-400/80">
                          {v.track_error}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge status={v.status} />
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {fmtViews(v.views)}
                    </td>
                    {!isFixed && (
                      <td className="py-3 text-right font-semibold tabular-nums">
                        {fmtUsd(v.earned_cents)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payout details */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">Payout details</h2>
        <p className="mt-1 text-sm text-white/60">
          Where should we send your money? PayPal email, or whatever we&apos;ve
          agreed.
        </p>
        <div className="mt-4">
          <SingleFieldForm
            action={savePayoutMethod}
            name="payout_method"
            placeholder="e.g. PayPal: you@email.com"
            buttonLabel="Save"
            defaultValue={user.payout_method}
          />
        </div>
      </section>
    </div>
  );
}
