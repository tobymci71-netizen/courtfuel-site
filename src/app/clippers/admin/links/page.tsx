import { redirect } from "next/navigation";
import { getUser } from "@/lib/clippers/auth";
import { AdminTabs } from "@/components/clippers/admin-ui";
import { removeWaitlistEntry } from "@/lib/links/actions";
import { tapSummary, tapsByDay, waitlistRows } from "@/lib/links/store";
import { parseRange } from "@/lib/links/daily";
import { TapGraphs } from "@/components/links/TapGraphs";

// Admin view for the bio links (/go/<account>) and the Android waitlist.

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function LinksAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const user = await getUser();
  if (!user) redirect("/clippers/login");
  if (user.role !== "admin") redirect("/clippers/dashboard");

  const range = parseRange((await searchParams).range);
  const [taps, waitlist, daily] = await Promise.all([
    tapSummary(),
    waitlistRows(),
    tapsByDay(range),
  ]);
  const emails = waitlist.map((w) => w.email).join(", ");

  return (
    <div className="space-y-10 py-8">
      <AdminTabs active="links" />

      <section>
        <h1 className="text-2xl font-bold">Bio links</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Taps on courtfuel.app/go/&lt;account&gt;. iPhones are sent to the App
          Store, Android phones to the waitlist, everything else to the homepage.
        </p>

        <TapGraphs series={daily} range={range} />

        <h2 className="mt-10 text-sm font-semibold">By kind of phone</h2>
        {taps.length === 0 ? (
          <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/50">
            No taps yet. They show here once a /go link is in a bio.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3 text-right">iPhone, 7 days</th>
                  <th className="px-4 py-3 text-right">Android, 7 days</th>
                  <th className="px-4 py-3 text-right">Other, 7 days</th>
                  <th className="px-4 py-3 text-right">iPhone, all time</th>
                  <th className="px-4 py-3 text-right">Android, all time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {taps.map((t) => (
                  <tr key={t.src}>
                    <td className="px-4 py-3 font-medium">/go/{t.src}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.ios_7d}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.android_7d}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/50">{t.other_7d}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.ios_all}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.android_all}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold">
          Android waitlist{" "}
          <span className="text-white/40">({waitlist.length})</span>
        </h2>
        {waitlist.length === 0 ? (
          <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/50">
            Nobody yet.
          </p>
        ) : (
          <>
            <label className="mt-6 block text-xs uppercase tracking-wide text-white/50">
              All addresses, ready to copy
              <textarea
                readOnly
                value={emails}
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm normal-case tracking-normal text-white"
              />
            </label>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Came from</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {waitlist.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3">{w.email}</td>
                      <td className="px-4 py-3 text-white/60">{w.src}</td>
                      <td className="px-4 py-3 text-white/60">{fmtDate(w.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <form action={removeWaitlistEntry}>
                          <input type="hidden" name="id" value={w.id} />
                          <button className="text-xs text-white/40 transition hover:text-red-400">
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
