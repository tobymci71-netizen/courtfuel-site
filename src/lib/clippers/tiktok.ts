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
// Discovery actors, cheapest first. apidojo bills ~$0.0003 per post vs
// clockworks' ~$0.003 — 10x less for the same job — so the free monthly
// credit stretches to roughly 16,000 posts instead of 1,600.
const APIFY_PROFILE_ACTORS = [
  "apidojo~tiktok-scraper",
  "clockworks~tiktok-profile-scraper",
];
const POSTS_PER_PROFILE = 30;

type ApifyItem = {
  id?: string;
  playCount?: number;
  webVideoUrl?: string;
  postPage?: string;
  authorMeta?: { name?: string };
  [key: string]: unknown;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// --- Free provider 1: read the post's own public page ----------------------
// TikTok embeds the post's stats as JSON in the page it serves to browsers.
// No key, no quota, no third party.
async function viewsFromTikTok(
  url: string,
): Promise<{ id: string; views: number } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/,
    );
    if (!m) return null;
    const scope = (JSON.parse(m[1]) as Record<string, unknown>)?.[
      "__DEFAULT_SCOPE__"
    ] as Record<string, { itemInfo?: { itemStruct?: ApifyItem } }> | undefined;
    const item = scope?.["webapp.video-detail"]?.itemInfo?.itemStruct as
      | { id?: string; stats?: { playCount?: number } }
      | undefined;
    const id = item?.id ? String(item.id) : null;
    const views = Number(item?.stats?.playCount);
    if (!id || !Number.isFinite(views)) return null;
    return { id, views };
  } catch {
    return null;
  }
}

// --- Free provider 2: public tikwm endpoint --------------------------------
async function viewsFromTikwm(
  url: string,
): Promise<{ id: string; views: number } | null> {
  try {
    const res = await fetch(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
      { cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      code?: number;
      data?: { id?: string; play_count?: number };
    };
    if (j?.code !== 0) return null;
    const id = j.data?.id ? String(j.data.id) : null;
    const views = Number(j.data?.play_count);
    if (!id || !Number.isFinite(views)) return null;
    return { id, views };
  } catch {
    return null;
  }
}

// Current view counts for a batch of post URLs, tiktokId -> views.
// Free sources are tried first; Apify is only used for whatever they miss,
// and only when a token is configured.
export async function fetchViewCounts(
  urls: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (urls.length === 0) return map;

  const missed: string[] = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const slice = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      slice.map(async (u) => ({
        url: u,
        hit: (await viewsFromTikTok(u)) ?? (await viewsFromTikwm(u)),
      })),
    );
    for (const { url, hit } of results) {
      if (hit) map.set(hit.id, Math.max(hit.views, map.get(hit.id) ?? 0));
      else missed.push(url);
    }
  }

  if (missed.length > 0 && process.env.APIFY_TOKEN) {
    try {
      const paid = await fetchViewCountsApify(missed);
      for (const [id, views] of paid) {
        map.set(id, Math.max(views, map.get(id) ?? 0));
      }
    } catch {
      // Out of credit or the actor failed — the free results still stand.
    }
  }
  return map;
}

// Paid fallback (Apify). Only called for posts the free sources missed.
async function fetchViewCountsApify(
  urls: string[],
): Promise<Map<string, number>> {
  const token = process.env.APIFY_TOKEN;
  if (!token || urls.length === 0) return new Map();

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

// --- Whole-account scanning (fixed-rate creators) ---------------------------

export type ProfilePost = {
  handle: string;
  tiktokId: string;
  views: number;
  cleanUrl: string;
};

// Scrapes the latest posts (videos AND slideshows) from whole TikTok
// profiles, so fixed-rate creators never have to submit links manually.
// Discovering brand-new posts needs a full channel listing, which TikTok
// only serves to signed requests — so this is the one part that still needs
// Apify. Without a working token it returns nothing and the rest of the
// refresh (updating views on posts we already know) carries on for free.
export async function fetchProfilePosts(
  handles: string[],
): Promise<ProfilePost[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token || handles.length === 0) return [];

  const base = process.env.APIFY_BASE_URL ?? "https://api.apify.com";
  let lastError = "";

  for (const actor of APIFY_PROFILE_ACTORS) {
    // Each actor takes a different input shape.
    const body = actor.startsWith("apidojo")
      ? {
          startUrls: handles.map((h) => `https://www.tiktok.com/@${h}`),
          maxItems: POSTS_PER_PROFILE * handles.length,
        }
      : {
          profiles: handles,
          resultsPerPage: POSTS_PER_PROFILE,
          profileSorting: "latest",
        };

    let items: ApifyItem[];
    try {
      const res = await fetch(
        `${base}/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}&timeout=280`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        lastError = `${actor} failed (${res.status}): ${text.slice(0, 200)}`;
        continue;
      }
      const parsed = await res.json();
      if (!Array.isArray(parsed)) {
        lastError = `${actor}: ${JSON.stringify(parsed).slice(0, 200)}`;
        continue;
      }
      items = parsed as ApifyItem[];
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }

    // Field names vary between actors — read defensively.
    const posts: ProfilePost[] = [];
    for (const item of items) {
      const author = (item.authorMeta ?? item.author ?? {}) as {
        name?: string;
        uniqueId?: string;
        unique_id?: string;
      };
      const handle = String(
        author.name ?? author.uniqueId ?? author.unique_id ?? "",
      ).toLowerCase();
      const stats = (item.stats ?? {}) as { playCount?: number };
      const id = String(item.id ?? item.aweme_id ?? "");
      const views = Number(
        item.playCount ?? stats.playCount ?? item.play_count ?? 0,
      );
      if (!handle || !id || !Number.isFinite(views)) continue;
      const src = String(item.webVideoUrl ?? item.postPage ?? "");
      const kind = /\/photo\//i.test(src) ? "photo" : "video";
      posts.push({
        handle,
        tiktokId: id,
        views,
        cleanUrl: `https://www.tiktok.com/@${handle}/${kind}/${id}`,
      });
    }
    if (posts.length > 0) return posts;
    lastError = `${actor} returned nothing usable`;
  }

  throw new Error(lastError || "Profile scan unavailable");
}
