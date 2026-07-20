/**
 * Norwegian exam-countdown phrase for a non-negative days-until-exam count.
 * Shared by ExamCard (both flater), the deadline agenda and the client
 * refresh script (lib/examCountdown.ts) so the surfaces can't diverge on
 * wording: 0 → "i dag", 1 → "i morgen", n → "om N dager". A past exam
 * (negative days) is each caller's own concern — ExamCard swaps to
 * EXAM_PAST_LABEL on both flater; the deadline agenda hides passed rows.
 */
export function formatExamCountdown(days: number): string {
  if (days === 0) return "i dag";
  if (days === 1) return "i morgen";
  return `om ${days} dager`;
}

/** ExamCard's past-exam pill text, shared with the client refresh script. */
export const EXAM_PAST_LABEL = "avholdt";

/**
 * CALENDAR days from `now` to `date` (negative once past). The exam's Y/M/D is
 * read in UTC — schema dates are timezone-less `YYYY-MM-DD` values, which
 * `z.coerce.date` parses as UTC midnight — and `now`'s Y/M/D in the viewer's
 * own zone; the two are diffed via Date.UTC so a DST transition in between
 * can't skew the count. A UTC-24h-bucket `Math.ceil((date - now) / 86_400_000)`
 * would still say "i morgen" at 00:30 local time on exam morning; whole-day
 * arithmetic says "i dag".
 */
export function daysUntil(date: Date, now = new Date()): number {
  const exam = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((exam - today) / 86_400_000);
}
