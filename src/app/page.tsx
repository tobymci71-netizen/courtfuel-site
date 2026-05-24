import Link from "next/link";

// TODO: replace #testflight anchor with the real TestFlight public link
const TESTFLIGHT_HREF = "#testflight";

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
      className={`inline-flex items-center justify-center rounded-full bg-cf-orange px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-cf-orange/20 transition hover:brightness-110 active:scale-[0.98] ${className}`}
    >
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col bg-cf-black">
        <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
          <Wordmark className="text-2xl text-white" />
          <nav className="hidden gap-7 text-sm text-white/70 md:flex">
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
          </nav>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-24 pt-10 md:pt-0">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
              Eat like the player you want to become.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-white/70 sm:text-xl">
              AI-powered nutrition built for basketball players. Scan any meal,
              get a score, fuel your game.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <CTAButton href={TESTFLIGHT_HREF}>Join the beta</CTAButton>
              <p className="text-sm text-white/50">
                Coming soon to the App Store. Currently in private beta on
                TestFlight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="bg-cf-offwhite px-6 py-24 text-cf-black md:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              {
                emoji: "📸",
                title: "Snap your meal",
                body: "Point your camera, capture, done.",
              },
              {
                emoji: "🏀",
                title: "Get your fuel score",
                body: "AI analyzes the meal for basketball-specific demands and returns a 0–100 score.",
              },
              {
                emoji: "📈",
                title: "Track your game",
                body: "Daily fuel, hydration, recovery — all in one place.",
              },
            ].map((step) => (
              <div key={step.title} className="text-center md:text-left">
                <div className="text-4xl">{step.emoji}</div>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-cf-black/70">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for basketball */}
      <section
        id="features"
        className="bg-cf-black px-6 py-24 text-white md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Built for basketball
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-white/60">
            Generic nutrition apps weren&apos;t made for the demands of the
            game. CourtFuel is.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                icon: "🔄",
                title: "Smart swap recommendations",
                body: "Real-time suggestions to hit your macro targets.",
              },
              {
                icon: "🇬🇬",
                title: "Built by a hooper, for hoopers",
                body: "Made in Guernsey by a basketball player.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cf-orange/50 hover:bg-white/[0.05]"
              >
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="bg-cf-offwhite px-6 py-24 text-cf-black md:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Pricing
          </h2>
          <p className="mt-4 text-center text-cf-black/60">
            Free forever for daily players. Pro for serious ones.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-3xl border border-cf-black/10 bg-white p-8">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="mt-2 text-cf-black/60">Get started today.</p>
              <p className="mt-6 text-4xl font-bold tracking-tight">
                $0
                <span className="text-base font-medium text-cf-black/50">
                  {" "}
                  / forever
                </span>
              </p>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "2 scans per day",
                  "Player card + archetype",
                  "Daily fuel + hydration tracking",
                  "Free forever",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-cf-orange">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="relative rounded-3xl border-2 border-cf-orange bg-white p-8 shadow-xl shadow-cf-orange/10">
              <span className="absolute -top-3 right-6 rounded-full bg-cf-orange px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Pro
              </span>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="mt-2 text-cf-black/60">
                Everything you need to fuel the season.
              </p>
              <p className="mt-6 text-4xl font-bold tracking-tight">
                $3.99
                <span className="text-base font-medium text-cf-black/50">
                  {" "}
                  / month
                </span>
              </p>
              <p className="mt-1 text-sm text-cf-black/50">or $24.99 / year</p>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Unlimited scans",
                  "Weekly meal plans",
                  "Smart swap recommendations",
                  "Game-day readiness",
                  "Weekly fuel reports",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-cf-orange">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <CTAButton href={TESTFLIGHT_HREF} className="w-full">
                  Join the beta
                </CTAButton>
                <p className="mt-3 text-center text-xs text-cf-black/50">
                  Free for beta testers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-cf-offwhite px-6 pb-32 text-cf-black">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            FAQ
          </h2>
          <div className="mt-12 divide-y divide-cf-black/10 border-y border-cf-black/10">
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
                a: "Yes. During Fuel onboarding you set dietary requirements and the AI works around them.",
              },
              {
                q: "Is my data private?",
                a: "Yes. Everything lives on your device. We don't sell data, run ads, or track you across the internet. See our Privacy Policy.",
              },
              {
                q: "How accurate are the scans?",
                a: "Highly accurate for common dishes; sometimes off for complex multi-component meals or unusual cuisines. Treat scores as guidance, not gospel.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Manage your subscription in iOS Settings → Apple ID → Subscriptions.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-base font-semibold">
                  <span>{item.q}</span>
                  <span className="text-cf-orange transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-cf-black/70 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA / TestFlight anchor */}
      <section
        id="testflight"
        className="bg-cf-black px-6 py-24 text-center md:py-32"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to fuel up?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/70">
          Join the private TestFlight beta and start scoring your meals today.
        </p>
        <div className="mt-8">
          {/* TODO: swap href for the real TestFlight public link once available */}
          <CTAButton href={TESTFLIGHT_HREF}>Join the beta</CTAButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-cf-black px-6 py-10 text-sm text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <Wordmark className="text-lg text-white" />
          <nav className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy" className="transition hover:text-cf-orange">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-cf-orange">
              Terms of Use
            </Link>
            <Link href="/support" className="transition hover:text-cf-orange">
              Support
            </Link>
          </nav>
          <p className="text-center md:text-right">
            Made in Guernsey 🇬🇬 · © 2026
          </p>
        </div>
      </footer>
    </>
  );
}
