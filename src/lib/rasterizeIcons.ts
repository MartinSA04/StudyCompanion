import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ogCardSvg,
  tileSvg,
  OG_WIDTH,
  OG_HEIGHT,
  type TileVariant,
} from "./favicon.ts";

/**
 * Rasterize the `>_` mark into the PNG icon set, on a ground of `accent`.
 *
 * Shared by two callers with different needs, which is why it lives here rather
 * than inside the integration: the course integration (src/index.ts) emits the
 * full PWA set from a course's own accent, and the hub build
 * (astro.config.hub.mjs) emits just the two it needs — the hub has no manifest
 * and no course.yaml, but still needs a real raster for `og:image`, since a
 * data-URI favicon is not something a social crawler can fetch.
 *
 * Each target is built from its OWN SVG rather than one shared string resized
 * four ways: the framings are mutually exclusive (see favicon.ts), so a single
 * geometry is necessarily wrong for some target.
 *
 * `sharp` is loaded through the caller's dynamic-import shim (see the
 * `nativeImport` note in src/index.ts): Vite must never rewrite it into a call
 * on an SSR module runner that is already closed by `astro:build:done`.
 *
 * Throws rather than warning. Both callers prerender tags that already point at
 * these files, so a skip ships 404s instead of a degraded-but-working site.
 */
export interface IconTarget {
  /** File name written into `outDir`, e.g. "icon-512.png". */
  name: string;
  width: number;
  height: number;
  /** How the mark is framed. "og-card" is the only non-square framing. */
  framing: TileVariant | "og-card";
  /**
   * Flatten so no alpha channel ships — iOS rejects transparency on a home
   * screen icon. A `bleed`/`og-card` ground already covers its canvas, so this
   * is belt-and-braces rather than a visible change; `rounded` targets keep
   * their transparent margin and must stay false.
   */
  opaque: boolean;
}

/** The full set the course integration emits. */
export const COURSE_ICONS: IconTarget[] = [
  {
    name: "apple-touch-icon.png",
    width: 180,
    height: 180,
    framing: "bleed",
    opaque: true,
  },
  {
    name: "icon-192.png",
    width: 192,
    height: 192,
    framing: "rounded",
    opaque: false,
  },
  {
    name: "icon-512.png",
    width: 512,
    height: 512,
    framing: "rounded",
    opaque: false,
  },
  {
    name: "icon-maskable-512.png",
    width: 512,
    height: 512,
    framing: "bleed",
    opaque: true,
  },
  {
    name: "og-image.png",
    width: OG_WIDTH,
    height: OG_HEIGHT,
    framing: "og-card",
    opaque: true,
  },
];

/**
 * What the hub needs: the Open Graph card plus an iOS bookmark icon. No manifest
 * icons — the hub is a one-pager, not an installable app.
 */
export const HUB_ICONS: IconTarget[] = [
  {
    name: "apple-touch-icon.png",
    width: 180,
    height: 180,
    framing: "bleed",
    opaque: true,
  },
  {
    name: "og-image.png",
    width: OG_WIDTH,
    height: OG_HEIGHT,
    framing: "og-card",
    opaque: true,
  },
];

/**
 * 2× supersample before the downsample to the target size. `density` is a DPI
 * against a 72dpi baseline, so 144 doubles the raster librsvg produces; the
 * mark's round caps and the tile's corner radius then land on a downsampled edge
 * instead of a hard-rasterized one. Deliberately not higher — the OG card is
 * already 1200×630, and a larger factor buys nothing visible for tens of MB of
 * intermediate bitmap.
 */
const SUPERSAMPLE_DPI = 144;

export async function rasterizeIcons(opts: {
  accent: string;
  outDir: string;
  targets: IconTarget[];
  /** Dynamic-import shim that resolves "sharp" outside the Vite graph. */
  importSharp: () => Promise<any>;
}): Promise<string[]> {
  const sharpMod = await opts.importSharp();
  const sharp = sharpMod.default ?? sharpMod;

  const written: string[] = [];
  for (const t of opts.targets) {
    const source =
      t.framing === "og-card"
        ? ogCardSvg(opts.accent)
        : tileSvg(opts.accent, t.framing);
    // Declare the render size on the SVG itself so librsvg rasterizes at the
    // right scale; the viewBox alone would render at its user-unit size.
    const svg = Buffer.from(
      source.replace("<svg ", `<svg width="${t.width}" height="${t.height}" `),
    );
    let img = sharp(svg, { density: SUPERSAMPLE_DPI }).resize(
      t.width,
      t.height,
    );
    if (t.opaque) img = img.flatten({ background: opts.accent });
    await writeFile(join(opts.outDir, t.name), await img.png().toBuffer());
    written.push(t.name);
  }
  return written;
}
