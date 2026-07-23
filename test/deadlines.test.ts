import { test } from "node:test";
import assert from "node:assert/strict";
import { upcomingDeadlines } from "../src/lib/deadlines.ts";

/**
 * `upcomingDeadlines` keeps the deadlines still ahead (calendar-day semantics
 * shared with `daysUntil`: a deadline counts while daysUntil >= 0) and sorts
 * them soonest-first. Schema dates are UTC-midnight (`z.coerce.date`), hence the
 * `Date.UTC` construction; `now` is read in the viewer's own zone.
 */
const utc = (y: number, m: number, d: number, h = 0) =>
  new Date(Date.UTC(y, m - 1, d, h));
const local = (y: number, m: number, d: number, h = 0) =>
  new Date(y, m - 1, d, h);
const titles = (ds: { title: string }[]) => ds.map((d) => d.title);

test("upcomingDeadlines: empty in, empty out", () => {
  assert.deepEqual(upcomingDeadlines([]), []);
});

test("upcomingDeadlines: all-past deadlines are dropped", () => {
  const now = local(2026, 6, 15);
  const ds = [
    { title: "yesterday", date: utc(2026, 6, 14) },
    { title: "new year", date: utc(2026, 1, 1) },
  ];
  assert.deepEqual(upcomingDeadlines(ds, now), []);
});

test("upcomingDeadlines: sorts ascending by date, leaving the input untouched", () => {
  const now = local(2026, 6, 15);
  const ds = [
    { title: "late", date: utc(2026, 9, 1) },
    { title: "soon", date: utc(2026, 6, 20) },
    { title: "mid", date: utc(2026, 7, 15) },
  ];
  assert.deepEqual(titles(upcomingDeadlines(ds, now)), ["soon", "mid", "late"]);
  // A fresh array is returned — the caller's own order stays intact.
  assert.deepEqual(titles(ds), ["late", "soon", "mid"]);
});

test("upcomingDeadlines: a deadline landing TODAY is still upcoming (same-day boundary)", () => {
  // Morning of the 15th in the viewer's zone; the deadline is the 15th at
  // UTC-midnight — daysUntil is 0, so it stays listed rather than dropping.
  const now = local(2026, 6, 15, 6);
  const ds = [
    { title: "today", date: utc(2026, 6, 15) },
    { title: "tomorrow", date: utc(2026, 6, 16) },
  ];
  assert.deepEqual(titles(upcomingDeadlines(ds, now)), ["today", "tomorrow"]);
});
