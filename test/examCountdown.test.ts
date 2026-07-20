import { test } from "node:test";
import assert from "node:assert/strict";
import {
  refreshExamCountdowns,
  refreshDeadlineNext,
} from "../src/lib/examCountdown.ts";
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

/**
 * `refreshDeadlineNext` owns the agenda's next-marker: after the hide-pass
 * above has hidden past rows, the first VISIBLE row in each
 * [data-deadline-list] carries data-next (the enlarged leaf) and shows its
 * countdown pill; every other row loses both. Same stand-in approach — the
 * helper only reads `.hidden`, toggles `.dataset.next`/pill `.hidden`, and
 * queries rows/pills by attribute.
 */
type FakePill = { hidden: boolean };
type FakeRow = {
  dataset: { next?: string };
  hidden: boolean;
  querySelector(sel: string): FakePill | null;
};
type FakeList = { querySelectorAll(sel: string): FakeRow[] };

function makeRow(opts: { hidden?: boolean; next?: boolean } = {}): FakeRow & {
  pill: FakePill;
} {
  const pill: FakePill = { hidden: !opts.next };
  return {
    dataset: opts.next ? { next: "" } : {},
    hidden: opts.hidden ?? false,
    querySelector: () => pill,
    pill,
  };
}

function fakeListDoc(lists: FakeRow[][]): Document {
  const wrapped: FakeList[] = lists.map((rows) => ({
    querySelectorAll: () => rows,
  }));
  return { querySelectorAll: () => wrapped } as unknown as Document;
}

test("refreshDeadlineNext: the SSR state (row 1 next, pill shown) is kept when row 1 is visible", () => {
  const rows = [makeRow({ next: true }), makeRow(), makeRow()];
  refreshDeadlineNext(fakeListDoc([rows]));
  assert.equal(rows[0].dataset.next, "");
  assert.equal(rows[0].pill.hidden, false);
  assert.equal(rows[1].dataset.next, undefined);
  assert.equal(rows[1].pill.hidden, true);
  assert.equal(rows[2].dataset.next, undefined);
  assert.equal(rows[2].pill.hidden, true);
});

test("refreshDeadlineNext: a hidden first row hands next + pill to the second", () => {
  const rows = [makeRow({ next: true, hidden: true }), makeRow(), makeRow()];
  refreshDeadlineNext(fakeListDoc([rows]));
  assert.equal(rows[0].dataset.next, undefined);
  assert.equal(rows[0].pill.hidden, true);
  assert.equal(rows[1].dataset.next, "");
  assert.equal(rows[1].pill.hidden, false);
  assert.equal(rows[2].dataset.next, undefined);
  assert.equal(rows[2].pill.hidden, true);
});

test("refreshDeadlineNext: all rows hidden leaves no next-marker at all", () => {
  const rows = [
    makeRow({ next: true, hidden: true }),
    makeRow({ hidden: true }),
  ];
  refreshDeadlineNext(fakeListDoc([rows]));
  assert.equal(rows[0].dataset.next, undefined);
  assert.equal(rows[0].pill.hidden, true);
  assert.equal(rows[1].dataset.next, undefined);
  assert.equal(rows[1].pill.hidden, true);
});

test("refreshDeadlineNext: lists are independent — each keeps its own next", () => {
  const a = [makeRow({ next: true, hidden: true }), makeRow()];
  const b = [makeRow({ next: true }), makeRow()];
  refreshDeadlineNext(fakeListDoc([a, b]));
  assert.equal(a[1].dataset.next, "");
  assert.equal(a[1].pill.hidden, false);
  assert.equal(b[0].dataset.next, "");
  assert.equal(b[0].pill.hidden, false);
});

test("refreshDeadlineNext: a row without a pill is still markable", () => {
  const bare: FakeRow = {
    dataset: {},
    hidden: false,
    querySelector: () => null,
  };
  refreshDeadlineNext(fakeListDoc([[bare]]));
  assert.equal(bare.dataset.next, "");
});
