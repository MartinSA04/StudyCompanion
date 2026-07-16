import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseHex,
  luminance,
  contrastRatio,
  contrastText,
  accentOnBg,
  accentInk,
  mixSrgb,
  ACCENT_SOFT_MIX,
  ACCENT_WEAK_MIX,
} from "../src/lib/color.ts";

test("parseHex handles 3/4/6/8-digit hex, with or without #", () => {
  assert.deepEqual(parseHex("#fff"), [255, 255, 255]);
  assert.deepEqual(parseHex("fff"), [255, 255, 255]);
  assert.deepEqual(parseHex("#1f5f8b"), [31, 95, 139]);
  // Alpha is parsed but ignored.
  assert.deepEqual(parseHex("#11223344"), [17, 34, 51]);
  assert.deepEqual(parseHex("#1234"), [17, 34, 51]);
});

test("parseHex rejects malformed input", () => {
  assert.equal(parseHex("rebeccapurple"), null);
  assert.equal(parseHex("#12"), null); // too short
  assert.equal(parseHex("#12345"), null); // not 3/4/6/8
  assert.equal(parseHex("#xyz"), null);
});

test("luminance hits the WCAG endpoints", () => {
  assert.equal(luminance([255, 255, 255]), 1);
  assert.equal(luminance([0, 0, 0]), 0);
});

test("contrastRatio of black vs white is 21:1 (order-independent)", () => {
  assert.equal(contrastRatio(1, 0), 21);
  assert.equal(contrastRatio(0, 1), 21);
});

test("contrastText picks legible ink for the accent", () => {
  // Dark accent → white ink.
  assert.equal(contrastText("#1f5f8b"), "#ffffff");
  assert.equal(contrastText("#000080"), "#ffffff");
  // Light accent → near-black ink.
  assert.equal(contrastText("#ffd400"), "#100f0f");
  assert.equal(contrastText("#ffffff"), "#100f0f");
});

test("contrastText falls back to white for un-parseable colors", () => {
  assert.equal(contrastText("hsl(210 50% 40%)"), "#ffffff");
  assert.equal(contrastText("tomato"), "#ffffff");
});

test("accentOnBg returns a WCAG ratio, or null on bad input", () => {
  assert.equal(accentOnBg("#000000", "#ffffff"), 21);
  assert.equal(accentOnBg("#ffffff", "#ffffff"), 1);
  // A real accent on white should clear the 3:1 large-text bar.
  const r = accentOnBg("#205ea6", "#ffffff");
  assert.ok(r != null && r > 3);
  assert.equal(accentOnBg("not-a-color", "#ffffff"), null);
  assert.equal(accentOnBg("#fff", "also-bad"), null);
});

test("accentInk mixes 75% accent / 25% fg", () => {
  assert.equal(accentInk("#000000", "#ffffff"), "#404040");
  assert.equal(accentInk("#ffffff", "#000000"), "#bfbfbf");
  // Falls back to the accent unchanged for un-parseable colors.
  assert.equal(accentInk("not-a-color", "#ffffff"), "not-a-color");
  assert.equal(accentInk("#1f5f8b", "also-bad"), "#1f5f8b");
});

test("mixSrgb reproduces color-mix(in srgb, …) per channel", () => {
  // 50/50 endpoints (round-half-up on the .5 channels).
  assert.equal(mixSrgb("#000000", "#ffffff", 0.5), "#808080");
  // --accent-soft: color-mix(in srgb, accent 10%, --bg-elevated). Flexoki
  // yellow-600 over the light panel is the #ebe5ce that ships as its tint.
  assert.equal(mixSrgb("#ad8301", "#f2f0e5", ACCENT_SOFT_MIX), "#ebe5ce");
  // --accent-weak (12%) is the more-tinted of the pair.
  assert.equal(mixSrgb("#ad8301", "#f2f0e5", ACCENT_WEAK_MIX), "#eae3ca");
  // Null for un-parseable colors on either side.
  assert.equal(mixSrgb("tomato", "#f2f0e5", ACCENT_SOFT_MIX), null);
  assert.equal(mixSrgb("#ad8301", "hsl(0 0% 0%)", ACCENT_SOFT_MIX), null);
});

test("a mid-tone accent AA on neutral grounds fails on the accent tint", () => {
  // Flexoki yellow-600 as the course accent: --accent-ink clears AA (4.5:1) as
  // text on both neutral grounds the guard used to check, yet the accent-tinted
  // grounds it actually renders on (Statement kicker, search mark, …) tip it
  // under — the exact sub-AA-text case the neutral-only guard shipped.
  const ink = accentInk("#ad8301", "#100f0f"); // light --fg
  const onBg = accentOnBg(ink, "#fffcf0"); // --bg
  const onElevated = accentOnBg(ink, "#f2f0e5"); // --bg-elevated
  assert.ok(onBg != null && onBg >= 4.5);
  assert.ok(onElevated != null && onElevated >= 4.5);
  const soft = mixSrgb("#ad8301", "#f2f0e5", ACCENT_SOFT_MIX);
  const weak = mixSrgb("#ad8301", "#f2f0e5", ACCENT_WEAK_MIX);
  const onSoft = accentOnBg(ink, soft!); // --accent-soft
  const onWeak = accentOnBg(ink, weak!); // --accent-weak
  assert.ok(onSoft != null && onSoft < 4.5);
  assert.ok(onWeak != null && onWeak < 4.5);
});
