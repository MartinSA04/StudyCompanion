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
 * Contract, shared by every countdown surface (ExamCard on both flater + the
 * deadline agenda's rows and pills):
 * - `data-exam-countdown` — the date as an ISO string; marks the carrier.
 *   `data-past` is kept in sync on it (ExamCard's muted "avholdt" style).
 * - `data-countdown-text` — optional child that receives the phrase, so
 *   surrounding chrome survives the rewrite; without it the phrase replaces
 *   the element's own text (the exam and deadline pills are bare carriers).
 * - `data-countdown-hide-past` — hide the element entirely once the date is
 *   past instead of relabeling (the deadline agenda's rows).
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

/**
 * The agenda's next-marker. Every [data-deadline-row] SSRs its own countdown
 * pill ([data-deadline-pill], hidden on all but the first row) and the first
 * row is stamped data-next (the enlarged leaf) at build. Once the hide-pass
 * above has hidden rows whose dates slipped past the viewer's clock, this
 * re-derives that state: within each [data-deadline-list], the first VISIBLE
 * row carries data-next and shows its pill; every other row loses both. Run it
 * AFTER refreshExamCountdowns — it reads the `hidden` flags that pass writes.
 */
export function refreshDeadlineNext(doc: Document = document): void {
  for (const list of doc.querySelectorAll<HTMLElement>(
    "[data-deadline-list]",
  )) {
    let nextFound = false;
    for (const row of list.querySelectorAll<HTMLElement>(
      "[data-deadline-row]",
    )) {
      const isNext = !nextFound && !row.hidden;
      if (isNext) {
        nextFound = true;
        row.dataset.next = "";
      } else {
        delete row.dataset.next;
      }
      const pill = row.querySelector<HTMLElement>("[data-deadline-pill]");
      if (pill) pill.hidden = !isNext;
    }
  }
}
