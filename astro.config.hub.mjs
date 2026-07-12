import { defineConfig } from "astro/config";

/**
 * COURSE HUB — the kurs.martinsundal.no one-pager (GitHub Pages), separate
 * from the demo harness in astro.config.mjs. Plain Astro, NO integration:
 * the page imports the framework's style files directly, so the hub stays in
 * visual lockstep with the design system without consuming the course schema.
 *
 *   pnpm hub:dev | hub:build | hub:preview
 */
export default defineConfig({
  site: "https://kurs.martinsundal.no",
  srcDir: "./hub",
  publicDir: "./hub/public",
  outDir: "./dist-hub",
});
