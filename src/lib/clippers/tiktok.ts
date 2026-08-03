import "server-only";

// --- URL parsing -----------------------------------------------------------

// Accepts video AND photo/slideshow URLs:
//   https://www.tiktok.com/@handle/video/7301234567890123456
//   https://www.tiktok.com/@handle/photo/7301234567890123456
const POST_RE =
  /^https?:\/\/(?:www\.|m\.)?tiktok\.com\/@([\w.-]+)\/(?:video|photo)\/(\d+)/i;

// Profile URL: https://www.tiktok.com/@handle
const PROFILE_RE = /^https?:\/\/(?:www\.|m\.)?tiktok\.com\/@([\w.-]+)\/?(?:\?.*)?$/i;

export function parsePostUrl(
  raw: string,
): { handle: string; tiktokId: string; cleanUrl: string } | null {
  const m = raw.trim().match(POST_RE);
  if (!m) return null;
  const handle = m[1].toLowerCase();
  const id = m[2];
  const kind = /\/photo\//i.test(raw) ? "photo" : "video";
  return {
    handle,
    tiktokId: id,
    cleanUrl: `https://www.tiktok.com/@${handle}/${kind}/${id}`,
  };
}

export function parseProfileUrl(
  raw: string,
): { handle: string; cleanUrl: string } | null {
  const trimmed = raw.trim();
  // Also accept a bare @handle or handle.
  const bare = trimmed.match(/^@?([\w.-]{2,24})$/);
  if (bare && !trimmed.includes("/")) {
    const handle = bare[1].toLowerCase();
    return { handle, cleanUrl: `https://www.tiktok.com/@${handle}` };
  }
  const m = trimmed.match(PROFILE_RE);
  if (!m) return null;
  const handle = m[1].toLowerCase();
  return { handle, cleanUrl: `https://www.tiktok.com/@${handle}` };
}

// --- View fetching via Apify ----------------------------------------------

const APIFY_ACTOR = "clockworks~tiktok-video-scraper";

type ApifyItem = {
  id?: string;
  playCount?: number;
  webVideoUrl?: string;
  postPage?: string;
  authorMeta?: { name?: string };
  [key: string]: unknown;
};

// Fetches current view counts for a batch of TikTok post URLs.
// Returns a map of tiktokId -> views for every post the scraper found.
export async function fetchViewCounts(
  urls: string[],
): Promise<Map<string, number>> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error(
      "APIFY_TOKEN is not set. Create a free account at apify.com, then copy your API token from Settings → API & Integrations.",
    );
  }
  if (urls.length === 0) return new Map();

  const base = process.env.APIFY_BASE_URL ?? "https://api.apify.com";
  const res = await fetch(
    `${base}/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}&timeout=280`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postURLs: urls }),
      // Never cache scrape results.
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apify request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const items = (await res.json()) as ApifyItem[];

  const map = new Map<string, number>();
  for (const item of items) {
    const views = Number(item.playCount ?? 0);
    // Prefer the item's own id; fall back to extracting from its URL.
    let id = item.id ? String(item.id) : null;
    if (!id) {
      const src = String(item.webVideoUrl ?? item.postPage ?? "");
      const m = src.match(/\/(?:video|photo)\/(\d+)/);
      id = m ? m[1] : null;
    }
    if (id && Number.isFinite(views)) {
      map.set(id, Math.max(views, map.get(id) ?? 0));
    }
  }
  return map;
}
