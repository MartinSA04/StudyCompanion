import { test } from "node:test";
import assert from "node:assert/strict";
import {
  progressKey,
  normalizeProgress,
  readProgress,
  writeProgress,
  paintOverview,
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

/**
 * Overview stand-in: paintOverview reads `[data-tile-slug]` tiles (each with a
 * `[data-done-sr]` companion), the `[data-hero-progress-row]` / its
 * `[data-progress-done]`, the `[data-hero-continue]` pill, and — via
 * readProgress — `[data-nav-slug]` links off the same document. `navSlugs` can
 * be a superset of the tiles so a stored slug survives pruning without being a
 * rendered tile (exercises the intersection count). Returns the DOM handles so
 * assertions can read what the paint mutated.
 */
function overviewDoc(
  tileSlugs: string[],
  {
    key = KEY,
    navSlugs = tileSlugs,
  }: { key?: string; navSlugs?: string[] } = {},
) {
  const tiles = tileSlugs.map((slug) => {
    const classes = new Set<string>();
    const sr = { textContent: "" };
    return {
      dataset: { tileSlug: slug },
      href: `/${slug}/`,
      sr,
      classList: {
        toggle(c: string, on: boolean) {
          if (on) classes.add(c);
          else classes.delete(c);
        },
        contains: (c: string) => classes.has(c),
      },
      querySelector: (s: string) => (s === "[data-done-sr]" ? sr : null),
    };
  });
  const progressDone = { textContent: "" };
  const heroRow = {
    hidden: true,
    querySelector: (s: string) =>
      s === "[data-progress-done]" ? progressDone : null,
  };
  const continueLink = { hidden: false, href: "" };
  const doc = {
    body: { dataset: key === undefined ? {} : { progressKey: key } },
    querySelectorAll: (s: string) =>
      s === "[data-tile-slug]"
        ? tiles
        : s === "[data-nav-slug]"
          ? navSlugs.map((slug, i) => ({
              dataset: { navSlug: slug, navOrder: String(i + 1) },
            }))
          : [],
    querySelector: (s: string) =>
      s === "[data-hero-progress-row]"
        ? heroRow
        : s === "[data-hero-continue]"
          ? continueLink
          : null,
  } as unknown as Document;
  return { doc, tiles, heroRow, progressDone, continueLink };
}

test("paintOverview counts stored∩rendered tiles, not stale stored slugs", () => {
  // "ekstra" is in the nav (survives readProgress pruning) but is not a tile,
  // so it must not inflate the count past the rendered tiles ("N av M").
  installStorage({ [KEY]: JSON.stringify(["intro", "ekstra"]) });
  const { doc, progressDone, heroRow } = overviewDoc(
    ["intro", "bølger", "optikk"],
    { navSlugs: ["intro", "bølger", "optikk", "ekstra"] },
  );
  paintOverview(doc);
  assert.equal(progressDone.textContent, "1");
  assert.equal(heroRow.hidden, false);
});

test("paintOverview leaves the hero row hidden when nothing is done", () => {
  installStorage();
  const { doc, heroRow } = overviewDoc(["intro", "bølger"]);
  paintOverview(doc);
  assert.equal(heroRow.hidden, true);
});

test("paintOverview points the continue pill at the first not-done tile", () => {
  installStorage({ [KEY]: JSON.stringify(["intro"]) });
  const { doc, continueLink } = overviewDoc(["intro", "bølger", "optikk"]);
  paintOverview(doc);
  assert.equal(continueLink.href, "/bølger/");
  assert.equal(continueLink.hidden, false);
});

test("paintOverview hides the continue pill when every tile is done", () => {
  const slugs = ["intro", "bølger", "optikk"];
  installStorage({ [KEY]: JSON.stringify(slugs) });
  const { doc, continueLink, progressDone } = overviewDoc(slugs);
  paintOverview(doc);
  assert.equal(progressDone.textContent, "3");
  assert.equal(continueLink.hidden, true);
});

test("paintOverview tracks each tile's sr-only text against its .done class", () => {
  installStorage({ [KEY]: JSON.stringify(["intro"]) });
  const { doc, tiles } = overviewDoc(["intro", "bølger"]);
  paintOverview(doc);
  assert.equal(tiles[0].sr.textContent, ", fullført");
  assert.equal(tiles[0].classList.contains("done"), true);
  assert.equal(tiles[1].sr.textContent, "");
  assert.equal(tiles[1].classList.contains("done"), false);
});
