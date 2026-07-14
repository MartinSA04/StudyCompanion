/**
 * Shared display formatting for schema dates. `z.coerce.date` parses the
 * timezone-less `YYYY-MM-DD` values in course.yaml / section frontmatter as
 * UTC midnight, so every formatter must read the date back in UTC too: an
 * Intl.DateTimeFormat left on the machine's zone renders "2026-05-20" as
 * May 19 anywhere west of UTC. One helper with `timeZone` hardcoded, used by
 * every surface that prints a schema date (overview exam card, ExamSummary,
 * ExamList, CourseLayout's "Oppdatert" line) so no call site can forget it.
 */
export function formatDate(
  date: Date,
  language: string,
  style: "full" | "long" | "medium" | "short" = "long",
): string {
  return new Intl.DateTimeFormat(language, {
    dateStyle: style,
    timeZone: "UTC",
  }).format(date);
}
