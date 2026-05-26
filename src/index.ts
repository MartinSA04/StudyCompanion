import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export interface StudyCompanionOptions {
  /**
   * Build a Pagefind search index over the emitted static output in
   * `astro:build:done`. Defaults to true. Disable for environments where the
   * Pagefind binary can't run (the search UI then simply finds no index).
   */
  pagefind?: boolean;
}

/**
 * The study-companion Astro integration.
 *
 * Course repos add this to `astro.config.mjs` and get, with zero further
 * configuration: MDX + KaTeX math wired into the markdown pipeline, the single
 * `/` page route injected straight from this package, and a Pagefind index
 * built over the static output. All design/schema/page wiring lives here so the
 * course repo stays thin and upgrade-safe.
 */
export default function studyCompanion(
  options: StudyCompanionOptions = {},
): AstroIntegration {
  const { pagefind: buildPagefind = true } = options;

  return {
    name: "study-companion",
    hooks: {
      "astro:config:setup": ({ updateConfig, injectRoute }) => {
        // 1. Toolchain: MDX + server-rendered KaTeX math. The math plugins are
        //    set under `markdown`; @astrojs/mdx extends the markdown config by
        //    default, so they apply to both .md and .mdx with no client cost.
        updateConfig({
          integrations: [mdx()],
          markdown: {
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeKatex],
          },
        });

        // 2. Inject the pages from THIS package. Course repos therefore have no
        //    src/pages/ of their own. The guide is multi-page: an overview at
        //    `/` and one prerendered page per module / reference tool at
        //    `/<slug>`. Resolvable because package.json's `exports` exposes
        //    "./pages/index.astro" and "./pages/[slug].astro".
        injectRoute({
          pattern: "/",
          entrypoint: "study-companion/pages/index.astro",
          prerender: true,
        });
        injectRoute({
          pattern: "/[slug]",
          entrypoint: "study-companion/pages/[slug].astro",
          prerender: true,
        });
      },

      "astro:build:done": async ({ dir, logger }) => {
        if (!buildPagefind) return;
        const outDir = fileURLToPath(dir);
        try {
          // Dynamic import: pagefind spawns a native binary, so we only load it
          // when actually building an index (and never during `astro dev`).
          const pagefind = await import("pagefind");
          const { index } = await pagefind.createIndex();
          if (!index) throw new Error("Pagefind failed to create an index.");
          await index.addDirectory({ path: outDir });
          await index.writeFiles({ outputPath: join(outDir, "pagefind") });
          await pagefind.close();
          logger.info("Built Pagefind search index at /pagefind/");
        } catch (err) {
          logger.warn(
            `Skipped Pagefind index build: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      },
    },
  };
}
