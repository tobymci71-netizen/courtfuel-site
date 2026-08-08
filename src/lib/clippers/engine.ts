import "server-only";
import { ensureSchema, sql, type SettingsRow } from "./db";
import { fetchProfilePosts, fetchViewCounts } from "./tiktok";

// How a refresh works:
//
// 1. Every APPROVED account is scanned for the posts currently public on the
//    channel. That scan is the source of truth — it survives reuploads,
//    covers slideshows, and needs nobody to paste links.
//      · fixed-rate creators: anything public is tracked automatically.
//      · per-view clippers: newly discovered posts land as PENDING, so you
//        still approve before a single view can earn.
// 2. Anything already approved but not covered by the scan (older than the
//    scan window) is checked individually by URL.
// 3. Per-view videos earn on NEW views only: delta / 1000 * RPM, clamped so
//    total earnings can never exceed the campaign budget. Fixed-rate videos
//    are view-tracked but never earn and never touch the budget.
// 4. A post that can't be read twice in a row (deleted, or set to private on
//    a reupload) is REMOVED: it stops being tracked and its views drop out
//    of every total. Anything it earned is credited back to the campaign
//    budget, so you don't pay for content that isn't public any more. If it
//    comes back, the next scan restores it automatically.

const BATCH_SIZE = 25;
const MISS_LIMIT = 2;

export type RefreshResult = {
  checked: number;
  updated: number;
  missing: number;
  autoScanned: number;
  discovered: number;
  retired: number;
  restored: number;
  earnedCentsAdded: number;
  budgetExhausted: boolean;
  errors: string[];
};

export async function refreshViews(): Promise<RefreshResult> {
  await ensureSchema();
  const result: RefreshResult = {
    checked: 0,
    updated: 0,
    missing: 0,
    autoScanned: 0,
    discovered: 0,
    retired: 0,
    restored: 0,
    earnedCentsAdded: 0,
    budgetExhausted: false,
    errors: [],
  };

  // ---- 1. Read what is publicly live on every approved account ----
  const fresh = new Map<string, number>();
  const accounts = await sql<
    { id: number; user_id: number; handle: string; pay_type: string }[]
  >`SELECT a.id, a.user_id, LOWER(a.handle) AS handle, u.pay_type
    FROM cf_accounts a JOIN cf_users u ON u.id = a.user_id
    WHERE a.status = 'approved'`;

  if (accounts.length > 0) {
    const byHandle = new Map(accounts.map((a) => [a.handle, a]));
    try {
      const posts = await fetchProfilePosts([...byHandle.keys()]);
      for (const post of posts) {
        const acc = byHandle.get(post.handle);
        if (!acc) continue;
        fresh.set(post.tiktokId, post.views);
        result.autoScanned++;

        // New posts are inserted with views 0 so that, for per-view clippers,
        // approving a video still counts the views it already had.
        const status = acc.pay_type === "fixed" ? "approved" : "pending";
        const inserted = await sql<{ id: number }[]>`
          INSERT INTO cf_videos (user_id, account_id, url, tiktok_id, status)
          VALUES (${acc.user_id}, ${acc.id}, ${post.cleanUrl}, ${post.tiktokId}, ${status})
          ON CONFLICT (tiktok_id) DO NOTHING
          RETURNING id`;
        if (inserted.length > 0) {
          result.discovered++;
          continue;
        }
        // Public again after being removed — put it back, and give its
        // earnings back to the budget they were refunded from.
        await sql.begin(async (tx) => {
          const [back] = await tx<{ earned_cents: string }[]>`
            UPDATE cf_videos
            SET status = 'approved', tracking = true, missed_count = 0, track_error = ''
            WHERE tiktok_id = ${post.tiktokId} AND status = 'removed'
            RETURNING earned_cents`;
          if (!back) return;
          result.restored++;
          const cents = Number(back.earned_cents);
          if (cents > 0 && acc.pay_type === "per_view") {
            await tx`
              UPDATE cf_settings
              SET total_earned_cents = total_earned_cents + ${cents},
                  updated_at = now()
              WHERE id = 1`;
          }
        });
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // ---- 2. Collect every video we're still tracking ----
  const videos = await sql<
    {
      id: number;
      url: string;
      tiktok_id: string;
      views: number;
      missed_count: number;
      pay_type: string;
    }[]
  >`SELECT v.id, v.url, v.tiktok_id, v.views, v.missed_count, u.pay_type
    FROM cf_videos v JOIN cf_users u ON u.id = v.user_id
    WHERE v.status = 'approved' AND v.tracking = true
    ORDER BY v.id`;
  result.checked = videos.length;
  if (videos.length === 0) {
    await recordSnapshots();
    return finish(result);
  }

  // ---- 3. Anything the channel scan didn't cover, check by URL ----
  const uncovered = videos.filter((v) => !fresh.has(v.tiktok_id));
  for (let i = 0; i < uncovered.length; i += BATCH_SIZE) {
    const batch = uncovered.slice(i, i + BATCH_SIZE);
    try {
      const counts = await fetchViewCounts(batch.map((v) => v.url));
      for (const [id, views] of counts) fresh.set(id, views);
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // ---- 4. Apply fresh counts, accrue earnings, retire dead posts ----
  for (const video of videos) {
    const freshViews = fresh.get(video.tiktok_id);

    if (freshViews === undefined) {
      const missed = Number(video.missed_count) + 1;
      result.missing++;
      if (missed >= MISS_LIMIT) {
        result.retired++;
        // Not public any more: drop it out of every total, and hand back
        // whatever budget it had consumed.
        await sql.begin(async (tx) => {
          const [v] = await tx<{ earned_cents: string }[]>`
            SELECT earned_cents FROM cf_videos WHERE id = ${video.id} FOR UPDATE`;
          await tx`
            UPDATE cf_videos
            SET status = 'removed',
                tracking = false,
                missed_count = ${missed},
                last_checked = now(),
                track_error = 'No longer public — deleted or set to private. Removed from all totals.'
            WHERE id = ${video.id}`;
          const cents = Number(v?.earned_cents ?? 0);
          if (cents > 0 && video.pay_type === "per_view") {
            await tx`
              UPDATE cf_settings
              SET total_earned_cents = GREATEST(0, total_earned_cents - ${cents}),
                  updated_at = now()
              WHERE id = 1`;
          }
        });
      } else {
        await sql`
          UPDATE cf_videos
          SET missed_count = ${missed},
              last_checked = now(),
              track_error = 'Could not be read this time — will retry on the next refresh.'
          WHERE id = ${video.id}`;
      }
      continue;
    }

    // Serializable accrual: lock settings, compute clamp, apply.
    const added = await sql.begin(async (tx) => {
      const [s] = await tx<SettingsRow[]>`
        SELECT rpm_cents, budget_cents, total_earned_cents, campaign_active
        FROM cf_settings WHERE id = 1 FOR UPDATE`;
      const [row] = await tx<{ views: number }[]>`
        SELECT views FROM cf_videos WHERE id = ${video.id} FOR UPDATE`;

      const deltaViews = Math.max(0, freshViews - Number(row.views));
      let earn = 0;
      if (
        deltaViews > 0 &&
        s.campaign_active &&
        video.pay_type === "per_view"
      ) {
        const raw = Math.floor((deltaViews * s.rpm_cents) / 1000);
        const remaining = Math.max(
          0,
          Number(s.budget_cents) - Number(s.total_earned_cents),
        );
        earn = Math.min(raw, remaining);
      }

      await tx`
        UPDATE cf_videos
        SET views = ${freshViews},
            earned_cents = earned_cents + ${earn},
            last_checked = now(),
            missed_count = 0,
            track_error = ''
        WHERE id = ${video.id}`;
      if (earn > 0) {
        await tx`
          UPDATE cf_settings
          SET total_earned_cents = total_earned_cents + ${earn},
              updated_at = now()
          WHERE id = 1`;
      }
      return earn;
    });

    result.updated++;
    result.earnedCentsAdded += added;
  }

  await recordSnapshots();
  return finish(result);
}

// History points for the analytics graphs: one global row (split by deal
// type) plus one row per creator for their personal graph.
async function recordSnapshots() {
  await sql`
    INSERT INTO cf_snapshots (total_views, fixed_views, rpm_views)
    SELECT COALESCE(SUM(v.views), 0),
           COALESCE(SUM(v.views) FILTER (WHERE u.pay_type = 'fixed'), 0),
           COALESCE(SUM(v.views) FILTER (WHERE u.pay_type = 'per_view'), 0)
    FROM cf_videos v JOIN cf_users u ON u.id = v.user_id
    WHERE v.status = 'approved'`;
  await sql`
    INSERT INTO cf_user_snapshots (user_id, views)
    SELECT user_id, COALESCE(SUM(views), 0)
    FROM cf_videos WHERE status = 'approved'
    GROUP BY user_id`;
}

async function finish(result: RefreshResult): Promise<RefreshResult> {
  const [s] = await sql<SettingsRow[]>`
    SELECT rpm_cents, budget_cents, total_earned_cents, campaign_active
    FROM cf_settings WHERE id = 1`;
  result.budgetExhausted =
    Number(s.total_earned_cents) >= Number(s.budget_cents);
  return result;
}

export async function getSettings(): Promise<SettingsRow> {
  await ensureSchema();
  const [s] = await sql<SettingsRow[]>`
    SELECT rpm_cents, budget_cents, total_earned_cents, campaign_active
    FROM cf_settings WHERE id = 1`;
  return s;
}

export function fmtUsd(cents: number | string) {
  return (Number(cents) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function fmtViews(n: number | string) {
  return Number(n).toLocaleString("en-US");
}
