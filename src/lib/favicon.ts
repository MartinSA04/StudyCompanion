import { contrastText } from "./color.ts";

/**
 * The `>_` brand mark, framed per icon target.
 *
 * The mark is the command-prompt glyph from martinsundal.no. It is knocked OUT
 * of a field of the course's own `accent`, which makes the accent the tile
 * rather than a hairline on a shared dark ground — six installed guides are then
 * told apart at 60px, which is the size they are actually tapped at.
 *
 * Two framings, because the targets contradict each other: iOS and Android apply
 * their own mask and need full bleed with no baked radius, while a manifest `any`
 * icon and a browser tab are shown UNMASKED and must own their corners. One
 * shared SVG resized for all of them is what shipped the pre-v4.1 defects: a
 * 6.25% margin that the iOS squircle cut into, and a frame whose corners sat at
 * 62% radius inside a maskable safe circle of 40%.
 */

/** Square tile viewBox, in user units. */
const TILE = 64;

/**
 * The mark's drawn bounding box inside the tile. The chevron's round caps extend
 * 3 units past its path, so the box is x 15…51, y 18…47 — wider than it is tall,
 * and not centred on the viewBox, which is why every framing re-centres it.
 */
const MARK = { w: 36, h: 29, cx: 33, cy: 32.5 };

/**
 * The mark spans 56% of the tile width, leaving ~22% clear on each side. Sized
 * to satisfy the tighter of the two platform constraints (the maskable circle —
 * see MARK_HALF_DIAGONAL), which also clears Apple's central-80% icon grid.
 */
const MARK_WIDTH_RATIO = 0.56;

/** Scale applied to the mark's native geometry to hit MARK_WIDTH_RATIO. */
export const MARK_SCALE = (TILE * MARK_WIDTH_RATIO) / MARK.w;

/** Maskable safe zone: content must stay inside a circle of 80% DIAMETER. */
export const MASKABLE_SAFE_RADIUS = TILE * 0.4;

/**
 * Centre-to-furthest-corner distance of the scaled mark. Must stay under
 * MASKABLE_SAFE_RADIUS or a platform mask clips the mark; test/favicon.test.ts
 * asserts it, so widening MARK_WIDTH_RATIO past the safe circle fails CI instead
 * of shipping a clipped Android icon.
 */
export const MARK_HALF_DIAGONAL = (MARK_SCALE * Math.hypot(MARK.w, MARK.h)) / 2;

/** Open Graph card dimensions — the aspect every social client crops to. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * The mark spans 26% of the card width; the rest is an accent field. Larger than
 * a tile's share because the card is wide: at 20% the mark read as a placeholder
 * dropped into empty space, and an unfurl renders this at roughly 500px, where
 * the mark needs to hold the frame on its own with no text beside it.
 */
const OG_MARK_WIDTH_RATIO = 0.26;

/** How a tile frames its accent ground. */
export type TileVariant =
  /** Edge to edge, no baked radius — iOS and Android supply the mask. */
  | "bleed"
  /** Rounded square with a transparent margin — shown unmasked. */
  | "rounded";

/** The mark, re-centred on (cx, cy) and scaled, in `color`. */
function markGroup(
  color: string,
  scale: number,
  cx: number,
  cy: number,
): string {
  return (
    `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-MARK.cx} ${-MARK.cy})">` +
    `<path d="M18 21l11 11-11 11" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="34" y="41" width="17" height="6" rx="2" fill="${color}"/>` +
    `</g>`
  );
}

/**
 * A square icon tile: the mark knocked out of an `accent` field. The mark takes
 * whichever ink reads on that accent, via the same `contrastText` the shell uses
 * for filled chips and the skip link — so a course picking a pale accent gets a
 * dark mark automatically rather than an invisible white one.
 */
export function tileSvg(accent: string, variant: TileVariant): string {
  const ground =
    variant === "bleed"
      ? `<rect width="${TILE}" height="${TILE}" fill="${accent}"/>`
      : `<rect x="2" y="2" width="${TILE - 4}" height="${TILE - 4}" rx="12" fill="${accent}"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}" role="img" aria-label="study-companion">` +
    ground +
    markGroup(contrastText(accent), MARK_SCALE, TILE / 2, TILE / 2) +
    `</svg>`
  );
}

/**
 * The 1200×630 Open Graph card: the same mark on the same accent field, at the
 * aspect `summary_large_image` expects. Deliberately carries NO text — rendering
 * type through sharp means librsvg + fontconfig, so glyph metrics would depend on
 * whichever fonts the build machine happens to have, differing between a dev
 * container and a consumer's CI runner. Per-page text is the `satori` job on
 * ROADMAP; this is the deterministic part.
 */
export function ogCardSvg(accent: string): string {
  const scale = (OG_WIDTH * OG_MARK_WIDTH_RATIO) / MARK.w;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" role="img" aria-label="study-companion">` +
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${accent}"/>` +
    markGroup(contrastText(accent), scale, OG_WIDTH / 2, OG_HEIGHT / 2) +
    `</svg>`
  );
}

/**
 * The tab favicon as an inline `data:image/svg+xml` URI, ready for
 * `<link rel="icon">` — the `rounded` tile, since a tab icon is never masked.
 * `accent` may be any CSS color; it is encoded verbatim (the `#` in hex colors is
 * escaped so it isn't read as a URL fragment).
 */
export function faviconDataUri(accent: string): string {
  return "data:image/svg+xml," + encodeURIComponent(tileSvg(accent, "rounded"));
}
