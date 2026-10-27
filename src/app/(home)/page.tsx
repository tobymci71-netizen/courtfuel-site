import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Link from "next/link";
import { preload } from "react-dom";
import HomeClient from "@/components/home/HomeClient";
import { APP_STORE_HREF } from "@/components/home/app-store";
import "./home.css";

/*
  CONCEPT A · "Train like your position" (approved by Toby, 27 Oct 2026)
  Training leads. Real 1.5 UI, upright, big. Warm hardwood + cream + teal,
  with orange kept for the App Store button alone so it is the one thing
  on the page that reads as "press me".
  Ported from CourtFuel-design-archive/2026-10-27-site/concepts/
  a-train-like-your-position. Copy is the concept's, word for word.
  App Store link: plain same-window https anchor (no target, no redirect).
  data-ct carries the planned campaign token per placement (needs Toby's
  provider token from App Store Connect before it can go in the URL).
*/

// The app's two type voices (see .print and .set in home.css) are Archivo at
// width 62 and 125, so the wdth axis is loaded alongside weight (next/font
// only takes extra axes with the full weight range). Self-hosted: no request
// to Google from the visitor's browser. Inter comes from the root layout.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

// next/font puts a size-matched Arial ("Archivo Fallback") straight after
// Archivo in --font-archivo, and Turbopack ignores adjustFontFallback: false.
// Arial has no condensed face, so until Archivo arrives the PRINT headline
// would set wide and wrap to three lines. home.css gets the real face alone
// as --font-archivo-face and falls through to the concept's narrow fallbacks
// (Arial Narrow, then Helvetica Neue's condensed cuts on iPhone) instead.
const ARCHIVO_FACE = archivo.style.fontFamily.split(",")[0].trim();

const TITLE = "CourtFuel — Train like your position";
const DESCRIPTION =
  "Position-specific drills every week, built round your game. CourtFuel for iPhone.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Set here so the layout's nutrition-era Open Graph text doesn't reach the
  // link preview. The image comes from opengraph-image.tsx.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  // Smart App Banner: shows in Safari only, never inside Instagram's in-app
  // browser. Harmless, never the main path.
  itunes: { appId: "6772562071" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The footer, sticky bar and Instagram hint pad for the safe areas.
  viewportFit: "cover",
  themeColor: "#24160d",
};

const HERO_SRCSET = "/home/train-plan.jpg 660w, /home/train-plan-990.jpg 990w";
const HERO_SIZES = "(min-width: 960px) 346px, (min-width: 720px) 316px, 74vw";

function crop(f: string) {
  return { "--f": f } as CSSProperties;
}

function CtaArrow() {
  return (
    <svg className="cta__arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Our own install button, not Apple's badge: app icon + action + "on the App Store" in plain text. */
function InstallButton({
  ct,
  className = "cta",
  id,
}: {
  ct: string;
  className?: string;
  id?: string;
}) {
  return (
    <a className={className} href={APP_STORE_HREF} data-ct={ct} id={id}>
      <img className="cta__icon" src="/home/app-icon.png" alt="" width={40} height={40} />
      <span className="cta__text">
        <span className="cta__label">Build your training week</span>
        <span className="cta__sub">Get CourtFuel on the App Store</span>
      </span>
      <CtaArrow />
    </a>
  );
}

export default function Home() {
  // The hero screenshot is the LCP: fetch it ahead of the CSS, as the concept's <link rel=preload> did.
  preload("/home/train-plan.jpg", {
    as: "image",
    imageSrcSet: HERO_SRCSET,
    imageSizes: HERO_SIZES,
    fetchPriority: "high",
  });

  return (
    <div
      className={`cf-home ${archivo.variable}`}
      style={{ "--font-archivo-face": ARCHIVO_FACE } as CSSProperties}
    >
      {/* ============ HERO ============ */}
      <header className="hero" id="top">
        <div className="wrap topbar">
          <a className="brand" href="#top" aria-label="CourtFuel home">
            <img src="/home/app-icon.png" alt="" width={30} height={30} />
            <span>CourtFuel</span>
          </a>
          <nav className="nav" aria-label="Sections">
            <a href="#training">Training</a>
            <a href="#ranks">Ranks</a>
            <a href="#fuel">Fuel</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <Link className="clip-link" href="/clippers">
            Clippers
          </Link>
        </div>

        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="set eyebrow">This week&apos;s training</p>
            <h1 className="print hero__h1">
              <span>Train like</span> <span>your position.</span>
            </h1>
            <p className="hero__sub">Position-specific drills every week, built round your game.</p>

            <InstallButton ct="ig-hero" className="cta cta--hero" id="hero-cta" />
            <p className="micro">
              <span>
                Free to download. <span className="nw">CourtFuel&nbsp;Pro unlocks the app.</span>
              </span>
              <br />
              iPhone, iOS 17 or later
            </p>
          </div>

          <figure className="hero__phone">
            <div className="phone phone--hero">
              <img
                src="/home/train-plan.jpg"
                srcSet={HERO_SRCSET}
                sizes={HERO_SIZES}
                width={660}
                height={1434}
                fetchPriority="high"
                decoding="async"
                alt="The CourtFuel Train tab: This week's training, Shooting Guard, Shooting and shot creation. Day 1, Ball handling and finishing, 60 minutes. A body map with core and arms lit, then drills: Two-ball dribbling 4 x 30s, Mikan layups 3 x 10 each hand."
              />
            </div>
          </figure>
        </div>
      </header>

      <main id="content">
        {/* ============ 1 · TRAINING: THE PLAN ============ */}
        <section className="sec sec--cream" id="training">
          <div className="wrap">
            <div className="sec__head">
              <p className="set eyebrow eyebrow--teal">Your training week</p>
              <h2 className="print h2">Train for your position</h2>
              <p className="lede">
                A weekly plan of position-specific drills, with a body map showing what each one builds.
              </p>
            </div>

            <div className="plan-grid">
              <div className="positions reveal">
                <ul className="pos-list">
                  <li>
                    <span className="pos-tag print">PG</span>
                    <span>
                      <b>Point Guard</b>
                      <i>Handling, playmaking &amp; pace</i>
                    </span>
                  </li>
                  <li>
                    <span className="pos-tag print">SG</span>
                    <span>
                      <b>Shooting Guard</b>
                      <i>Shooting &amp; shot creation</i>
                    </span>
                  </li>
                  <li>
                    <span className="pos-tag print">SF</span>
                    <span>
                      <b>Small Forward</b>
                      <i>Two-way wing versatility</i>
                    </span>
                  </li>
                  <li>
                    <span className="pos-tag print">PF</span>
                    <span>
                      <b>Power Forward</b>
                      <i>Finishing, footwork &amp; strength</i>
                    </span>
                  </li>
                  <li>
                    <span className="pos-tag print">C</span>
                    <span>
                      <b>Center</b>
                      <i>Rim finishing, footwork &amp; rebounding</i>
                    </span>
                  </li>
                </ul>
                <p className="pos-note">Everything we build for you is tuned to this.</p>
              </div>

              <article className="step reveal">
                <p className="step__n print">01</p>
                <h3 className="print h3">Build your training week</h3>
                <p className="step__body">
                  A weekly plan of position-specific drills, tuned to your level and goal. Takes a couple of minutes to build.
                </p>
                <div className="crop" style={crop(".886")}>
                  <div className="phone">
                    <img
                      src="/home/train-cover.jpg"
                      width={660}
                      height={1434}
                      loading="lazy"
                      decoding="async"
                      alt="The Train tab cover: a Shooting Guard court card over a Day 1 card, Build your training week, and the Generate my week button."
                    />
                  </div>
                </div>
              </article>

              <article className="step reveal">
                <p className="step__n print">02</p>
                <h3 className="print h3">This week&apos;s training</h3>
                <p className="step__body">
                  3 to 5 sessions a week, 3 to 5 drills each, every session timed in minutes.
                </p>
                <div className="crop" style={crop(".715")}>
                  <div className="phone">
                    <img
                      src="/home/train-deal.jpg"
                      width={660}
                      height={1434}
                      loading="lazy"
                      decoding="async"
                      alt="The week being dealt: a Day 4 card, 60 minutes, Strength and mobility, with legs lit on the body map, and Days 1 to 3 in the rack."
                    />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ 2 · TRAINING: THE DRILLS ============ */}
        <section className="sec sec--wood" id="drills">
          <div className="wrap drills">
            <div className="drills__copy">
              <p className="set eyebrow eyebrow--teal">The drills</p>
              <h2 className="print h2">Every drill, spelled out.</h2>
              <p className="lede">
                An AI drill plan built for your position and level, with a body map showing what each drill trains. Log the work and it feeds your rank.
              </p>

              <dl className="facts">
                {/* All three values are drill 1 (Two-ball dribbling), the drill lit orange in the close-up. */}
                <div className="fact reveal">
                  <dt className="set">Sets &amp; reps</dt>
                  <dd>4 x 30s</dd>
                </div>
                <div className="fact reveal">
                  <dt className="set">Coaching cue</dt>
                  <dd>Fingertips</dd>
                </div>
                <div className="fact reveal">
                  <dt className="set">What it builds</dt>
                  <dd>Ball control</dd>
                </div>
                <div className="fact reveal">
                  <dt className="set">Tick it off</dt>
                  <dd>Earns XP toward your rank</dd>
                </div>
              </dl>
            </div>

            <figure className="zoom reveal">
              <div className="zoom__frame">
                <img
                  src="/home/train-plan.jpg"
                  srcSet={HERO_SRCSET}
                  sizes="(min-width: 720px) 490px, 100vw"
                  width={660}
                  height={1434}
                  loading="lazy"
                  decoding="async"
                  alt="Close-up of a training day: Ball handling and finishing, 60 minutes, 0 of 3. A halftone body map with arms and core lit, Core and Arms, Ball control. Drill 1, Two-ball dribbling, 4 x 30s, cue Fingertips. Drill 2, Mikan layups, 3 x 10 each hand, cue Soft off the glass."
                />
              </div>
              <figcaption>Straight from the Train tab.</figcaption>
            </figure>
          </div>
        </section>

        {/* ============ 3 · TRAINING: THE RANKS ============ */}
        <section className="sec sec--sand" id="ranks">
          <div className="wrap ranks">
            <div className="ranks__copy">
              <p className="set eyebrow eyebrow--gold">Earn your rank</p>
              <h2 className="print h2">Climb the ranks.</h2>
              <p className="lede">
                Earn XP from completed drills, meal scans and logged games, and climb eight tiers from Rookie to Apex.
              </p>
              <p className="lede lede--small">Each rank-up re-mints your player card in the new tier&apos;s metal.</p>

              <ol className="ladder reveal" aria-label="The eight ranks">
                <li>
                  <img src="/home/rank-rookie.png" alt="" width={56} height={56} loading="lazy" />
                  <b>Rookie</b>
                  <span>0 XP</span>
                </li>
                <li>
                  <img src="/home/rank-prospect.png" alt="" width={56} height={56} loading="lazy" />
                  <b>Prospect</b>
                  <span>200</span>
                </li>
                <li>
                  <img src="/home/rank-starter.png" alt="" width={56} height={56} loading="lazy" />
                  <b>Starter</b>
                  <span>600</span>
                </li>
                <li>
                  <img src="/home/rank-all-star.png" alt="" width={56} height={56} loading="lazy" />
                  <b>All-Star</b>
                  <span>1,500</span>
                </li>
                <li>
                  <img src="/home/rank-elite.png" alt="" width={56} height={56} loading="lazy" />
                  <b>Elite</b>
                  <span>3,200</span>
                </li>
                <li>
                  <img src="/home/rank-franchise.png" alt="" width={56} height={56} loading="lazy" />
                  <b>Franchise</b>
                  <span>6,500</span>
                </li>
                <li>
                  <img src="/home/rank-legend.png" alt="" width={56} height={56} loading="lazy" />
                  <b>Legend</b>
                  <span>12,000</span>
                </li>
                <li>
                  <img src="/home/rank-apex.png" alt="" width={56} height={56} loading="lazy" />
                  <b>Apex</b>
                  <span>20,000</span>
                </li>
              </ol>
            </div>

            <figure className="ranks__phone reveal">
              <div className="crop crop--fade" style={crop(".80")}>
                <div className="phone">
                  <img
                    src="/home/rank-up-rest.jpg"
                    width={660}
                    height={1434}
                    loading="lazy"
                    decoding="async"
                    alt="The rank-up screen: a gold player card, 81, SG, Sam, All-Star 1,500 XP, over a hardwood floor. Rank up, All-Star, next: Elite at 3,200 XP."
                  />
                </div>
              </div>
            </figure>
          </div>

          <div className="wrap">
            <div className="inline-cta reveal">
              <InstallButton ct="ig-sect-train" />
            </div>
          </div>
        </section>

        {/* ============ 4 · THE OTHER HALF: FUEL ============ */}
        <section className="sec sec--sage" id="fuel">
          <div className="wrap">
            <div className="sec__head">
              <p className="set eyebrow eyebrow--green">The other half</p>
              <h2 className="print h2">Fuel is half the game.</h2>
            </div>

            <div className="fuel-grid">
              <article className="fuel-card reveal">
                <p className="set eyebrow eyebrow--green">Instant verdict</p>
                <h3 className="print h3">Scan any meal in seconds.</h3>
                <p className="step__body">Point. Snap. Get your basketball-tuned score.</p>
                <p className="fine">A 0–100 Performance Score, with calories, protein, carbs and fat.</p>
                <div className="crop" style={crop(".585")}>
                  <div className="phone">
                    <img
                      src="/home/scan-result.jpg"
                      width={660}
                      height={1434}
                      loading="lazy"
                      decoding="async"
                      alt="A meal scan result: Grilled chicken bowl, 88, Great. 540 kcal, 42 g protein, 58 g carbs, 16 g fat. Game-ready fuel."
                    />
                  </div>
                </div>
              </article>

              <article className="fuel-card reveal">
                <p className="set eyebrow eyebrow--green">Game Plan</p>
                <h3 className="print h3">Your game plan, sorted</h3>
                <p className="step__body">
                  A 7-day plan tuned to your position and goal, with the shopping list done.
                </p>
                <p className="fine">Full recipes, a prep guide, and a list you can send to Reminders.</p>
                <div className="crop" style={crop(".637")}>
                  <div className="phone">
                    <img
                      src="/home/fuel-plan.jpg"
                      width={660}
                      height={1434}
                      loading="lazy"
                      decoding="async"
                      alt="Game Plan, 5 to 11 October: seven day scores, then Sunday's meals: breakfast, overnight oats, 80 Great; lunch, chicken pasta, 82 Great."
                    />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ 5 · GAME CARD ============ */}
        <section className="sec sec--teal" id="games">
          <div className="wrap gc">
            <div className="gc__copy">
              <p className="set eyebrow eyebrow--teal">After the game</p>
              <h2 className="print h2">Log it. Share it.</h2>
              <p className="lede">Your stats, your season high, one tap to share.</p>
              <p className="lede lede--small">
                Points, rebounds, assists, steals, blocks, turnovers, and your FG, 3PT and FT.
              </p>
            </div>
            <figure className="gc__card reveal">
              <img
                src="/home/share-rich.jpg"
                width={540}
                height={675}
                loading="lazy"
                decoding="async"
                alt="A shared Game Card: best game versus Riverside, 30 points, your season high across 9 games. Averages 22.7 points, 7.9 rebounds, 5.9 assists, 56% field goals."
              />
              <figcaption>Example card. Your games fill in your own.</figcaption>
            </figure>
          </div>
        </section>

        {/* ============ 6 · PRICING ============ */}
        <section className="sec sec--cream" id="pricing">
          <div className="wrap pricing">
            <div className="sec__head">
              <p className="set eyebrow eyebrow--teal">CourtFuel Pro</p>
              <h2 className="print h2">Every light on.</h2>
            </div>

            <div className="price-grid">
              <div className="pro reveal">
                <ul className="ticks">
                  <li>Your training week, drilled for your position</li>
                  <li>Drill tracking that feeds your rank</li>
                  <li>Unlimited meal scans, scored for your game</li>
                  <li>Game Plan: a plan built round your budget and shops</li>
                </ul>
                <p className="pro__plans print">Monthly or yearly</p>
                <p className="fine fine--ink">
                  Current pricing is shown in the App Store and in the app, in your local currency, before you commit to anything.
                </p>
                <InstallButton ct="ig-pricing" />
                <p className="fine fine--ink center">Free to download. CourtFuel&nbsp;Pro unlocks the app.</p>
              </div>

              <div className="after reveal">
                <p className="set eyebrow eyebrow--teal">After you tap</p>
                <ol className="after__list">
                  <li>
                    <span className="print">1</span>
                    <p>Set up: your position, level and goal.</p>
                  </li>
                  <li>
                    <span className="print">2</span>
                    <p>Meet your player card.</p>
                  </li>
                  <li>
                    <span className="print">3</span>
                    <p>Go Pro and land on Train, ready to build your week.</p>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 7 · FAQ ============ */}
        <section className="sec sec--cream sec--tight" id="faq">
          <div className="wrap faq">
            <div className="sec__head">
              <p className="set eyebrow eyebrow--teal">FAQ</p>
              <h2 className="print h2">Questions, answered</h2>
            </div>
            <div className="faq__list">
              <details>
                <summary>Do I need a subscription?</summary>
                <p>
                  Yes, for new players. CourtFuel is free to download, and CourtFuel&nbsp;Pro, monthly or yearly, unlocks the app once you&apos;ve set up and met your player card. Prices are shown in the App Store and in the app, in your currency, before you pay.
                </p>
              </details>
              <details>
                <summary>How does the training plan work?</summary>
                <p>
                  Pro builds you a weekly plan tuned to your position, level and goal: 3 to 5 sessions, each with 3 to 5 drills. Every drill has sets and reps, a coaching cue and a body map of what it works. Tick drills off as you go, and completed drills earn XP toward your rank. Want a fresh week? Rebuild it any time, up to 5 plans a month.
                </p>
              </details>
              <details>
                <summary>Is CourtFuel only for basketball players?</summary>
                {/* Live-site answer, trimmed: the "anyone who plays high-intensity sports will get useful guidance"
                    clause is dropped now the site leads with a basketball drill plan it can't back for other sports. */}
                <p>It&apos;s built for them. The AI is calibrated to basketball-specific demands.</p>
              </details>
              <details>
                <summary>What does the AI actually do?</summary>
                <p>
                  Two things. It builds your weekly drill plan, tuned to your position, level and goal. And it reads your meal photos: it identifies the food and gives a 0–100 Performance Score for basketball, with calories, protein, carbs, fat and a one-line coaching note.
                </p>
              </details>
              <details>
                <summary>Does it work for vegetarians/vegans?</summary>
                <p>
                  Yes. <span>Game Plan</span> is a Pro feature, and when you set it up you choose dietary requirements — vegetarian, vegan, halal, kosher, dairy free, gluten free or nut allergy — and the weekly plan is built around them.
                </p>
              </details>
              <details>
                <summary>What happens to my data?</summary>
                <p>
                  Your scans, hydration and schedule live on your device, and a copy of your history is backed up to our database in the UK so a new phone doesn&apos;t mean starting over. Meal photos are sent to our AI provider only at the moment of analysis, and are never included in that backup. We don&apos;t sell data, run ads, or track you across the internet. See our <Link href="/privacy">Privacy Policy</Link>.
                </p>
              </details>
              <details>
                <summary>How accurate are the scans?</summary>
                <p>
                  Good for common, clearly photographed dishes; less reliable for complex multi-component meals, unusual cuisines, or anything where portion size is hard to judge from a photo. Treat every score as guidance, not gospel — and not as medical or dietary advice.
                </p>
              </details>
              <details>
                <summary>Can I cancel anytime?</summary>
                <p>
                  Yes. Manage your subscription in iOS Settings → Apple ID → Subscriptions. <span>Your access ends when the subscription does.</span>
                </p>
              </details>
            </div>

            {/* Clipper programme: kept, but compact and secondary */}
            <aside className="clip-band reveal" aria-label="Creator program">
              <div>
                <p className="set eyebrow eyebrow--teal">Creator program</p>
                <p className="clip-band__h">Get paid to post CourtFuel content</p>
                <p className="clip-band__b">
                  Make TikToks and slideshows about CourtFuel from your own account. We track the views automatically and pay you for every 1,000 views.
                </p>
              </div>
              <Link className="ghost" href="/clippers">
                Become a clipper
              </Link>
            </aside>
          </div>
        </section>

        {/* ============ 8 · FINAL CTA ============ */}
        <section className="final" id="download">
          <div className="wrap final__inner">
            <img
              className="final__icon"
              src="/home/app-icon.png"
              alt="CourtFuel app icon"
              width={84}
              height={84}
              loading="lazy"
            />
            <h2 className="print h2 final__h">Perform like the player you&apos;re becoming.</h2>
            <InstallButton ct="ig-end" className="cta cta--final" id="final-cta" />
            <p className="micro">
              <span>
                Free to download. <span className="nw">CourtFuel&nbsp;Pro unlocks the app.</span>
              </span>
              <br />
              iPhone, iOS 17 or later
            </p>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot__inner">
          <span className="brand brand--foot">
            <img src="/home/app-icon.png" alt="" width={24} height={24} loading="lazy" />
            <span>CourtFuel</span>
          </span>
          <nav className="foot__nav" aria-label="Legal">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
            <Link href="/support">Support</Link>
            <Link href="/clippers">Become a clipper</Link>
          </nav>
          <p className="foot__legal">
            <span>App Store is a service mark of Apple Inc.</span> © 2026 CourtFuel
          </p>
        </div>
      </footer>

      {/* Sticky install bar and Instagram hand-off hint, plus the page's scripts. */}
      <HomeClient />
    </div>
  );
}
