import { test } from "node:test";
import assert from "node:assert/strict";
import { refreshExamCountdowns } from "../src/lib/examCountdown.ts";
import {
  daysUntil,
  formatExamCountdown,
  EXAM_PAST_LABEL,
} from "../src/lib/countdown.ts";

/**
 * `refreshExamCountdowns` walks `[data-exam-countdown]` pills and rewrites the
 * SSR-baked phrase against the viewer's clock. node:test has no DOM, but the
 * helper only reads `.dataset`, flips `.hidden`, and calls `.querySelector` +
 * `.textContent` on the pill (and its optional `[data-countdown-text]` child),
 * so plain stand-ins exercise it fully (same approach as filterList.test.ts).
 */
type FakeTarget = { textContent: string };
type FakeEl = {
  dataset: {
    examCountdown?: string;
    past?: string;
    countdownHidePast?: string;
    countdownNoText?: string;
  };
  hidden: boolean;
  textContent: string;
  querySelector(sel: string): FakeTarget | null;
};

/** ISO for a date `days` calendar days from today, in the viewer's own zone. */
function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function makeEl(
  iso: string,
  opts: { hidePast?: boolean; noText?: boolean; child?: FakeTarget } = {},
): FakeEl {
  const dataset: FakeEl["dataset"] = { examCountdown: iso };
  if (opts.hidePast) dataset.countdownHidePast = "";
  if (opts.noText) dataset.countdownNoText = "";
  return {
    dataset,
    hidden: false,
    textContent: "",
    querySelector: () => opts.child ?? null,
  };
}

function fakeDoc(els: FakeEl[]): Document {
  return {
    querySelectorAll: () => els,
  } as unknown as Document;
}

test("refreshExamCountdowns: a future exam gets the phrase and data-past='false'", () => {
  const iso = isoInDays(5);
  const el = makeEl(iso);
  refreshExamCountdowns(fakeDoc([el]));
  assert.equal(el.dataset.past, "false");
  assert.equal(el.textContent, formatExamCountdown(daysUntil(new Date(iso))));
});

test("refreshExamCountdowns: a past exam with hide-past is hidden, not relabeled", () => {
  const el = makeEl(isoInDays(-3), { hidePast: true });
  refreshExamCountdowns(fakeDoc([el]));
  assert.equal(el.dataset.past, "true");
  assert.equal(el.hidden, true);
  // Hidden — its text is left untouched rather than relabeled.
  assert.equal(el.textContent, "");
});

test("refreshExamCountdowns: a past exam without hide-past gets EXAM_PAST_LABEL", () => {
  const el = makeEl(isoInDays(-3));
  refreshExamCountdowns(fakeDoc([el]));
  assert.equal(el.dataset.past, "true");
  assert.equal(el.hidden, false);
  assert.equal(el.textContent, EXAM_PAST_LABEL);
});

test("refreshExamCountdowns: a [data-countdown-text] child receives the phrase, chrome survives", () => {
  const iso = isoInDays(2);
  const child: FakeTarget = { textContent: "om 9 dager" };
  const el = makeEl(iso, { child });
  el.textContent = "Eksamen — om 9 dager"; // surrounding chrome + separator
  refreshExamCountdowns(fakeDoc([el]));
  assert.equal(
    child.textContent,
    formatExamCountdown(daysUntil(new Date(iso))),
  );
  // The pill's own text (the " — " chrome) is left intact.
  assert.equal(el.textContent, "Eksamen — om 9 dager");
});

test("refreshExamCountdowns: without the child the pill's own text is set", () => {
  const iso = isoInDays(1);
  const el = makeEl(iso);
  refreshExamCountdowns(fakeDoc([el]));
  assert.equal(el.textContent, formatExamCountdown(daysUntil(new Date(iso))));
});

test("refreshExamCountdowns: a no-text row syncs data-past but never writes a phrase", () => {
  // The deadline agenda's rows carry a date only to auto-hide once past; their
  // SSR text is verbatim content, so a still-future row is left untouched.
  const el = makeEl(isoInDays(5), { hidePast: true, noText: true });
  refreshExamCountdowns(fakeDoc([el]));
  assert.equal(el.dataset.past, "false");
  assert.equal(el.hidden, false);
  assert.equal(el.textContent, "");
});

test("refreshExamCountdowns: a past no-text row hides without a relabel", () => {
  const el = makeEl(isoInDays(-2), { hidePast: true, noText: true });
  refreshExamCountdowns(fakeDoc([el]));
  assert.equal(el.dataset.past, "true");
  assert.equal(el.hidden, true);
  assert.equal(el.textContent, "");
});

test("refreshExamCountdowns: an unparseable date is skipped", () => {
  const el = makeEl("not-a-date");
  refreshExamCountdowns(fakeDoc([el]));
  assert.equal(el.dataset.past, undefined);
  assert.equal(el.textContent, "");
});
