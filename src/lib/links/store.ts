import "server-only";
import { ensureSchema, sql } from "@/lib/clippers/db";
import type { Platform } from "./go";
import {
  buildDailySeries,
  DEFAULT_RANGE,
  londonDay,
  type DailySeries,
  type RangeDays,
  type TapBucketRow,
} from "./daily";

// One row per tap on a /go link. No IP address, cookie or user agent is kept:
// only which link, which kind of phone, and when.
export async function recordTap(src: string, platform: Platform) {
  await ensureSchema();
  await sql`INSERT INTO cf_link_taps (src, platform) VALUES (${src}, ${platform})`;
}

export type TapRow = {
  src: string;
  ios_7d: number;
  android_7d: number;
  other_7d: number;
  ios_all: number;
  android_all: number;
  other_all: number;
};

export async function tapSummary(): Promise<TapRow[]> {
  await ensureSchema();
  return sql<TapRow[]>`
    SELECT
      src,
      count(*) FILTER (WHERE platform = 'ios' AND created_at > now() - interval '7 days')::int     AS ios_7d,
      count(*) FILTER (WHERE platform = 'android' AND created_at > now() - interval '7 days')::int AS android_7d,
      count(*) FILTER (WHERE platform = 'other' AND created_at > now() - interval '7 days')::int   AS other_7d,
      count(*) FILTER (WHERE platform = 'ios')::int     AS ios_all,
      count(*) FILTER (WHERE platform = 'android')::int AS android_all,
      count(*) FILTER (WHERE platform = 'other')::int   AS other_all
    FROM cf_link_taps
    GROUP BY src
    ORDER BY count(*) DESC`;
}

// Taps per London day, account and hour for the last `range` London days
// (today included), shaped into one entry per day by buildDailySeries.
// The hour is kept so the table can show each day's busiest hour.
// 'Europe/London' here must match TIME_ZONE in ./daily.
export async function tapsByDay(range: RangeDays = DEFAULT_RANGE): Promise<DailySeries> {
  await ensureSchema();
  const lastDay = londonDay();
  const rows = await sql<TapBucketRow[]>`
    SELECT
      to_char((created_at AT TIME ZONE 'Europe/London')::date, 'YYYY-MM-DD') AS day,
      src,
      extract(hour FROM created_at AT TIME ZONE 'Europe/London')::int         AS hour,
      count(*)::int                                                       AS taps
    FROM cf_link_taps
    WHERE created_at >= ((${lastDay}::date - ${range - 1}::int)::timestamp AT TIME ZONE 'Europe/London')
    GROUP BY 1, 2, 3`;
  return buildDailySeries(rows, range, lastDay);
}

export type WaitlistRow = {
  id: number;
  email: string;
  src: string;
  created_at: string;
};

export async function waitlistRows(): Promise<WaitlistRow[]> {
  await ensureSchema();
  return sql<WaitlistRow[]>`
    SELECT id, email, src, created_at
    FROM cf_waitlist
    ORDER BY created_at DESC
    LIMIT 2000`;
}
