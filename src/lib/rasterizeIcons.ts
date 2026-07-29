import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ogCardSvg,
  splashSvg,
  tileSvg,
  OG_WIDTH,
  OG_HEIGHT,
  type TileVariant,
} from "./favicon.ts";
import { STARTUP_IMAGES } from "./startupImages.ts";

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
  /** How the mark is framed. "og-card" and "splash" are the non-square framings. */
  framing: TileVariant | "og-card" | "splash";
  /**
   * Supersample 2× before downsampling to `width`/`height`. Worth it for small
   * tiles, where the corner radius and the mark's round caps land on a
   * downsampled edge. Skipped for launch images: they are already up to
   * 2048×2732, so doubling them costs tens of MB of intermediate bitmap to
   * antialias one small centred mark. Defaults to true.
   */
  supersample?: boolean;
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
  // iOS launch images. Generated from the same table CourseLayout reads for its
  // link tags, so a tag can never point at a file the build didn't render.
  ...STARTUP_IMAGES.map((s) => ({
    name: s.name,
    width: s.width,
    height: s.height,
    framing: "splash" as const,
    opaque: true,
    supersample: false,
  })),
];

/**
 * What the hub needs: the Open Graph card plus an iOS bookmark icon. No manifest
 * icons and no launch images — the hub is a one-pager, not an installable app
 * (it sets neither a manifest nor `apple-mobile-web-app-capable`).
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

/** librsvg's baseline DPI: renders the SVG at exactly its declared px size. */
const BASE_DPI = 72;

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
        : t.framing === "splash"
          ? splashSvg(opts.accent, t.width, t.height)
          : tileSvg(opts.accent, t.framing);
    // Declare the render size on the SVG itself so librsvg rasterizes at the
    // right scale; the viewBox alone would render at its user-unit size.
    const svg = Buffer.from(
      source.replace("<svg ", `<svg width="${t.width}" height="${t.height}" `),
    );
    const density = t.supersample === false ? BASE_DPI : SUPERSAMPLE_DPI;
    let img = sharp(svg, { density }).resize(t.width, t.height);
    if (t.opaque) img = img.flatten({ background: opts.accent });
    // Max zlib on a flat two-colour field. Measured on the largest launch image
    // (2048×2732): 84 kB at the default level, 24 kB at level 9, for +14ms.
    //
    // `palette: true` reaches 8 kB and was REJECTED: quantization costs ~435ms
    // per image against 56ms, which turned the demo build from 4.1s into 11.9s.
    // That 8s lands in every consumer's CI on every deploy, forever, to save
    // ~200 kB of static assets a device fetches at most one of. Wrong trade.
    await writeFile(
      join(opts.outDir, t.name),
      await img.png({ compressionLevel: 9 }).toBuffer(),
    );
    written.push(t.name);
  }
  return written;
}
