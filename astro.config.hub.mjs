import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import { rasterizeIcons, HUB_ICONS } from "./src/lib/rasterizeIcons.ts";

/**
 * COURSE HUB — the kurs.martinsundal.no one-pager (GitHub Pages), separate
 * from the demo harness in astro.config.mjs. Plain Astro, NO course
 * integration: the page imports the framework's style files directly, so the
 * hub stays in visual lockstep with the design system without consuming the
 * course schema. The one build hook below is hub-local, not the framework's.
 *
 *   pnpm hub:dev | hub:build | hub:preview
 */

/** Brand accent, mirroring the `accentLight` the hub page pins for itself. */
const HUB_ACCENT = "#205ea6";

/**
 * See the `nativeImport` note in src/index.ts: Vite must not rewrite this into
 * a call on an SSR module runner that is already closed by `astro:build:done`.
 */
const nativeImport = new Function("specifier", "return import(specifier)");

/**
 * The hub's only build step beyond rendering the page: rasterize the `>_` mark
 * so `og:image` has something a social crawler can actually fetch — the page's
 * own favicon is a data URI, which crawlers cannot follow. Deliberately not the
 * course integration: the hub has no course.yaml and no manifest, and needs
 * exactly two files.
 */
function hubIcons() {
  return {
    name: "hub-icons",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        try {
          const written = await rasterizeIcons({
            accent: HUB_ACCENT,
            outDir: fileURLToPath(dir),
            targets: HUB_ICONS,
            importSharp: () => nativeImport("sharp"),
          });
          logger.info(`Generated hub icons (${written.join(", ")})`);
        } catch (err) {
          // Hard failure, matching the course integration: the page's
          // og:image / apple-touch-icon tags are already prerendered pointing
          // at these files, so a warn-and-skip would ship 404s.
          throw new Error(
            `hub: could not generate the icons — sharp failed to load or run (${
              err instanceof Error ? err.message : String(err)
            }).`,
          );
        }
      },
    },
  };
}

export default defineConfig({
  site: "https://kurs.martinsundal.no",
  srcDir: "./hub",
  publicDir: "./hub/public",
  outDir: "./dist-hub",
  integrations: [hubIcons()],
});
