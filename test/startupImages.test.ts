import { test } from "node:test";
import assert from "node:assert/strict";
import { STARTUP_IMAGES } from "../src/lib/startupImages.ts";
import { splashSvg } from "../src/lib/favicon.ts";

/**
 * The launch-image table is the one place a mistake is invisible: iOS silently
 * ignores an image whose media query doesn't match the launch window exactly and
 * shows a blank screen instead — the very thing these exist to prevent. So the
 * table's internal consistency is asserted here rather than trusted.
 */

test("every launch image is listed in both orientations", () => {
  assert.ok(STARTUP_IMAGES.length > 0);
  assert.equal(
    STARTUP_IMAGES.length % 2,
    0,
    "images come in portrait/landscape pairs",
  );
  const portrait = STARTUP_IMAGES.filter((s) =>
    s.media.includes("orientation: portrait"),
  );
  const landscape = STARTUP_IMAGES.filter((s) =>
    s.media.includes("orientation: landscape"),
  );
  assert.equal(portrait.length, landscape.length);
});

test("names are unique, so no image is rendered twice", () => {
  // Two device classes CAN land on the same pixel size; if that ever happens the
  // build would render the same file twice and the second write would be waste.
  const names = STARTUP_IMAGES.map((s) => s.name);
  assert.equal(
    new Set(names).size,
    names.length,
    `duplicate launch image names: ${names.filter((n, i) => names.indexOf(n) !== i).join(", ")}`,
  );
});

test("media queries are unique, so iOS can't pick ambiguously", () => {
  const media = STARTUP_IMAGES.map((s) => s.media);
  assert.equal(new Set(media).size, media.length);
});

test("each name states the pixel size the raster actually is", () => {
  for (const s of STARTUP_IMAGES) {
    assert.equal(
      s.name,
      `startup-${s.width}x${s.height}.png`,
      `${s.name} disagrees with its ${s.width}x${s.height} raster`,
    );
  }
});

test("every media query carries the four features iOS matches on", () => {
  for (const s of STARTUP_IMAGES) {
    for (const feature of [
      "device-width",
      "device-height",
      "-webkit-device-pixel-ratio",
      "orientation",
    ]) {
      assert.match(
        s.media,
        new RegExp(`\\(${feature}:`),
        `${s.name} media is missing ${feature}: ${s.media}`,
      );
    }
  }
});

test("raster size is the CSS window scaled by the pixel ratio", () => {
  for (const s of STARTUP_IMAGES) {
    const w = Number(/\(device-width: (\d+)px\)/.exec(s.media)![1]);
    const h = Number(/\(device-height: (\d+)px\)/.exec(s.media)![1]);
    const dpr = Number(
      /\(-webkit-device-pixel-ratio: (\d+)\)/.exec(s.media)![1],
    );
    const portrait = s.media.includes("orientation: portrait");
    // device-width/height stay PORTRAIT-oriented in both queries; only the
    // raster swaps. Getting this backwards is the classic way the whole table
    // silently stops matching.
    assert.equal(s.width, portrait ? w * dpr : h * dpr, `${s.name} width`);
    assert.equal(s.height, portrait ? h * dpr : w * dpr, `${s.name} height`);
  }
});

test("splashSvg fills the whole window and centres the mark", () => {
  const svg = splashSvg("#205ea6", 1179, 2556);
  assert.match(svg, /viewBox="0 0 1179 2556"/);
  assert.match(svg, /<rect width="1179" height="2556" fill="#205ea6"\/>/);
  // Centre of the window, not of the viewBox's top-left quadrant.
  assert.match(svg, /translate\(589\.5 1278\)/);
});

test("splashSvg sizes the mark off the short edge, so it reads the same in both orientations", () => {
  const scaleOf = (svg: string) => Number(/scale\(([\d.]+)\)/.exec(svg)![1]);
  assert.equal(
    scaleOf(splashSvg("#205ea6", 1179, 2556)),
    scaleOf(splashSvg("#205ea6", 2556, 1179)),
  );
});
