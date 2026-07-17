import { test } from "node:test";
import assert from "node:assert/strict";
import { groupBySection } from "../src/lib/groupBySection.ts";

/**
 * `groupBySection` is the server-side grouping behind <FormulaSheet> (and the
 * shape <Glossary> builds inline): section-less entries collapse into one
 * trailing group so labelled sections are never interrupted, which is also what
 * keeps the widgets' `String(i + 1)` heading numbers contiguous.
 */
type Entry = { id: string; section?: string };
const sections = (gs: { section: string; items: Entry[] }[]) =>
  gs.map((g) => g.section);
const ids = (gs: { section: string; items: Entry[] }[]) =>
  gs.map((g) => g.items.map((e) => e.id));

test("groupBySection: all sectioned → sections in first-seen order", () => {
  const groups = groupBySection(
    [
      { id: "a", section: "One" },
      { id: "b", section: "Two" },
      { id: "c", section: "One" },
    ],
    "Other",
  );
  assert.deepEqual(sections(groups), ["One", "Two"]);
  assert.deepEqual(ids(groups), [["a", "c"], ["b"]]);
});

test("groupBySection: all section-less → one unlabelled group (no heading manufactured)", () => {
  const groups = groupBySection<Entry>([{ id: "a" }, { id: "b" }], "Other");
  assert.deepEqual(sections(groups), [""]);
  assert.deepEqual(ids(groups), [["a", "b"]]);
});

test("groupBySection: a mix places the section-less bucket LAST under otherLabel", () => {
  // The regression: a section-less entry that appears BEFORE a labelled one
  // used to render as a headless card mid-list and eat a heading number. It is
  // now collected into the trailing labelled group instead.
  const groups = groupBySection(
    [
      { id: "loose1" },
      { id: "a", section: "One" },
      { id: "loose2" },
      { id: "b", section: "Two" },
    ],
    "Other",
  );
  assert.deepEqual(sections(groups), ["One", "Two", "Other"]);
  assert.deepEqual(ids(groups), [["a"], ["b"], ["loose1", "loose2"]]);
});

test("groupBySection: numbered headings stay contiguous (no skipped number)", () => {
  // Every returned group except a lone `section: ""` at index 0 carries a
  // heading, so `String(i + 1)` never skips a number.
  const groups = groupBySection(
    [{ id: "loose" }, { id: "a", section: "One" }],
    "Other",
  );
  const numbered = groups
    .map((g, i) => ({ n: i + 1, section: g.section }))
    .filter((g) => g.section);
  assert.deepEqual(
    numbered.map((g) => g.n),
    [1, 2],
  );
});

test("groupBySection: empty input → single empty unlabelled group", () => {
  const groups = groupBySection<Entry>([], "Other");
  assert.deepEqual(sections(groups), [""]);
  assert.deepEqual(ids(groups), [[]]);
});
