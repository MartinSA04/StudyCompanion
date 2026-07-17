import { daysUntil } from "./countdown.ts";

/**
 * The still-ahead slice of the overview agenda: every deadline that has not
 * passed, soonest first. "Upcoming" is the SAME calendar-day rule as the exam
 * countdown — a deadline counts while `daysUntil` is >= 0 — so one landing
 * today stays listed through the whole day instead of dropping at local
 * midnight (see lib/countdown.ts).
 *
 * The build bakes this snapshot in; lib/examCountdown.ts then hides any row
 * that slips past against the viewer's own clock (data-countdown-no-text), so a
 * site built weeks early still trims itself. Generic over the row shape (needs
 * only `date`), and returns a fresh array — the input is neither mutated nor
 * reordered.
 */
export function upcomingDeadlines<T extends { date: Date }>(
  deadlines: readonly T[],
  now: Date = new Date(),
): T[] {
  return deadlines
    .filter((d) => daysUntil(d.date, now) >= 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
