// The bio-link router: one link per social account, e.g. courtfuel.app/go/stickvert.
// iPhones go straight to the App Store, Android phones to the waitlist, and
// anything else (a laptop, a link-preview crawler) to the homepage.
import { APP_STORE_HREF } from "@/components/home/app-store";

export type Platform = "ios" | "android" | "other" | "bot";

// Link-preview fetchers and crawlers. "bot\b" catches Googlebot, Twitterbot,
// Discordbot and friends without matching phone brands such as CUBOT_X30.
const BOT_RE =
  /bot\b|crawler|spider|facebookexternalhit|meta-externalagent|slurp|headless|lighthouse/i;

export function platformOf(userAgent: string): Platform {
  if (BOT_RE.test(userAgent)) return "bot";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}

// The account name from the link: lower-case letters, digits, dot, dash and
// underscore. Anything else is dropped, so it is safe to store and to echo.
export function cleanSrc(raw: string | null | undefined): string {
  const s = (raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 30);
  return s || "direct";
}

// With APP_STORE_PROVIDER_TOKEN set (the "pt" number from an App Store Connect
// campaign link), every account gets its own campaign, so App Analytics shows
// downloads per account. Without it the plain link is used.
export function appStoreUrl(src: string): string {
  const pt = process.env.APP_STORE_PROVIDER_TOKEN;
  if (!pt || !/^\d+$/.test(pt)) return APP_STORE_HREF;
  const ct = encodeURIComponent(`ig-${src}`.slice(0, 40));
  return `https://apps.apple.com/app/apple-store/id6772562071?pt=${pt}&ct=${ct}&mt=8`;
}
