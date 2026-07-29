import { test } from "node:test";
import assert from "node:assert/strict";
import {
  faviconDataUri,
  tileSvg,
  ogCardSvg,
  MARK_HALF_DIAGONAL,
  MASKABLE_SAFE_RADIUS,
  OG_WIDTH,
  OG_HEIGHT,
} from "../src/lib/favicon.ts";

const PREFIX = "data:image/svg+xml,";
const decode = (uri: string) => decodeURIComponent(uri.slice(PREFIX.length));

test("faviconDataUri builds a data:image/svg+xml URI of the >_ mark", () => {
  const uri = faviconDataUri("#205ea6");
  assert.ok(uri.startsWith(PREFIX), "should be an inline SVG data URI");
  const svg = decode(uri);
  assert.match(svg, /<svg[\s>]/);
  assert.match(svg, /role="img"/); // keeps the accessible label
});

test("faviconDataUri escapes '#' so colors can't be read as a URL fragment", () => {
  const payload = faviconDataUri("#205ea6").slice(PREFIX.length);
  assert.ok(!payload.includes("#"), "every '#' must be percent-encoded");
  assert.ok(payload.includes("%23"), "escaped hashes should be present");
});

test("faviconDataUri accepts non-hex CSS colors verbatim", () => {
  const svg = decode(faviconDataUri("rgb(255 0 0)"));
  assert.ok(svg.includes("rgb(255 0 0)"));
});

test("the accent is the tile's ground, not a hairline on a dark one", () => {
  const svg = tileSvg("#205ea6", "bleed");
  assert.match(
    svg,
    /<rect width="64" height="64" fill="#205ea6"\/>/,
    "the accent should fill the tile",
  );
  // No literal near-black anywhere: the pre-v4.1 tile hard-coded a cool
  // #0b0e14 ground, which DESIGN.md's warm-neutral rule forbids.
  assert.ok(
    !/#0b0e14/i.test(svg),
    "the cool near-black ground must not come back",
  );
});

test("the mark takes whichever ink reads on the accent", () => {
  // contrastText picks white on a dark accent and near-black on a pale one, so a
  // course choosing a pale accent can't end up with an invisible white mark.
  assert.ok(tileSvg("#205ea6", "bleed").includes("#ffffff"));
  assert.ok(tileSvg("#ffe7ce", "bleed").includes("#100f0f"));
});

/**
 * The defect this replaces: the old artwork's frame ran to 6.25% of the tile, so
 * its corners sat at 62% radius against a 40% limit and Android clipped them.
 */
test("the mark stays inside the maskable safe circle", () => {
  assert.ok(
    MARK_HALF_DIAGONAL < MASKABLE_SAFE_RADIUS,
    `mark reaches ${MARK_HALF_DIAGONAL.toFixed(2)} of the ${MASKABLE_SAFE_RADIUS} safe radius`,
  );
});

/**
 * The other defect: `bleed` is what iOS and Android mask, so it must cover the
 * canvas and bake in NO radius of its own. A margin here is what made the tile
 * read as over-zoomed, the iOS squircle cutting inside the artwork's own corners.
 */
test("the bleed variant covers the canvas with no baked radius", () => {
  const svg = tileSvg("#205ea6", "bleed");
  assert.match(svg, /width="64" height="64"/);
  // The GROUND rect only — the underscore glyph legitimately carries its own
  // rx="2", so matching every rx in the document would never fail meaningfully.
  const ground = /<rect[^>]*\/>/.exec(svg)![0];
  assert.ok(
    !/\brx=/.test(ground),
    `the masked variant must not round its own ground: ${ground}`,
  );
});

test("the rounded variant keeps a transparent margin and its own corners", () => {
  // Manifest `any` icons and browser tabs are shown UNMASKED, so this one owns
  // its radius and must not bleed to the edge.
  const svg = tileSvg("#205ea6", "rounded");
  assert.match(svg, /<rect x="2" y="2" width="60" height="60" rx="12"/);
});

test("the OG card is a 1200x630 accent field carrying the mark", () => {
  const svg = ogCardSvg("#205ea6");
  assert.equal(OG_WIDTH, 1200);
  assert.equal(OG_HEIGHT, 630);
  assert.match(svg, new RegExp(`viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}"`));
  assert.match(
    svg,
    new RegExp(
      `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#205ea6"`,
    ),
    "the card must be opaque to its edges, or clients composite it themselves",
  );
});
