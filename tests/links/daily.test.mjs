// Run with: npm test   (plain Node, no test framework to install)
//
// Covers the pure part of the bio-link graphs: London days, zero-filling,
// per-account totals, busiest hour and the y-axis ticks. The SQL itself needs
// the real database and is not covered here.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildDailySeries,
  dayList,
  fmtDay,
  fmtHour,
  londonDay,
  parseRange,
  yTicks,
} from "../../src/lib/links/daily.ts";

test("dayList: consecutive days ending on the last day, across month and clock change", () => {
  assert.deepEqual(dayList("2026-11-02", 4), ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  // UK clocks went back on 25 Oct 2026: still one entry per day.
  assert.deepEqual(dayList("2026-10-26", 3), ["2026-10-24", "2026-10-25", "2026-10-26"]);
  assert.deepEqual(dayList("2024-03-01", 2), ["2024-02-29", "2024-03-01"]);
  assert.equal(dayList("2026-11-13", 90).length, 90);
});

test("londonDay: uses London time, not UTC", () => {
  // 23:30 UTC on 1 Jul is 00:30 on 2 Jul in London (BST).
  assert.equal(londonDay(new Date("2026-07-01T23:30:00Z")), "2026-07-02");
  // In winter London is on UTC.
  assert.equal(londonDay(new Date("2026-12-01T23:30:00Z")), "2026-12-01");
});

test("parseRange: only 7, 30 or 90, default 30", () => {
  assert.equal(parseRange("7"), 7);
  assert.equal(parseRange(["90"]), 90);
  assert.equal(parseRange(undefined), 30);
  assert.equal(parseRange("14"), 30);
  assert.equal(parseRange("abc"), 30);
});

test("no taps: every day present with zeros, no accounts", () => {
  const s = buildDailySeries([], 7, "2026-11-13");
  assert.equal(s.days.length, 7);
  assert.equal(s.days[0].day, "2026-11-07");
  assert.equal(s.days[6].day, "2026-11-13");
  assert.deepEqual(s.accounts, []);
  assert.equal(s.total, 0);
  for (const d of s.days) {
    assert.equal(d.total, 0);
    assert.equal(d.busiestHour, null);
    assert.deepEqual(d.counts, {});
  }
});

test("buckets per day and account, fills zeros, orders accounts by taps", () => {
  const rows = [
    { day: "2026-11-11", src: "stickvert", hour: 20, taps: 3 },
    { day: "2026-11-11", src: "stickvert", hour: 21, taps: 5 },
    { day: "2026-11-11", src: "courtgeniuz", hour: 21, taps: 4 },
    { day: "2026-11-13", src: "courtgeniuz", hour: 9, taps: 6 },
    { day: "2026-11-13", src: "board", hour: 9, taps: "2" }, // postgres may hand back strings
    { day: "2026-11-01", src: "old", hour: 9, taps: 50 }, // outside the range: ignored
  ];
  const s = buildDailySeries(rows, 3, "2026-11-13");
  assert.deepEqual(s.days.map((d) => d.day), ["2026-11-11", "2026-11-12", "2026-11-13"]);
  assert.deepEqual(s.accounts, ["courtgeniuz", "stickvert", "board"]);
  assert.deepEqual(s.totals, { courtgeniuz: 10, stickvert: 8, board: 2 });
  assert.equal(s.total, 20);

  const [d11, d12, d13] = s.days;
  assert.deepEqual(d11.counts, { courtgeniuz: 4, stickvert: 8, board: 0 });
  assert.equal(d11.total, 12);
  assert.equal(d11.busiestHour, 21); // 5 + 4 at 21:00 beats 3 at 20:00
  assert.equal(d11.busiestHourTaps, 9);

  assert.deepEqual(d12.counts, { courtgeniuz: 0, stickvert: 0, board: 0 });
  assert.equal(d12.total, 0);
  assert.equal(d12.busiestHour, null);

  assert.equal(d13.total, 8);
  assert.equal(d13.busiestHour, 9);
  assert.equal(s.days.reduce((n, d) => n + d.total, 0), s.total);
});

test("one account and one day only", () => {
  const s = buildDailySeries([{ day: "2026-11-13", src: "solo", hour: 0, taps: 1 }], 1, "2026-11-13");
  assert.equal(s.days.length, 1);
  assert.deepEqual(s.accounts, ["solo"]);
  assert.equal(s.days[0].busiestHour, 0);
});

test("yTicks: start at 0, whole numbers, top covers the max", () => {
  assert.deepEqual(yTicks(0), [0, 1]);
  assert.deepEqual(yTicks(1), [0, 1]);
  assert.deepEqual(yTicks(3), [0, 1, 2, 3]);
  assert.deepEqual(yTicks(10), [0, 5, 10]);
  assert.deepEqual(yTicks(37), [0, 10, 20, 30, 40]);
  for (const m of [2, 7, 13, 99, 101, 1234]) {
    const t = yTicks(m);
    assert.equal(t[0], 0);
    assert.ok(t[t.length - 1] >= m, `top for ${m}`);
    assert.ok(t.every(Number.isInteger));
  }
});

test("formatting", () => {
  assert.equal(fmtDay("2026-11-13"), "13 Nov");
  assert.equal(fmtDay("2026-11-13", true), "Fri 13 Nov");
  assert.equal(fmtHour(21), "21:00-22:00");
  assert.equal(fmtHour(23), "23:00-00:00");
});
