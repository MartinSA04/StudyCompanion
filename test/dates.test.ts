import { test } from "node:test";
import assert from "node:assert/strict";
import { dateLeaf, formatDate, formatDuration } from "../src/lib/dates.ts";

// Schema dates are UTC midnight (z.coerce.date on "YYYY-MM-DD"); both helpers
// must read them back in UTC so the leaf never shows the previous day west of
// UTC. dateLeaf feeds the overview agenda's almanac leaves: a short month
// WITHOUT Intl's trailing abbreviation dot ("sep", not "sep.") — casing is the
// CSS's job — and the day-of-month as a number.

test("dateLeaf: Norwegian short month drops the trailing dot", () => {
  const leaf = dateLeaf(new Date("2026-09-26"), "nb");
  assert.equal(leaf.month, "sep");
  assert.equal(leaf.day, 26);
});

test("dateLeaf: December ('des.') and a single-digit day", () => {
  const leaf = dateLeaf(new Date("2026-12-04"), "nb");
  assert.equal(leaf.month, "des");
  assert.equal(leaf.day, 4);
});

test("dateLeaf: months without an abbreviation dot pass through ('mai')", () => {
  const leaf = dateLeaf(new Date("2027-05-20"), "nb");
  assert.equal(leaf.month, "mai");
  assert.equal(leaf.day, 20);
});

test("dateLeaf: reads the schema date in UTC (midnight stays its own day)", () => {
  // 2026-01-01T00:00Z is New Year's Eve in every zone west of UTC; the leaf
  // must still say jan 1, mirroring formatDate's timeZone: "UTC" contract.
  const leaf = dateLeaf(new Date("2026-01-01T00:00:00Z"), "nb");
  assert.equal(leaf.day, 1);
  assert.equal(leaf.month, "jan");
});

test("dateLeaf: follows the course language ('en' → 'Sep')", () => {
  const leaf = dateLeaf(new Date("2026-09-26"), "en");
  assert.equal(leaf.month, "Sep");
});

test("formatDate: renders the UTC calendar date regardless of zone", () => {
  assert.equal(
    formatDate(new Date("2026-12-04"), "nb", "long"),
    "4. desember 2026",
  );
});

// formatDuration turns exam.durationMinutes into the Norwegian "4 timer" /
// "1 time" / "3 t 30 min" / "45 min" phrasing shown on the ExamCard fact line.
// Null passes through so a caller can omit the fact entirely.

test("formatDuration: whole hours pluralize (4 → '4 timer')", () => {
  assert.equal(formatDuration(240), "4 timer");
});

test("formatDuration: exactly one hour is singular ('1 time')", () => {
  assert.equal(formatDuration(60), "1 time");
});

test("formatDuration: hours + minutes read 't' + 'min'", () => {
  assert.equal(formatDuration(210), "3 t 30 min");
});

test("formatDuration: sub-hour is bare minutes", () => {
  assert.equal(formatDuration(45), "45 min");
});

test("formatDuration: null passes through so the fact can be omitted", () => {
  assert.equal(formatDuration(null), null);
  assert.equal(formatDuration(undefined), null);
});

test("formatDuration: a non-positive duration is nonsensical → null, not '0 min'", () => {
  // durationMinutes is z.number().optional() — an errant 0 (or negative) must
  // drop the Varighet fact rather than print a meaningless "0 min".
  assert.equal(formatDuration(0), null);
  assert.equal(formatDuration(-30), null);
});
