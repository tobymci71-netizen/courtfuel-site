import Link from "next/link";
import { getSettings, fmtUsd } from "@/lib/clippers/engine";

export default async function ClippersLanding() {
  let rpmCents = 0;
  let budgetLeftCents = 0;
  let active = true;
  let haveStats = false;
  try {
    const s = await getSettings();
    rpmCents = Number(s.rpm_cents);
    budgetLeftCents = Math.max(
      0,
      Number(s.budget_cents) - Number(s.total_earned_cents),
    );
    active = s.campaign_active;
    haveStats = true;
  } catch {
    // Database not configured yet — show the page without live numbers.
  }

  // Live worked example at the current rate.
  const exampleViews = 25_000;
  const exampleEarn = Math.floor((exampleViews / 1000) * rpmCents);

  return (
    <div className="relative isolate overflow-hidden">
      {/* backdrop */}
      <div
        aria-hidden="true"
        className="cf-glow pointer-events-none absolute left-1/2 top-[-8%] -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.28),rgba(255,107,26,0.07),transparent)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="cf-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]"
      />

      {/* ============ Hero ============ */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="cf-fade-up cf-chip">💸 Creator program</p>
          <h1 className="cf-fade-up cf-delay-1 mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Post CourtFuel content.{" "}
            <span className="cf-text-gradient">Get paid per view.</span>
          </h1>
          <p className="cf-fade-up cf-delay-2 mx-auto mt-6 max-w-lg text-lg text-white/70">
            Make TikToks and slideshows promoting CourtFuel from your own
            account. We track the views automatically and pay you for every
            1,000 views.
          </p>

          {haveStats && (
            <div className="cf-fade-up cf-delay-3 mx-auto mt-10 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { value: fmtUsd(rpmCents), label: "per 1K views", hot: true },
                { value: fmtUsd(budgetLeftCents), label: "budget remaining" },
                {
                  value: active ? "LIVE" : "PAUSED",
                  label: "campaign status",
                  status: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="cf-card px-4 py-5 last:col-span-2 sm:last:col-span-1"
                >
                  <p
                    className={`text-2xl font-bold ${
                      s.status
                        ? active
                          ? "text-emerald-400"
                          : "text-amber-400"
                        : s.hot
                          ? "text-cf-orange"
                          : "text-white"
                    }`}
                  >
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-white/50">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}
          {!active && (
            <p className="cf-fade-up cf-delay-3 mt-4 text-sm text-amber-400">
              Paused right now — sign up anyway and get your account approved
              for the next round.
            </p>
          )}

          <div className="cf-fade-up cf-delay-4 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/clippers/signup"
              className="inline-flex items-center justify-center rounded-full bg-cf-orange px-8 py-4 text-base font-semibold text-cf-black shadow-[0_10px_40px_-10px_rgba(255,107,26,0.7)] transition hover:brightness-110 hover:shadow-[0_14px_50px_-10px_rgba(255,107,26,0.9)] active:scale-[0.98]"
            >
              Start clipping
            </Link>
            <Link
              href="/clippers/login"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:border-cf-orange/60 hover:bg-cf-orange/10 active:scale-[0.98]"
            >
              I have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ============ Marquee ============ */}
      <div
        className="relative -mx-6 overflow-hidden border-y border-white/5 py-4"
        aria-hidden="true"
      >
        <div className="cf-marquee-track text-xs font-bold uppercase tracking-[0.3em] text-white/25">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0 items-center">
              {[
                "Post from your account",
                "Views tracked automatically",
                "Paid per 1K views",
                "Slideshows count too",
              ].map((t) => (
                <span key={t} className="flex items-center">
                  <span className="px-6">{t}</span>
                  <span className="text-cf-orange">💸</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ============ Steps ============ */}
      <section className="py-20">
        <h2
          data-reveal
          className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
        >
          How it works
        </h2>
        <div className="relative mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-9 hidden h-px bg-gradient-to-r from-transparent via-cf-orange/50 to-transparent sm:block"
          />
          {[
            {
              step: "01",
              title: "Submit your account",
              body: "Sign up and drop your TikTok account link. We approve accounts by hand so the campaign stays quality.",
            },
            {
              step: "02",
              title: "Post & submit videos",
              body: "Post CourtFuel videos or slideshows from your approved account, then paste each link into your dashboard.",
            },
            {
              step: "03",
              title: "Views become money",
              body: "View counts refresh automatically. Your dashboard shows exactly what you've earned and what's been paid.",
            },
          ].map((s, i) => (
            <div
              key={s.step}
              data-reveal
              style={{ "--reveal-delay": `${i * 0.12}s` } as React.CSSProperties}
              className="cf-card cf-shine relative p-6"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1 text-[4.5rem] font-black leading-none text-white/[0.04]"
              >
                {s.step}
              </span>
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cf-orange text-sm font-bold text-cf-black shadow-[0_0_24px_-4px_rgba(255,107,26,0.7)]">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Worked example ============ */}
      {haveStats && rpmCents > 0 && (
        <section className="pb-20">
          <div
            data-reveal="scale"
            className="cf-shine relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-cf-orange/25 bg-gradient-to-br from-cf-orange/15 via-cf-black to-cf-black px-8 py-12 text-center"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-48 w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.25),transparent)] blur-2xl"
            />
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cf-orange">
              The maths
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-2xl font-bold sm:text-3xl">
              <span>{exampleViews.toLocaleString("en-US")} views</span>
              <span className="text-white/40">×</span>
              <span>{fmtUsd(rpmCents)} per 1K</span>
              <span className="text-white/40">=</span>
              <span className="rounded-2xl bg-cf-orange px-5 py-2 text-cf-black shadow-[0_10px_40px_-10px_rgba(255,107,26,0.8)]">
                {fmtUsd(exampleEarn)}
              </span>
            </div>
            <p className="mt-5 text-sm text-white/60">
              At today&apos;s rate. One decent slideshow can do this — earnings
              accrue while campaign budget remains.
            </p>
          </div>
        </section>
      )}

      {/* ============ Rules ============ */}
      <section className="pb-24">
        <h2
          data-reveal
          className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
        >
          The rules
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
          {[
            {
              icon: "🎬",
              title: "On-brief content",
              body: "Content must promote CourtFuel and follow the campaign brief.",
            },
            {
              icon: "🤖",
              title: "Real views only",
              body: "Views are counted from TikTok's public numbers when we refresh. Botted or artificially inflated views get the video — and possibly the account — rejected.",
            },
            {
              icon: "⏳",
              title: "Budget rounds",
              body: "Earnings accrue only while campaign budget remains. When a round is used up, earning pauses until the next one.",
            },
            {
              icon: "💳",
              title: "Manual payouts",
              body: "Payouts are sent manually — add your payment details in your dashboard so we know where to send it.",
            },
          ].map((r, i) => (
            <div
              key={r.title}
              data-reveal
              style={{ "--reveal-delay": `${(i % 2) * 0.12}s` } as React.CSSProperties}
              className="cf-card p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cf-orange/30 bg-cf-orange/10 text-xl">
                {r.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section className="relative isolate overflow-hidden pb-28 pt-8 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <span className="cf-ring h-[280px] w-[280px]" />
          <span className="cf-ring h-[280px] w-[280px]" style={{ animationDelay: "1.3s" }} />
          <span className="cf-ring h-[280px] w-[280px]" style={{ animationDelay: "2.6s" }} />
        </div>
        <h2 data-reveal className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to <span className="cf-text-gradient">get paid?</span>
        </h2>
        <div data-reveal className="mt-8">
          <Link
            href="/clippers/signup"
            className="inline-flex items-center justify-center rounded-full bg-cf-orange px-9 py-4 text-base font-semibold text-cf-black shadow-[0_10px_40px_-10px_rgba(255,107,26,0.7)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Start clipping
          </Link>
        </div>
      </section>

      {/* Scroll-reveal driver */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
var els=document.querySelectorAll('[data-reveal]');
if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('is-in')});return}
var io=new IntersectionObserver(function(entries){
entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('is-in');io.unobserve(en.target)}})
},{threshold:0.12,rootMargin:'0px 0px -48px 0px'});
els.forEach(function(e){io.observe(e)});
})();`,
        }}
      />
    </div>
  );
}
