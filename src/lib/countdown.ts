/**
 * Norwegian exam-countdown phrase for a non-negative days-until-exam count.
 * Shared by the overview exam card (index.astro) and ExamSummary so the two
 * surfaces can't diverge on wording: 0 → "i dag", 1 → "i morgen", n → "om N
 * dager". A past exam (negative days) is each caller's own concern — the
 * overview only renders this branch when `days >= 0`, and ExamSummary keeps
 * its separate "avholdt" case.
 */
export function formatExamCountdown(days: number): string {
  if (days === 0) return "i dag";
  if (days === 1) return "i morgen";
  return `om ${days} dager`;
}
