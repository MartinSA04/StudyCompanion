/**
 * Shared display formatting for schema dates. `z.coerce.date` parses the
 * timezone-less `YYYY-MM-DD` values in course.yaml / section frontmatter as
 * UTC midnight, so every formatter must read the date back in UTC too: an
 * Intl.DateTimeFormat left on the machine's zone renders "2026-05-20" as
 * May 19 anywhere west of UTC. One helper with `timeZone` hardcoded, used by
 * every surface that prints a schema date (ExamCard, the deadline agenda,
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

/**
 * The overview agenda's almanac leaf: a short month name with Intl's trailing
 * abbreviation dot stripped ("sep.", "des." → "sep", "des" — the leaf's CSS
 * owns casing) over the day-of-month. Read in UTC like formatDate above, so
 * the leaf never shows the previous day west of UTC. Years are deliberately
 * absent: the agenda is semester-scoped, and the maintainer struck them.
 */
export function dateLeaf(
  date: Date,
  language: string,
): { month: string; day: number } {
  const month = new Intl.DateTimeFormat(language, {
    month: "short",
    timeZone: "UTC",
  })
    .format(date)
    .replace(/\.$/, "");
  return { month, day: date.getUTCDate() };
}

/**
 * `exam.durationMinutes` → the Norwegian phrase shown on the ExamCard fact
 * line: whole hours pluralize ("1 time" / "4 timer"), an hours+minutes value
 * abbreviates ("3 t 30 min"), and a sub-hour value is bare minutes ("45 min").
 * `null`/`undefined` — and a nonsensical non-positive value — pass through as
 * `null` so a caller can drop the fact entirely rather than print "0 min".
 */
export function formatDuration(
  minutes: number | null | undefined,
): string | null {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  if (h && min) return `${h} t ${min} min`;
  if (h) return `${h} ${h === 1 ? "time" : "timer"}`;
  return `${min} min`;
}
