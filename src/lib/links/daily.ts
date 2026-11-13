// Pure helpers for the "Bio links" graphs: turn rows of taps (per London day,
// account and hour) into one entry per day with every day present and zeros
// filled in. No database and no server-only imports here, so the unit tests
// (tests/links/daily.test.mjs) can load this file with plain Node.

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];
export const DEFAULT_RANGE: RangeDays = 30;

export const TIME_ZONE = "Europe/London";

// Line colours for the accounts, in order of most taps. Picked to stay apart
// from each other on the dark background; every line also carries its name at
// the line end and in the legend, so colour is never the only cue.
const PALETTE = ["#38bdf8", "#ff6b1a", "#a3e635", "#f472b6", "#a78bfa", "#facc15", "#2dd4bf", "#f87171"];

export function accountColor(i: number): string {
  return PALETTE[i % PALETTE.length];
}

// One row from the database: taps for one account in one London hour of one day.
export type TapBucketRow = {
  day: string; // YYYY-MM-DD, Europe/London
  src: string;
  hour: number; // 0-23, Europe/London
  taps: number;
};

export type DailyPoint = {
  day: string; // YYYY-MM-DD
  counts: Record<string, number>; // every account in `accounts`, 0 when none
  total: number;
  busiestHour: number | null; // London hour with the most taps that day (all accounts)
  busiestHourTaps: number;
};

export type DailySeries = {
  days: DailyPoint[]; // oldest first, exactly `range` entries
  accounts: string[]; // accounts with any tap in the range, most taps first
  totals: Record<string, number>; // per account, whole range
  total: number; // all accounts, whole range
};

export function parseRange(v: string | string[] | undefined): RangeDays {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : DEFAULT_RANGE;
}

// The calendar day (YYYY-MM-DD) in London for a moment in time.
export function londonDay(at: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

// `count` consecutive calendar days ending on `lastDay`, oldest first.
// Pure date arithmetic on the day strings, so clock changes cannot skip or
// repeat a day.
export function dayList(lastDay: string, count: number): string[] {
  const [y, m, d] = lastDay.split("-").map(Number);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return out;
}

export function buildDailySeries(
  rows: TapBucketRow[],
  range: number,
  lastDay: string,
): DailySeries {
  const days = dayList(lastDay, range);
  const inRange = new Set(days);

  const perDay = new Map<string, Map<string, number>>(); // day -> src -> taps
  const perHour = new Map<string, number[]>(); // day -> taps per hour
  const totals: Record<string, number> = {};
  let total = 0;

  for (const r of rows) {
    const taps = Number(r.taps) || 0;
    if (!inRange.has(r.day) || taps <= 0) continue;
    const bySrc = perDay.get(r.day) ?? new Map<string, number>();
    bySrc.set(r.src, (bySrc.get(r.src) ?? 0) + taps);
    perDay.set(r.day, bySrc);
    const hours = perHour.get(r.day) ?? new Array<number>(24).fill(0);
    const h = Math.min(23, Math.max(0, Math.trunc(Number(r.hour) || 0)));
    hours[h] += taps;
    perHour.set(r.day, hours);
    totals[r.src] = (totals[r.src] ?? 0) + taps;
    total += taps;
  }

  const accounts = Object.keys(totals).sort(
    (a, b) => totals[b] - totals[a] || a.localeCompare(b),
  );

  const points: DailyPoint[] = days.map((day) => {
    const bySrc = perDay.get(day);
    const counts: Record<string, number> = {};
    let dayTotal = 0;
    for (const a of accounts) {
      const n = bySrc?.get(a) ?? 0;
      counts[a] = n;
      dayTotal += n;
    }
    let busiestHour: number | null = null;
    let busiestHourTaps = 0;
    const hours = perHour.get(day);
    if (hours) {
      hours.forEach((n, h) => {
        if (n > busiestHourTaps) {
          busiestHourTaps = n;
          busiestHour = h;
        }
      });
    }
    return { day, counts, total: dayTotal, busiestHour, busiestHourTaps };
  });

  return { days: points, accounts, totals, total };
}

// Whole-number y-axis ticks from 0 to a round top that is >= max.
export function yTicks(max: number, target = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const rough = max / target;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].map((f) => f * pow).find((s) => s >= rough) ?? 10 * pow);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v));
  return ticks;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "13 Nov" (or "Thu 13 Nov" with the weekday).
export function fmtDay(day: string, withWeekday = false): string {
  const [y, m, d] = day.split("-").map(Number);
  const base = `${d} ${MONTHS[m - 1]}`;
  if (!withWeekday) return base;
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${base}`;
}

// "21:00-22:00"
export function fmtHour(h: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:00-${p((h + 1) % 24)}:00`;
}
