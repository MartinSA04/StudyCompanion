import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { faviconSvg, GROUND } from "./favicon.ts";

/**
 * Rasterize the `>_` mark into the PNG app icons, tinted to `accent`.
 *
 * Shared by two callers with different needs, which is why it lives here rather
 * than inside the integration: the course integration (src/index.ts) emits the
 * full PWA set from a course's own accent, and the hub build
 * (astro.config.hub.mjs) emits just the two it needs — the hub has no manifest
 * and no course.yaml, but still needs a real raster to point `og:image` at,
 * since a data-URI favicon is not something a social crawler can fetch.
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
  size: number;
  /** Flatten onto the dark ground — iOS home screens reject transparency. */
  opaque: boolean;
}

/** The full PWA set the course integration emits. */
export const COURSE_ICONS: IconTarget[] = [
  { name: "apple-touch-icon.png", size: 180, opaque: true },
  { name: "icon-192.png", size: 192, opaque: false },
  { name: "icon-512.png", size: 512, opaque: false },
  { name: "icon-maskable-512.png", size: 512, opaque: true },
];

/**
 * What the hub needs: an `og:image` source plus an iOS bookmark icon. No
 * manifest icons — the hub is a one-pager, not an installable app.
 */
export const HUB_ICONS: IconTarget[] = [
  { name: "apple-touch-icon.png", size: 180, opaque: true },
  { name: "icon-512.png", size: 512, opaque: false },
];

export async function rasterizeIcons(opts: {
  accent: string;
  outDir: string;
  targets: IconTarget[];
  /** Dynamic-import shim that resolves "sharp" outside the Vite graph. */
  importSharp: () => Promise<any>;
}): Promise<string[]> {
  const sharpMod = await opts.importSharp();
  const sharp = sharpMod.default ?? sharpMod;

  // Render the mark at a generous fixed size, then resize down per target.
  const svg = Buffer.from(
    faviconSvg(opts.accent).replace("<svg ", '<svg width="512" height="512" '),
  );

  const written: string[] = [];
  for (const t of opts.targets) {
    let img = sharp(svg, { density: 512 }).resize(t.size, t.size);
    if (t.opaque) img = img.flatten({ background: GROUND });
    await writeFile(join(opts.outDir, t.name), await img.png().toBuffer());
    written.push(t.name);
  }
  return written;
}
