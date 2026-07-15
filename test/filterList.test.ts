import { test } from "node:test";
import assert from "node:assert/strict";
import { filterList, type FilterList } from "../src/lib/filterList.ts";

/**
 * `filterList` is the shared client kernel behind <Glossary> and <FormulaSheet>:
 * toggle each row's `hidden` from a predicate, collapse any group whose rows are
 * all hidden, flip the empty-state element, and report the visible count.
 * node:test has no DOM, but the helper only ever reads `.hidden` and calls a
 * group's `.querySelectorAll`, so plain stand-ins exercise it fully.
 */
type FakeRow = { hidden: boolean; text: string };
type FakeGroup = { hidden: boolean; querySelectorAll(): FakeRow[] };

function setup() {
  const g1: FakeRow[] = [
    { hidden: false, text: "alpha" },
    { hidden: false, text: "beta" },
  ];
  const g2: FakeRow[] = [{ hidden: false, text: "gamma" }];
  const groups: FakeGroup[] = [
    { hidden: false, querySelectorAll: () => g1 },
    { hidden: false, querySelectorAll: () => g2 },
  ];
  const empty = { hidden: false };
  return { rows: [...g1, ...g2], groups, empty, g1, g2 };
}

function run(
  env: ReturnType<typeof setup>,
  predicate: (r: FakeRow) => boolean,
): number {
  return filterList({
    rows: env.rows,
    groups: env.groups,
    rowSelector: ".row",
    empty: env.empty,
    predicate,
  } as unknown as FilterList);
}

test("filterList: no predicate matches → every row hidden, empty shown", () => {
  const env = setup();
  const visible = run(env, () => false);
  assert.equal(visible, 0);
  assert.ok(env.rows.every((r) => r.hidden));
  assert.ok(env.groups.every((g) => g.hidden));
  assert.equal(env.empty.hidden, false);
});

test("filterList: all match → nothing hidden, empty stays hidden", () => {
  const env = setup();
  const visible = run(env, () => true);
  assert.equal(visible, 3);
  assert.ok(env.rows.every((r) => !r.hidden));
  assert.ok(env.groups.every((g) => !g.hidden));
  assert.equal(env.empty.hidden, true);
});

test("filterList: a group with no visible rows collapses; others stay open", () => {
  const env = setup();
  const visible = run(env, (r) => r.text === "alpha");
  assert.equal(visible, 1);
  assert.equal(env.g1[0].hidden, false);
  assert.equal(env.g1[1].hidden, true);
  assert.equal(env.groups[0].hidden, false); // still has one match
  assert.equal(env.groups[1].hidden, true); // gamma filtered out
  assert.equal(env.empty.hidden, true);
});

test("filterList: null empty is tolerated", () => {
  const env = setup();
  const visible = filterList({
    rows: env.rows,
    groups: env.groups,
    rowSelector: ".row",
    empty: null,
    predicate: () => true,
  } as unknown as FilterList);
  assert.equal(visible, 3);
});
