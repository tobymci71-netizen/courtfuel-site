import Link from "next/link";

// Locale-neutral App Store link — Apple redirects to the visitor's own
// storefront. Verified live: "CourtFuel - Basketball Fuel", id6772562071.
const APP_STORE_HREF = "https://apps.apple.com/app/id6772562071";

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      Court<span className="text-cf-orange">Fuel</span>
    </span>
  );
}

function CTAButton({
  children,
  href,
  className = "",
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-cf-orange px-7 py-3.5 text-base font-semibold text-cf-black shadow-[0_10px_40px_-10px_rgba(255,107,26,0.6)] transition hover:brightness-110 hover:shadow-[0_14px_50px_-10px_rgba(255,107,26,0.8)] active:scale-[0.98] ${className}`}
    >
      {children}
    </a>
  );
}

function GhostButton({
  children,
  href,
  className = "",
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:border-cf-orange/60 hover:bg-cf-orange/10 hover:text-white active:scale-[0.98] ${className}`}
    >
      {children}
    </Link>
  );
}

/* Stylized illustration of a meal scan — pure CSS, no screenshots. */
function ScanCard() {
  return (
    <div className="cf-float relative w-[290px] rounded-[2rem] border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:w-[320px]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">Meal scan</p>
        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
          GAME DAY
        </span>
      </div>
      <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-cf-black/60 text-6xl">
        🍗🍚🥦
      </div>
      <div className="mt-5 flex items-center gap-5">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="7"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#ff6b1a"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="213.6"
              strokeDashoffset="32"
            />
          </svg>
          <div className="text-center">
            <p className="text-2xl font-bold leading-none">85</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
              fuel
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-xs">
          {[
            ["Fast carbs", "w-4/5"],
            ["Recovery protein", "w-3/5"],
            ["4th-quarter fuel", "w-11/12"],
          ].map(([label, w]) => (
            <div key={label}>
              <p className="mb-1 text-white/60">{label}</p>
              <div className="h-1.5 rounded-full bg-white/10">
                <div className={`h-full rounded-full bg-cf-orange ${w}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main id="content">
      {/* ============ Hero ============ */}
      <section className="relative isolate overflow-hidden bg-cf-black">
        {/* glow + grid backdrop */}
        <div
          aria-hidden="true"
          className="cf-glow pointer-events-none absolute left-1/2 top-[-20%] -z-10 h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.28),rgba(255,107,26,0.07),transparent)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="cf-grid pointer-events-none absolute inset-0 -z-10"
        />

        <header className="sticky top-0 z-40 border-b border-white/5 bg-cf-black/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Wordmark className="text-2xl text-white" />
            <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
              <a href="#how" className="transition hover:text-white">
                How it works
              </a>
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#pricing" className="transition hover:text-white">
                Pricing
              </a>
              <a href="#faq" className="transition hover:text-white">
                FAQ
              </a>
              <Link
                href="/clippers"
                className="rounded-full border border-cf-orange/50 px-4 py-1.5 font-semibold text-cf-orange transition hover:bg-cf-orange hover:text-cf-black"
              >
                Become a clipper
              </Link>
            </nav>
            <Link
              href="/clippers"
              className="rounded-full border border-cf-orange/50 px-4 py-1.5 text-sm font-semibold text-cf-orange transition hover:bg-cf-orange hover:text-cf-black md:hidden"
            >
              Clippers
            </Link>
          </div>
        </header>

        <div className="mx-auto flex max-w-6xl flex-col items-center gap-14 px-6 pb-28 pt-16 md:pt-24 lg:flex-row lg:justify-between lg:gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <p className="cf-fade-up cf-chip">
              🏀 AI nutrition, built for hoopers
            </p>
            <h1 className="cf-fade-up cf-delay-1 mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl md:text-7xl">
              Eat like the player you{" "}
              <span className="cf-text-gradient">want to become.</span>
            </h1>
            <p className="cf-fade-up cf-delay-2 mx-auto mt-6 max-w-xl text-pretty text-lg text-white/70 sm:text-xl lg:mx-0">
              Scan any meal with your camera. Get a basketball-tuned score in
              seconds. Fuel your game — every quarter, every session.
            </p>
            <div className="cf-fade-up cf-delay-3 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <CTAButton href={APP_STORE_HREF}>
                 Download on the App Store
              </CTAButton>
              <GhostButton href="/clippers">Become a clipper →</GhostButton>
            </div>
            <p className="cf-fade-up cf-delay-4 mt-4 text-sm text-white/50">
              Free to download. iPhone, iOS 17 or later ·{" "}
              <span className="font-semibold text-white/70">
                Android coming soon
              </span>
            </p>
          </div>
          <div className="cf-fade-up cf-delay-2 relative">
            <div
              aria-hidden="true"
              className="absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.2),transparent)] blur-xl"
            />
            <ScanCard />
          </div>
        </div>
      </section>

      {/* ============ How it works ============ */}
      <section id="how" className="relative bg-cf-black px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-cf-orange">
            How it works
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Three steps to better fuel
          </h2>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                emoji: "📸",
                title: "Snap your meal",
                body: "Point your camera, capture, done.",
              },
              {
                n: "02",
                emoji: "🏀",
                title: "Get your fuel score",
                body: "AI analyzes the meal for basketball-specific demands and returns a 0–100 score.",
              },
              {
                n: "03",
                emoji: "📈",
                title: "Track your game",
                body: "Daily fuel score, hydration, your schedule and your logged games — all in one place.",
              },
            ].map((step) => (
              <div key={step.n} className="cf-card p-7">
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{step.emoji}</span>
                  <span className="text-sm font-bold text-white/25">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-white/60">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Features ============ */}
      <section
        id="features"
        className="relative isolate overflow-hidden bg-cf-black px-6 py-24 md:py-32"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-15%] top-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.12),transparent)] blur-2xl"
        />
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-cf-orange">
            Features
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for basketball
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-white/60">
            Generic nutrition apps weren&apos;t made for the demands of the
            game. CourtFuel is.
          </p>
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🎯",
                title: "Position-aware nutrition",
                body: "Plans tuned to PG / SG / SF / PF / C demands.",
              },
              {
                icon: "🔥",
                title: "Game-day fuel",
                body: "Built around how nutrition affects fourth-quarter energy.",
              },
              {
                icon: "♻️",
                title: "Back-to-back recovery",
                body: "Strategies for tournament weekends and double sessions.",
              },
              {
                icon: "📅",
                title: "Weekly meal plans",
                body: "Pro subscribers get a 7-day plan matched to their preferences, budget, and supermarkets.",
              },
              {
                icon: "🏋️",
                title: "Your training week",
                body: "Pro subscribers get an AI drill plan built for their position, with a body map showing what each drill trains.",
              },
              {
                icon: "🏀",
                title: "Built by a hooper, for hoopers",
                body: "Made for players who want to take their game seriously.",
              },
            ].map((f) => (
              <div key={f.title} className="cf-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cf-orange/30 bg-cf-orange/10 text-xl">
                  {f.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Pricing ============ */}
      <section id="pricing" className="bg-cf-black px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-cf-orange">
            Pricing
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Free for daily players. Pro for serious ones.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="cf-card p-8">
              <h3 className="text-xl font-semibold text-white">Free</h3>
              <p className="mt-2 text-white/60">Get started today.</p>
              <p className="mt-6 text-4xl font-bold tracking-tight text-white">
                $0
                <span className="text-base font-medium text-white/50">
                  {" "}
                  to start
                </span>
              </p>
              <ul className="mt-8 space-y-3 text-sm text-white/80">
                {[
                  "2 scans per day",
                  "Player card + archetype",
                  "Daily fuel + hydration tracking",
                  "No card required",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="text-cf-orange" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="relative rounded-[1.25rem] bg-gradient-to-b from-cf-orange/60 via-cf-orange/20 to-transparent p-px">
              <div className="relative h-full rounded-[calc(1.25rem-1px)] bg-[#141210] p-8">
                <span className="absolute -top-3 right-6 rounded-full bg-cf-orange px-3 py-1 text-xs font-bold uppercase tracking-wide text-cf-black shadow-lg shadow-cf-orange/30">
                  Pro
                </span>
                <h3 className="text-xl font-semibold text-white">Pro</h3>
                <p className="mt-2 text-white/60">
                  Everything you need to fuel the season.
                </p>
                <p className="mt-6 text-3xl font-bold tracking-tight text-white">
                  Monthly or yearly
                </p>
                <p className="mt-1 text-sm text-white/50">
                  Current pricing is shown in the App Store and in the app, in
                  your local currency, before you commit to anything.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-white/85">
                  {[
                    "Unlimited meal scans",
                    "Fuel My Week — a 7-day meal plan matched to your supermarkets, budget and cooking level",
                    "Full recipes, a checkable shopping list you can send to Reminders, and a weekly prep guide",
                    "Your training week — an AI drill plan built for your position",
                    "Drill tracking that feeds your rank",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="text-cf-orange" aria-hidden="true">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <CTAButton href={APP_STORE_HREF} className="w-full">
                    Download on the App Store
                  </CTAButton>
                  <p className="mt-3 text-center text-xs text-white/50">
                    Free to download. Pro is optional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="bg-cf-black px-6 pb-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-cf-orange">
            FAQ
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Questions, answered
          </h2>
          <div className="mt-12 space-y-3">
            {[
              {
                q: "Is CourtFuel only for basketball players?",
                a: "It's built for them. The AI is calibrated to basketball-specific demands, but anyone who plays high-intensity sports will get useful guidance.",
              },
              {
                q: "What does the AI actually do?",
                a: "It looks at your meal photo, identifies the food, and scores it against your player profile (position, level, goal) for things basketball players need — fast carbs, recovery protein, fourth-quarter endurance.",
              },
              {
                q: "Does it work for vegetarians/vegans?",
                a: "Yes. Fuel My Week is a Pro feature, and when you set it up you choose dietary requirements — vegetarian, vegan, halal, kosher, dairy free, gluten free or nut allergy — and the weekly plan is built around them.",
              },
              {
                q: "What happens to my data?",
                a: "Your scans, hydration and schedule live on your device, and a copy of your history is backed up to our database in the UK so a new phone doesn't mean starting over. Meal photos are sent to our AI provider only at the moment of analysis, and are never included in that backup. We don't sell data, run ads, or track you across the internet. See our Privacy Policy.",
              },
              {
                q: "How accurate are the scans?",
                a: "Good for common, clearly photographed dishes; less reliable for complex multi-component meals, unusual cuisines, or anything where portion size is hard to judge from a photo. Treat every score as guidance, not gospel — and not as medical or dietary advice.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Manage your subscription in iOS Settings → Apple ID → Subscriptions.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition open:border-cf-orange/40 open:bg-white/[0.05]"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-base font-semibold text-white">
                  <span>{item.q}</span>
                  <span
                    className="mt-0.5 text-cf-orange transition group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-white/65">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Clipper CTA band ============ */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-cf-orange/25 bg-gradient-to-br from-cf-orange/15 via-cf-black to-cf-black px-8 py-14 text-center md:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.25),transparent)] blur-2xl"
          />
          <p className="cf-chip">💸 Creator program</p>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get paid to post CourtFuel content
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Make TikToks and slideshows about CourtFuel from your own account.
            We track the views automatically and pay you for every 1,000
            views.
          </p>
          <div className="mt-8">
            <CTAButton href="/clippers">Become a clipper</CTAButton>
          </div>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section
        id="download"
        className="relative isolate overflow-hidden bg-cf-black px-6 py-24 text-center md:py-32"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 bottom-[-40%] -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.2),transparent)] blur-2xl"
        />
        <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Ready to <span className="cf-text-gradient">fuel up?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-white/70">
          Download CourtFuel and start scoring your meals today.
        </p>
        <div className="mt-9">
          <CTAButton href={APP_STORE_HREF}>
             Download on the App Store
          </CTAButton>
        </div>
        <p className="mt-4 text-sm text-white/50">
          🤖 Android coming soon
        </p>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t border-white/10 bg-cf-black px-6 py-12 text-sm text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <Wordmark className="text-lg text-white" />
          <nav className="-my-2 flex flex-wrap justify-center gap-x-6">
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center py-2 transition hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="inline-flex min-h-11 items-center py-2 transition hover:text-white"
            >
              Terms of Use
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-11 items-center py-2 transition hover:text-white"
            >
              Support
            </Link>
            <Link
              href="/clippers"
              className="inline-flex min-h-11 items-center py-2 font-semibold text-cf-orange transition hover:brightness-110"
            >
              Become a clipper
            </Link>
          </nav>
          <p className="text-center md:text-right">© 2026 CourtFuel</p>
        </div>
      </footer>
    </main>
  );
}
