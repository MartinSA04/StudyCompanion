import { test } from "node:test";
import assert from "node:assert/strict";
import { progressKey, normalizeProgress } from "../src/lib/progress.ts";

test("progressKey namespaces by course code", () => {
  assert.equal(progressKey("TFY4195"), "sc:progress:TFY4195");
});

/** The rendered nav normalizeProgress migrates/prunes against. */
const nav = [
  { slug: "intro", order: 1 },
  { slug: "bølger", order: 2 },
  { slug: "optikk", order: 3 },
];

test("normalizeProgress keeps valid slugs untouched, not dirty", () => {
  const { slugs, dirty } = normalizeProgress(["intro", "optikk"], nav);
  assert.deepEqual([...slugs].sort(), ["intro", "optikk"]);
  assert.equal(dirty, false);
});

test("normalizeProgress migrates legacy order numbers to slugs (dirty)", () => {
  const { slugs, dirty } = normalizeProgress([1, 3], nav);
  assert.deepEqual([...slugs].sort(), ["intro", "optikk"]);
  assert.equal(dirty, true);
});

test("normalizeProgress migrates a mixed slug + legacy-number record", () => {
  const { slugs, dirty } = normalizeProgress(["intro", 2], nav);
  assert.deepEqual([...slugs].sort(), ["bølger", "intro"]);
  assert.equal(dirty, true);
});

test("normalizeProgress prunes stale slugs and unknown order numbers (dirty)", () => {
  const { slugs, dirty } = normalizeProgress(["intro", "gone", 99], nav);
  assert.deepEqual([...slugs], ["intro"]);
  assert.equal(dirty, true);
});

test("normalizeProgress de-dupes repeated slugs without flagging dirty", () => {
  const { slugs, dirty } = normalizeProgress(["intro", "intro"], nav);
  assert.deepEqual([...slugs], ["intro"]);
  // A duplicate is an entry that contributed nothing new → a rewrite is due.
  assert.equal(dirty, true);
});

test("normalizeProgress resets a corrupt (non-array) record, dirty iff present", () => {
  assert.deepEqual(normalizeProgress({ a: 1 }, nav), {
    slugs: new Set(),
    dirty: true,
  });
  // Nothing stored (null/undefined) is not a corruption to rewrite.
  assert.deepEqual(normalizeProgress(null, nav), {
    slugs: new Set(),
    dirty: false,
  });
});
