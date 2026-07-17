import {
  daysUntil,
  formatExamCountdown,
  EXAM_PAST_LABEL,
} from "./countdown.ts";

/**
 * Client refresh for the SSR exam-countdown pills. The build bakes "om N
 * dager" in at build TIME, so a site built a week before the exam would still
 * claim seven days on exam morning; this recomputes the phrase against the
 * viewer's clock on every page (re)load. Progressive enhancement: the SSR
 * string stays for no-JS readers and is only ever rewritten, never created.
 *
 * Contract, shared by both exam surfaces (overview card + ExamSummary):
 * - `data-exam-countdown` — the exam date as an ISO string; marks the pill.
 *   `data-past` is kept in sync on it (ExamSummary's muted past style).
 * - `data-countdown-text` — optional child that receives the phrase, so
 *   surrounding chrome (the overview's " — " separator) survives the rewrite;
 *   without it the phrase replaces the element's own text.
 * - `data-countdown-hide-past` — hide the element entirely once the exam is
 *   past instead of relabeling (the overview shows no "avholdt" note).
 * - `data-countdown-no-text` — sync `data-past`/`hidden` only, never rewrite
 *   the phrase. For rows (the deadline agenda) that carry a date purely to
 *   auto-hide once past; their SSR text is verbatim content, not a countdown.
 */
export function refreshExamCountdowns(doc: Document = document): void {
  for (const el of doc.querySelectorAll<HTMLElement>("[data-exam-countdown]")) {
    const date = new Date(el.dataset.examCountdown!);
    if (Number.isNaN(date.getTime())) continue;
    const days = daysUntil(date);
    const past = days < 0;
    el.dataset.past = String(past);
    if (el.dataset.countdownHidePast != null) {
      el.hidden = past;
      if (past) continue; // hidden — no text left to maintain
    }
    // Rows that carry a date only to auto-hide when past keep their SSR text
    // verbatim; data-past/hidden are synced above, but no phrase is written.
    if (el.dataset.countdownNoText != null) continue;
    const target = el.querySelector<HTMLElement>("[data-countdown-text]") ?? el;
    target.textContent = past ? EXAM_PAST_LABEL : formatExamCountdown(days);
  }
}
