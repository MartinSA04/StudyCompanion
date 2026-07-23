import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  formatExamCountdown,
  EXAM_PAST_LABEL,
} from "../src/lib/countdown.ts";
import { formatDate } from "../src/lib/dates.ts";

/**
 * `daysUntil` counts CALENDAR days (exam Y/M/D in UTC vs. now's Y/M/D in the
 * viewer's zone), so it stays "i dag" through exam morning rather than flipping
 * to "i morgen" just past local midnight. Schema dates are UTC-midnight, hence
 * `utc()` for them — but `now` is read in the viewer's own zone, hence
 * `local()`, keeping these assertions true in any process timezone.
 */
const utc = (y: number, m: number, d: number, h = 0) =>
  new Date(Date.UTC(y, m - 1, d, h));
const local = (y: number, m: number, d: number, h = 0) =>
  new Date(y, m - 1, d, h);

test("daysUntil: same calendar day → 0", () => {
  assert.equal(daysUntil(utc(2026, 6, 15), local(2026, 6, 15, 6)), 0);
});

test("daysUntil: the next calendar day → 1", () => {
  assert.equal(daysUntil(utc(2026, 6, 16), local(2026, 6, 15, 23)), 1);
});

test("daysUntil: a past exam is negative", () => {
  assert.equal(daysUntil(utc(2026, 6, 14), local(2026, 6, 15)), -1);
});

test("daysUntil spans a week correctly", () => {
  assert.equal(daysUntil(utc(2026, 6, 22), local(2026, 6, 15)), 7);
});

test("formatExamCountdown phrases the 0/1/n boundaries", () => {
  assert.equal(formatExamCountdown(0), "i dag");
  assert.equal(formatExamCountdown(1), "i morgen");
  assert.equal(formatExamCountdown(5), "om 5 dager");
  assert.equal(EXAM_PAST_LABEL, "avholdt");
});

/**
 * `formatDate` pins timeZone:"UTC", so a bare `YYYY-MM-DD` (parsed as UTC
 * midnight) prints the SAME calendar day regardless of the process zone. TZ is
 * read by Intl at call time; set it here to prove the helper doesn't drift west
 * of UTC.
 */
test("formatDate renders a bare date in UTC regardless of process TZ", () => {
  const date = new Date("2026-06-15"); // UTC midnight
  const original = process.env.TZ;
  try {
    process.env.TZ = "America/New_York"; // UTC-4/5 — would show June 14 on local zone
    assert.equal(formatDate(date, "nb"), "15. juni 2026");
    process.env.TZ = "Asia/Tokyo"; // UTC+9
    assert.equal(formatDate(date, "nb"), "15. juni 2026");
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("formatDate honours the language + style arguments", () => {
  const date = new Date("2026-06-15");
  assert.match(formatDate(date, "en", "long"), /June 15, 2026/);
});
