import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../src/lib/slug.ts";

test("slugify lowercases and hyphenates whitespace + punctuation", () => {
  assert.equal(slugify("Snells lov"), "snells-lov");
  assert.equal(slugify("Huygens' prinsipp"), "huygens-prinsipp");
  assert.equal(slugify("virtuelt bilde"), "virtuelt-bilde");
});

test("slugify maps Norwegian æ/ø/å to ascii", () => {
  assert.equal(slugify("Bølge"), "bolge");
  assert.equal(slugify("Påske"), "paske");
  assert.equal(slugify("Lærebok"), "laerebok");
});

test("slugify strips $math$ and inline HTML before slugging", () => {
  assert.equal(slugify("Energi $E=mc^2$"), "energi");
  assert.equal(slugify("<b>Snells</b> lov"), "snells-lov");
});

test("slugify trims leading/trailing separators", () => {
  assert.equal(slugify("  Reelt bilde!  "), "reelt-bilde");
  assert.equal(slugify("— interlude —"), "interlude");
});
