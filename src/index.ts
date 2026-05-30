import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// This package's root (parent of src/ or dist/). Used to let the dev server
// serve assets that live alongside the framework — see the fs.allow note below.
const PACKAGE_ROOT = fileURLToPath(new URL("../", import.meta.url));

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
      "astro:config:setup": ({ config, updateConfig, injectRoute }) => {
        // 1. Toolchain: MDX + server-rendered KaTeX math. The math plugins are
        //    set under `markdown`; @astrojs/mdx extends the markdown config by
        //    default, so they apply to both .md and .mdx with no client cost.
        updateConfig({
          integrations: [mdx()],
          markdown: {
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeKatex],
          },
          vite: {
            server: {
              fs: {
                // Let the dev server serve framework-owned assets that don't
                // live under the consumer's src/. Most visibly KaTeX's CSS +
                // web fonts (imported from this package); without this they
                // 403 and display math falls back to a serif face with
                // non-stretchy delimiters.
                //
                // Under pnpm each package's real files sit in its own
                // `.pnpm/<pkg>@<ver>/node_modules/<pkg>` subtree, so `katex`
                // is a *sibling* of this package, not a child — allowing only
                // this package's root leaves it outside the list. So allow:
                //   - the consumer project root, which contains the whole
                //     `.pnpm` store (covers KaTeX and any other framework dep);
                //   - this package's root, for a `link:`ed checkout that lives
                //     OUTSIDE the consumer's project root.
                // Dev-only; production bundles every asset into static output.
                allow: [fileURLToPath(config.root), PACKAGE_ROOT],
              },
            },
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
          // Build the import via `new Function` so Vite never rewrites it into a
          // call on its SSR module runner — which is already closed by the time
          // astro:build:done runs, otherwise failing with "Vite module runner
          // has been closed". The runner only intercepts the import when this
          // package is consumed as a packed node_modules dependency; a symlinked
          // `link:` dep happens to dodge it. The Function body's `import()`
          // resolves through Node's native loader.
          const nativeImport = new Function(
            "specifier",
            "return import(specifier)",
          ) as (s: string) => Promise<typeof import("pagefind")>;
          const pagefind = await nativeImport("pagefind");
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
