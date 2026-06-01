import { defineConfig } from "astro/config";
import studyCompanion from "./src/index.ts";

/**
 * DEV / DEMO HARNESS — not used by course repos (they ship their own
 * astro.config.mjs). This lets the framework build and serve its bundled demo
 * course in `content/` standalone, so every widget can be developed and
 * screenshot-verified in both themes without an external consumer:
 *
 *   pnpm dev        # serve the demo (search needs `build`, see README)
 *   pnpm build      # static output to dist/ + Pagefind index
 *   pnpm preview
 *
 * The integration is imported by relative path here; a real course imports it
 * by package name ("study-companion"). `srcDir` points at `demo/` (not the
 * library's `src/`) so only the framework's injected routes exist — otherwise
 * `src/pages/` would be auto-discovered AND injected, colliding on every route.
 */
export default defineConfig({
  // A real course sets its own canonical origin here (one of the "three thin
  // files"); the framework reads it for canonical / Open Graph / sitemap
  // absolute URLs (ROADMAP 4.1). The reserved example domain stands in for the
  // demo harness so those features are exercised in the standalone build.
  site: "https://demo.example.com",
  srcDir: "./demo",
  integrations: [studyCompanion()],
});
