import { test } from "node:test";
import assert from "node:assert/strict";
import { faviconDataUri } from "../src/lib/favicon.ts";

const PREFIX = "data:image/svg+xml,";
const decode = (uri: string) => decodeURIComponent(uri.slice(PREFIX.length));

test("faviconDataUri builds a data:image/svg+xml URI of the >_ mark", () => {
  const uri = faviconDataUri("#2f6df6");
  assert.ok(uri.startsWith(PREFIX), "should be an inline SVG data URI");
  const svg = decode(uri);
  assert.match(svg, /<svg[\s>]/);
  assert.match(svg, /role="img"/); // keeps the accessible label
});

test("faviconDataUri tints every foreground element with the one accent", () => {
  const svg = decode(faviconDataUri("#2f6df6"));
  // border (stroke) + chevron (stroke) + underscore (fill) all use the accent.
  const hits = svg.match(/#2f6df6/g) ?? [];
  assert.ok(hits.length >= 3, `accent should appear 3x, saw ${hits.length}`);
});

test("faviconDataUri keeps a fixed near-black background", () => {
  const svg = decode(faviconDataUri("#2f6df6")).toLowerCase();
  assert.ok(svg.includes("#0b0e14"), "near-black ground should be present");
});

test("faviconDataUri escapes '#' so colors can't be read as a URL fragment", () => {
  const payload = faviconDataUri("#2f6df6").slice(PREFIX.length);
  assert.ok(!payload.includes("#"), "every '#' must be percent-encoded");
  assert.ok(payload.includes("%23"), "escaped hashes should be present");
});

test("faviconDataUri accepts non-hex CSS colors verbatim", () => {
  const svg = decode(faviconDataUri("rgb(255 0 0)"));
  assert.ok(svg.includes("rgb(255 0 0)"));
});
