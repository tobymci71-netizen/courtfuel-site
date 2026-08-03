import type { Metadata } from "next";
import Link from "next/link";
import RevealDriver from "@/components/RevealDriver";
import { getSettings, fmtUsd } from "@/lib/clippers/engine";

export const metadata: Metadata = {
  title: "CourtFuel Creator Program — the full guide",
  description:
    "The deal, account setup, content format, rules and approval guidelines for CourtFuel clippers.",
};

function SectionTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2
      data-reveal
      className="flex items-baseline gap-3 text-2xl font-bold tracking-tight text-white sm:text-3xl"
    >
      <span className="text-base font-black text-cf-orange">{n}</span>
      {children}
    </h2>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-reveal className={`cf-card p-6 ${className}`}>
      {children}
    </div>
  );
}

export default async function RulesPage() {
  let rpm = "";
  try {
    const s = await getSettings();
    rpm = fmtUsd(Number(s.rpm_cents));
  } catch {
    // DB not reachable — show the guide without the live rate.
  }

  return (
    <div className="relative isolate mx-auto max-w-3xl py-12">
      <div
        aria-hidden="true"
        className="cf-glow pointer-events-none absolute left-1/2 top-[-4%] -z-10 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,0.22),transparent)] blur-2xl"
      />

      <header className="text-center">
        <p className="cf-fade-up cf-chip">📖 The full guide</p>
        <h1 className="cf-fade-up cf-delay-1 mt-6 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          CourtFuel <span className="cf-text-gradient">Creator Program</span>
        </h1>
        <p className="cf-fade-up cf-delay-2 mx-auto mt-5 max-w-xl text-lg text-white/70">
          This is your everything-page: the deal, how to set up, the content
          format, and the rules. Read it top to bottom — it&apos;s the
          difference between a post that flops and a post that pays.
        </p>
      </header>

      <div className="mt-16 space-y-16">
        {/* 1 */}
        <section className="space-y-5">
          <SectionTitle n="1.">What CourtFuel is</SectionTitle>
          <p data-reveal className="leading-relaxed text-white/70">
            CourtFuel is the AI nutrition app for basketball players. You scan
            any meal with your camera and it scores it 0–100 for what hoopers
            actually need — fast carbs, recovery protein, fourth-quarter
            energy. It tracks daily fuel and hydration, builds weekly meal
            plans, gives Pro players an AI drill plan for their position, and
            ranks their player card. It&apos;s live on the App Store and the
            content format is blowing up on TikTok as faceless slideshows.
          </p>
          <p data-reveal className="leading-relaxed text-white/70">
            This is the onboarding for the TikTok slideshow campaign. You
            don&apos;t need followers. You don&apos;t need to show your face.
            You need to follow the format and post consistently.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-5">
          <SectionTitle n="2.">The deal</SectionTitle>
          <Card>
            <h3 className="font-semibold text-white">What you&apos;ll do</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
              <li>• Create a brand-new TikTok account in the basketball niche</li>
              <li>• Warm it up for 1–2 days before your first post</li>
              <li>
                • Post daily — start at 1–2×/day while the account is new, then
                ramp to 3× once it&apos;s warmed and trusted — using the
                CourtFuel stats-card format
              </li>
              <li>• Engage with your comments and softly plug CourtFuel</li>
            </ul>
          </Card>
          <Card className="border-cf-orange/30">
            <h3 className="font-semibold text-white">Payment</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
              <li>
                • Payout:{" "}
                <span className="font-bold text-cf-orange">
                  {rpm ? `${rpm} per 1,000 views` : "paid per 1,000 views at the live rate on the clippers page"}
                </span>
              </li>
              <li>
                • Views are tracked automatically from your dashboard — no
                screenshots, no arguing
              </li>
              <li>
                • Earnings accrue while the campaign budget round lasts; when a
                round is used up, earning pauses until the next one opens
              </li>
              <li>
                • Payouts are sent manually — add your payment details in your
                dashboard
              </li>
            </ul>
            <p className="mt-4 text-sm text-white/50">
              The accounts that win are the ones that post every single day and
              warm up properly.
            </p>
          </Card>
        </section>

        {/* 3 */}
        <section className="space-y-5">
          <SectionTitle n="3.">Who you&apos;re talking to</SectionTitle>
          <p data-reveal className="leading-relaxed text-white/70">
            You&apos;re posting at a specific person. Warm your account up to
            reach them.
          </p>
          <Card>
            <p className="text-sm leading-relaxed text-white/70">
              <span className="font-semibold text-white">Ideal viewer:</span>{" "}
              13–25 year-old hoopers and basketball-obsessed fans (plus
              basketball parents) — high school, AAU, rec-league, college and
              semi-pro players who love the grind: training, stats, being
              doubted, proving people wrong.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              <span className="font-semibold text-white">
                Tier-1 countries (pick ONE and warm up to it):
              </span>
              <br />
              Top priority: <span className="text-white">United States</span>
              <br />
              Also strong (big basketball culture + App Store spend): Canada,
              Australia, France, Germany, Spain
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Match your content&apos;s language and references to your chosen
              country (US → &quot;#1 in the state&quot;, varsity, AAU, March
              Madness; Canada → prep leagues, OUA; France → espoirs, Pro B
              youth).
            </p>
          </Card>
        </section>

        {/* 4 */}
        <section className="space-y-5">
          <SectionTitle n="4.">Account setup &amp; warm-up</SectionTitle>
          <Card>
            <h3 className="font-semibold text-white">
              Username / display name — keep it human
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Your handle doesn&apos;t need to be basketball-related. A normal,
              personal-sounding name reads like a real young hooper&apos;s
              account, not a spam page. The basketball signal comes from your
              profile pic + content + warm-up, not your name.
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
              <li>
                • <span className="text-white">Username:</span> a normal,
                name-style handle — e.g. jaydenmoore_, tyler.jb, marcus_23. Avoid
                brand/bot names (besthoopclips247).
              </li>
              <li>
                • <span className="text-white">Display name:</span> a real
                first name, optionally a position or one emoji — Jayden, Tyler
                🏀, Marcus · PG.
              </li>
              <li>
                • <span className="text-white">Profile picture:</span> a clean,
                moody basketball image (court under lights, kicks, silhouette,
                empty gym). Not the CourtFuel logo.
              </li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold text-white">Bio setup</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Short and human — like a real 17-year-old who loves hooping, not
              a marketer.
            </p>
            <div className="mt-3 rounded-xl border border-white/10 bg-cf-black/60 p-4 text-sm text-white/80">
              documenting my season
              <br />
              just a hooper
              <br />
              PG • chasing it
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Then add the CTA — two short lines, a vibe line then a soft plug:
            </p>
            <div className="mt-3 rounded-xl border border-cf-orange/25 bg-cf-black/60 p-4 text-sm text-white/80">
              tracking every meal &amp; game
              <br />
              the app I use is <span className="text-cf-orange">CourtFuel</span>
            </div>
            <p className="mt-4 text-sm text-white/50">
              Bio rules: phrase the CTA like a fan, not an ad. One CTA only. No
              hashtags in the bio. Keep name/pic/bio consistent once set.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-white">
              Warm up (30 min/day for 1–2 days BEFORE your first post)
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
              <li>
                • Train your For You Page to your Tier-1 country — search &amp;
                watch: basketball, high school basketball, AAU highlights,
                basketball training, hooper edits, streetball.
              </li>
              <li>
                • Engage like a human: scroll, like, save, comment naturally.
                ~5% like rate — don&apos;t like every video. Follow 1–2
                relevant micro-accounts (5K–150K) per day. Repost 1–2
                basketball posts per day.
              </li>
              <li>
                • Keep warming up even after you start posting — 5 min of
                scrolling before every post.
              </li>
            </ul>
          </Card>
        </section>

        {/* 5 */}
        <section className="space-y-5">
          <SectionTitle n="5.">
            The content — the CourtFuel stats card
          </SectionTitle>
          <Card>
            <p className="text-sm leading-relaxed text-white/70">
              <span className="font-semibold text-white">
                Slide 1 — the hook.
              </span>{" "}
              A short, emotional, first-person line on a clean dark background
              (white text, one orange accent word) — or a fake-text
              conversation that sets up the story. It reads like a confession,
              not an ad. This stops the scroll.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              <span className="font-semibold text-white">
                Slide 2 — the payoff.
              </span>{" "}
              A dominant basketball photo with the CourtFuel stats card
              overlaid: a ranking hook (&quot;#1 in the state&quot;), season
              stats and rating in dark/orange branding.
            </p>
            <p className="mt-4 text-sm text-white/50">
              You&apos;re not restricted to two slides — extend to 3 or 4 and
              do similar formats. Any style works as long as it uses the
              CourtFuel card in a positive way at the end.
            </p>
          </Card>
          <Card className="border-amber-400/30">
            <h3 className="font-semibold text-amber-400">
              The face rule (MANDATORY)
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Never post a recognizable face that isn&apos;t yours. If a
              sourced photo (Pinterest, Google, anywhere) shows an identifiable
              person who isn&apos;t you, you must alter that person with an AI
              image tool before posting — and make sure it doesn&apos;t look
              AI.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              How: upload the photo → tell it e.g. &quot;keep this image and
              everything exactly the same — same pose, background, lighting —
              but change the player: different hair, different skin tone,
              change the jersey color.&quot; Skip only when it&apos;s your own
              photo, no identifiable face is shown, or the image is fully
              AI-generated. Un-altered real faces = rejected.
            </p>
          </Card>
        </section>

        {/* 6 */}
        <section className="space-y-5">
          <SectionTitle n="6.">Content creation flow</SectionTitle>
          <Card>
            <ol className="space-y-3 text-sm leading-relaxed text-white/70">
              <li>
                <span className="font-bold text-cf-orange">1.</span> Get an
                idea for the post.
              </li>
              <li>
                <span className="font-bold text-cf-orange">2.</span> Grab the
                images you need from Pinterest. Searches like &quot;high school
                basketball photography&quot;, &quot;AAU basketball pics&quot;
                or &quot;streetball photography&quot; get really good,
                high-quality photos.
              </li>
              <li>
                <span className="font-bold text-cf-orange">3.</span> Any
                person&apos;s face showing directly — swap it with an AI model
                (see the face rule above).
              </li>
              <li>
                <span className="font-bold text-cf-orange">4.</span> Use Canva
                to lay out the images, add effects (vignette, lowered
                saturation) for mood, then add your text and the CourtFuel
                stats card. Canva&apos;s &quot;Magic Grab&quot; lets you pull a
                player forward and place the card behind them.
              </li>
              <li>
                <span className="font-bold text-cf-orange">5.</span> Export
                your slides.
              </li>
              <li>
                <span className="font-bold text-cf-orange">6.</span> Post to
                TikTok with an audio that matches the vibe (TikTok usually
                suggests good options), write your caption, add #basketball
                #hooper, and post.
              </li>
              <li>
                <span className="font-bold text-cf-orange">7.</span> Paste the
                post link into your{" "}
                <Link
                  href="/clippers/dashboard"
                  className="text-cf-orange hover:underline"
                >
                  dashboard
                </Link>{" "}
                so views start counting.
              </li>
            </ol>
          </Card>
        </section>

        {/* 7 */}
        <section className="space-y-5">
          <SectionTitle n="7.">Approval guidelines</SectionTitle>
          <Card>
            <p className="text-sm leading-relaxed text-white/70">
              Posts are reviewed on proper CourtFuel integration, not views
              alone.
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
              <li>
                • <span className="text-white">Avoid these 3:</span> stats card
                too small or cut off · CourtFuel shown only briefly or only at
                the very end · weak hook slide (not emotional / not
                basketball).
              </li>
              <li>
                • Views must be real — botted or artificially inflated views
                get the video rejected and can get the account banned from the
                campaign.
              </li>
              <li>
                • Once a post passes ~8K views, pin 1–2 comments mentioning
                CourtFuel.
              </li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              <span className="font-semibold text-red-400">
                Prohibited themes:
              </span>{" "}
              graphic injury, hospital, gambling, violence · under-13s as the
              subject · offensive/hateful content · fake claims about real
              named players or teams.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              <span className="font-semibold text-red-400">Bannable:</span>{" "}
              faking analytics · ghosting the team · spamming formats/comments
              · promoting competitors · botting · stealing content 1:1.
            </p>
          </Card>
        </section>

        {/* 8 */}
        <section className="space-y-5">
          <SectionTitle n="8.">
            Account management — do&apos;s &amp; don&apos;ts
          </SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <h3 className="font-semibold text-emerald-400">Do</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
                <li>• Reply to comments to boost engagement</li>
                <li>• Keep warming up — 5 min before every post</li>
                <li>
                  • Filter comments: TikTok → Settings → Privacy → Comments →
                  filter keywords → add &quot;Fake&quot; and &quot;AI&quot;
                </li>
              </ul>
            </Card>
            <Card>
              <h3 className="font-semibold text-red-400">Don&apos;t</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
                <li>• Repost the same content</li>
                <li>• Delete &amp; re-upload repeatedly</li>
                <li>• Spam-post — each is a flagging risk on new accounts</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-4 text-center">
          <p data-reveal className="text-lg font-semibold text-white">
            Post daily, follow the format,{" "}
            <span className="cf-text-gradient">get paid.</span>
          </p>
          <div data-reveal className="mt-6">
            <Link
              href="/clippers/signup"
              className="inline-flex items-center justify-center rounded-full bg-cf-orange px-8 py-4 text-base font-semibold text-cf-black shadow-[0_10px_40px_-10px_rgba(255,107,26,0.7)] transition hover:brightness-110 active:scale-[0.98]"
            >
              Start clipping
            </Link>
          </div>
        </section>
      </div>
      <RevealDriver />
    </div>
  );
}
