import "server-only";
import { ensureSchema, sql, type SettingsRow } from "./db";
import { fetchProfilePosts, fetchViewCounts } from "./tiktok";

// How earnings work:
// - Each refresh pulls fresh view counts for every APPROVED video.
// - A video only earns on NEW views since the last refresh (the delta).
// - delta earnings = deltaViews / 1000 * RPM.
// - Earnings only accrue while the campaign is active AND budget remains.
//   The final accrual is clamped to exactly exhaust the budget, so total
//   payouts can never exceed the budget you set. Raising the budget later
//   resumes accrual from the current view counts (views seen while the
//   budget was exhausted don't retroactively earn).

const BATCH_SIZE = 25;

export type RefreshResult = {
  checked: number;
  updated: number;
  missing: number;
  autoScanned: number;
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
    earnedCentsAdded: 0,
    budgetExhausted: false,
    errors: [],
  };

  // ---- Fixed-rate creators: scan their whole accounts automatically ----
  // They don't submit links — every post on an approved account is found,
  // imported (auto-approved) and view-updated here. No earnings, no budget.
  const scannedIds = new Set<string>();
  const fixedAccounts = await sql<
    { id: number; user_id: number; handle: string }[]
  >`SELECT a.id, a.user_id, LOWER(a.handle) AS handle
    FROM cf_accounts a JOIN cf_users u ON u.id = a.user_id
    WHERE a.status = 'approved' AND u.pay_type = 'fixed'`;
  if (fixedAccounts.length > 0) {
    const byHandle = new Map(fixedAccounts.map((a) => [a.handle, a]));
    try {
      const posts = await fetchProfilePosts([...byHandle.keys()]);
      for (const post of posts) {
        const acc = byHandle.get(post.handle);
        if (!acc) continue;
        // Update views only when the row belongs to this account's owner, so
        // a per-view clipper's delta-based earnings can never be skipped.
        await sql`
          INSERT INTO cf_videos (user_id, account_id, url, tiktok_id, status, views, last_checked)
          VALUES (${acc.user_id}, ${acc.id}, ${post.cleanUrl}, ${post.tiktokId}, 'approved', ${post.views}, now())
          ON CONFLICT (tiktok_id) DO UPDATE
          SET views = EXCLUDED.views, last_checked = now(), track_error = ''
          WHERE cf_videos.user_id = EXCLUDED.user_id`;
        scannedIds.add(post.tiktokId);
        result.autoScanned++;
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  const allVideos = await sql<
    {
      id: number;
      url: string;
      tiktok_id: string;
      views: number;
      pay_type: string;
    }[]
  >`SELECT v.id, v.url, v.tiktok_id, v.views, u.pay_type
    FROM cf_videos v JOIN cf_users u ON u.id = v.user_id
    WHERE v.status = 'approved' ORDER BY v.id`;
  // Skip anything the profile scan just updated.
  const videos = allVideos.filter((v) => !scannedIds.has(v.tiktok_id));
  result.checked = allVideos.length;

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);
    let counts: Map<string, number>;
    try {
      counts = await fetchViewCounts(batch.map((v) => v.url));
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    for (const video of batch) {
      const fresh = counts.get(video.tiktok_id);
      if (fresh === undefined) {
        result.missing++;
        await sql`
          UPDATE cf_videos
          SET last_checked = now(),
              track_error = 'Could not read this post (deleted, private, or scraper miss)'
          WHERE id = ${video.id}`;
        continue;
      }

      // Serializable accrual: lock settings, compute clamp, apply.
      const added = await sql.begin(async (tx) => {
        const [s] = await tx<
          SettingsRow[]
        >`SELECT rpm_cents, budget_cents, total_earned_cents, campaign_active
          FROM cf_settings WHERE id = 1 FOR UPDATE`;
        const [row] = await tx<
          { views: number }[]
        >`SELECT views FROM cf_videos WHERE id = ${video.id} FOR UPDATE`;

        const deltaViews = Math.max(0, fresh - Number(row.views));
        let earn = 0;
        if (deltaViews > 0 && s.campaign_active && video.pay_type === "per_view") {
          const raw = Math.floor((deltaViews * s.rpm_cents) / 1000);
          const remaining = Math.max(
            0,
            Number(s.budget_cents) - Number(s.total_earned_cents),
          );
          earn = Math.min(raw, remaining);
        }

        await tx`
          UPDATE cf_videos
          SET views = ${fresh},
              earned_cents = earned_cents + ${earn},
              last_checked = now(),
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
  }

  const [s] = await sql<SettingsRow[]>`
    SELECT rpm_cents, budget_cents, total_earned_cents, campaign_active
    FROM cf_settings WHERE id = 1`;
  result.budgetExhausted =
    Number(s.total_earned_cents) >= Number(s.budget_cents);

  // Record a history point so the admin analytics graphs can show growth.
  await sql`
    INSERT INTO cf_snapshots (total_views, fixed_views, rpm_views)
    SELECT COALESCE(SUM(v.views), 0),
           COALESCE(SUM(v.views) FILTER (WHERE u.pay_type = 'fixed'), 0),
           COALESCE(SUM(v.views) FILTER (WHERE u.pay_type = 'per_view'), 0)
    FROM cf_videos v JOIN cf_users u ON u.id = v.user_id
    WHERE v.status = 'approved'`;

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
