import { test } from "node:test";
import assert from "node:assert/strict";
import { findDuplicateIds } from "../src/lib/pageIds.ts";

/**
 * The astro:build:done scan fails the build on a duplicate id: two elements
 * sharing an anchor make a #link land on the first. The usual culprit is a
 * <Statement> named like a heading on its page.
 */

test("a Statement sharing a heading's id is reported with both elements", () => {
  const html =
    '<h2 id="braggs-lov">Braggs lov</h2><p>…</p>' +
    '<aside class="statement statement-law" id="braggs-lov" role="note">…</aside>';
  assert.deepEqual(findDuplicateIds(html), [
    {
      id: "braggs-lov",
      elements: ["<h2>", '<aside class="statement statement-law">'],
    },
  ]);
});

test("unique ids, data-id attributes and script bodies are not duplicates", () => {
  const html =
    '<h2 id="a">A</h2><aside class="statement" id="a-lov">…</aside>' +
    '<div data-id="a"></div><!-- <p id="a"> -->' +
    "<script>el.innerHTML = '<p id=\"a\"></p>';</script>";
  assert.deepEqual(findDuplicateIds(html), []);
});
