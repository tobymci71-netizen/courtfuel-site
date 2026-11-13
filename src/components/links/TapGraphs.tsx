import { accountColor, fmtDay, fmtHour, RANGES, type DailySeries } from "@/lib/links/daily";
import { TapCharts } from "./TapCharts";

// The graphs block on the "Bio links" admin tab: the 7 / 30 / 90 days switch,
// the two line charts, and the same numbers as a table (newest day first).
// Server-safe: only TapCharts runs in the browser (for hover).
export function TapGraphs({ series, range }: { series: DailySeries; range: number }) {
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/50">Days run midnight to midnight, UK time.</p>
        <nav aria-label="Graph range" className="flex rounded-lg border border-white/15 p-0.5 text-sm">
          {RANGES.map((r) => (
            <a
              key={r}
              href={`?range=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={
                r === range
                  ? "rounded-md bg-white/15 px-3 py-1.5 font-semibold text-white"
                  : "rounded-md px-3 py-1.5 text-white/60 transition hover:text-white"
              }
            >
              {r} days
            </a>
          ))}
        </nav>
      </div>

      {series.total === 0 ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/50">
          No clicks in the last {range} days, so there is nothing to graph yet.
        </p>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <TapCharts series={series} />
          </div>

          <h2 className="mt-8 text-sm font-semibold">Clicks per day, exact numbers</h2>
          <p className="mt-1 text-xs text-white/50">
            Newest day first. Busiest hour is the hour (UK time) with the most clicks
            that day, all accounts together.
          </p>
          <div className="mt-3 max-h-[28rem] overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-cf-black text-xs uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2 text-right">All</th>
                  {series.accounts.map((a, i) => (
                    <th
                      key={a}
                      className="max-w-[8rem] truncate px-3 py-2 text-right normal-case tracking-normal"
                      style={{ color: accountColor(i) }}
                      title={a}
                    >
                      {a}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-3 py-2 text-right">Busiest hour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[...series.days].reverse().map((d) => (
                  <tr key={d.day} className={d.total === 0 ? "text-white/35" : undefined}>
                    <td className="whitespace-nowrap px-3 py-2">{fmtDay(d.day, true)}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{d.total}</td>
                    {series.accounts.map((a) => (
                      <td key={a} className="px-3 py-2 text-right tabular-nums">
                        {d.counts[a]}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-white/60">
                      {d.busiestHour === null ? "–" : `${fmtHour(d.busiestHour)} (${d.busiestHourTaps})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </>
  );
}
