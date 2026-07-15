import { test } from "node:test";
import assert from "node:assert/strict";
import {
  progressKey,
  normalizeProgress,
  readProgress,
  writeProgress,
} from "../src/lib/progress.ts";

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

/**
 * readProgress/writeProgress wrap normalizeProgress with the storage + DOM I/O
 * both the layout and the overview share. node:test has no DOM or localStorage,
 * but the helpers only read `<body data-progress-key>`, `[data-nav-slug]` links
 * and the localStorage global, so plain stand-ins exercise them fully (same
 * approach as filterList.test.ts).
 */
function fakeDoc(
  key: string | undefined,
  navRows: { slug: string; order: number }[] = nav,
): Document {
  return {
    body: { dataset: key === undefined ? {} : { progressKey: key } },
    querySelectorAll: () =>
      navRows.map((n) => ({
        dataset: { navSlug: n.slug, navOrder: String(n.order) },
      })),
  } as unknown as Document;
}

/** Map-backed localStorage stand-in; `throwOn` forces a private-mode failure. */
function installStorage(
  initial: Record<string, string> = {},
  throwOn?: "getItem" | "setItem",
) {
  const map = new Map(Object.entries(initial));
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem(k: string) {
      if (throwOn === "getItem") throw new Error("blocked");
      return map.has(k) ? map.get(k)! : null;
    },
    setItem(k: string, v: string) {
      if (throwOn === "setItem") throw new Error("blocked");
      map.set(k, v);
    },
  };
  return map;
}

const KEY = progressKey("TFY4195");

test("readProgress migrates a legacy record and rewrites storage once", () => {
  const store = installStorage({ [KEY]: JSON.stringify([1, 3]) });
  const done = readProgress(fakeDoc(KEY));
  assert.deepEqual([...done].sort(), ["intro", "optikk"]);
  // The dirty migration is persisted as slugs, once.
  assert.equal(store.get(KEY), JSON.stringify(["intro", "optikk"]));
});

test("readProgress leaves a clean record intact", () => {
  const store = installStorage({ [KEY]: JSON.stringify(["intro"]) });
  const done = readProgress(fakeDoc(KEY));
  assert.deepEqual([...done], ["intro"]);
  assert.equal(store.get(KEY), JSON.stringify(["intro"]));
});

test("readProgress returns an empty set when the body carries no key", () => {
  installStorage({ [KEY]: JSON.stringify(["intro"]) });
  assert.deepEqual([...readProgress(fakeDoc(undefined))], []);
});

test("readProgress falls back to an empty set on unreadable storage", () => {
  // Unparseable value and a throwing getItem both degrade to null → empty.
  installStorage({ [KEY]: "{" });
  assert.deepEqual([...readProgress(fakeDoc(KEY))], []);
  installStorage({}, "getItem");
  assert.deepEqual([...readProgress(fakeDoc(KEY))], []);
});

test("writeProgress persists the set under the body key", () => {
  const store = installStorage();
  writeProgress(fakeDoc(KEY), new Set(["intro", "optikk"]));
  assert.equal(store.get(KEY), JSON.stringify(["intro", "optikk"]));
});

test("writeProgress no-ops without a key and swallows a storage error", () => {
  const store = installStorage();
  writeProgress(fakeDoc(undefined), new Set(["intro"]));
  assert.equal(store.size, 0);
  // A blocked setItem (private mode) must not throw.
  installStorage({}, "setItem");
  assert.doesNotThrow(() => writeProgress(fakeDoc(KEY), new Set(["intro"])));
});
