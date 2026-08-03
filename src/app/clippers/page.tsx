import Link from "next/link";
import { getSettings, fmtUsd } from "@/lib/clippers/engine";

export default async function ClippersLanding() {
  let rpm = "";
  let budgetLeft = "";
  let active = true;
  try {
    const s = await getSettings();
    rpm = fmtUsd(s.rpm_cents);
    budgetLeft = fmtUsd(
      Math.max(0, Number(s.budget_cents) - Number(s.total_earned_cents)),
    );
    active = s.campaign_active;
  } catch {
    // Database not configured yet — show the page without live numbers.
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Post CourtFuel content.{" "}
          <span className="text-cf-orange">Get paid per view.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-white/70">
          Make TikToks and slideshows promoting CourtFuel from your own
          account. We track the views automatically and pay you for every
          1,000 views.
        </p>
        {rpm && (
          <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
            <div>
              <p className="text-2xl font-bold text-cf-orange">{rpm}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/50">
                per 1K views
              </p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-2xl font-bold">{budgetLeft}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/50">
                budget remaining
              </p>
            </div>
          </div>
        )}
        {!active && (
          <p className="mt-4 text-sm text-amber-400">
            The campaign is currently paused — you can still sign up and get
            your account approved for the next round.
          </p>
        )}
        <div className="mt-10">
          <Link
            href="/clippers/signup"
            className="inline-flex items-center justify-center rounded-full bg-cf-orange px-8 py-4 text-base font-semibold text-cf-black shadow-lg shadow-cf-orange/20 transition hover:brightness-110"
          >
            Start clipping
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Submit your account",
            body: "Sign up and drop your TikTok account link. We approve accounts by hand so the campaign stays quality.",
          },
          {
            step: "2",
            title: "Post & submit videos",
            body: "Post CourtFuel videos or slideshows from your approved account, then paste each link into your dashboard.",
          },
          {
            step: "3",
            title: "Views become money",
            body: "View counts refresh automatically. Your dashboard shows exactly what you've earned and what's been paid.",
          },
        ].map((s) => (
          <div
            key={s.step}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cf-orange text-sm font-bold text-cf-black">
              {s.step}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-relaxed text-white/65">
        <h3 className="text-base font-semibold text-white">The rules</h3>
        <p className="mt-2">
          Content must promote CourtFuel and follow the campaign brief. Views
          are counted from TikTok&apos;s public numbers when we refresh —
          botted or artificially inflated views get the video (and possibly
          the account) rejected. Earnings accrue only while campaign budget
          remains; when a budget round is used up, earning pauses until the
          next round. Payouts are sent manually — add your payment details in
          your dashboard.
        </p>
      </div>
    </div>
  );
}
