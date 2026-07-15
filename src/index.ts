import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { writeFile, readdir, stat, unlink } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { flexokiDark } from "./lib/shiki-flexoki.ts";
import { rehypeTableScroll } from "./lib/rehype-table-scroll.ts";

/**
 * After rehype-katex, tag KaTeX's `.katex-mathml` (the visually-hidden MathML +
 * `\tex` annotation) with `data-pagefind-ignore` so the Pagefind index drops the
 * raw LaTeX but keeps the visible `.katex-html` glyphs. Search excerpts then show
 * the formula as symbols instead of the raw-LaTeX-plus-doubled-glyph soup you get
 * when both layers are indexed (e.g. "θ₂=90∘\theta_2 = 90^\circ"). Mirrors
 * `ignoreInSearch` in lib/katex.ts, which does the same for the direct
 * renderToString paths (renderMathString, Formula, FormulaRef, FormulaSheet).
 */
type HastNode = {
  type: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};
function rehypePagefindIgnoreKatex() {
  const isKatex = (node: HastNode) => {
    const c = node.properties?.className;
    return Array.isArray(c) ? c.includes("katex-mathml") : c === "katex-mathml";
  };
  const walk = (node: HastNode): void => {
    if (node.type === "element" && isKatex(node)) {
      node.properties = node.properties ?? {};
      node.properties["data-pagefind-ignore"] = "";
      return; // the whole subtree is ignored; no need to descend
    }
    node.children?.forEach(walk);
  };
  return (tree: HastNode) => walk(tree);
}
import { faviconSvg, maskIconSvg, GROUND } from "./lib/favicon.ts";

// This package's root (parent of src/ or dist/). Used to let the dev server
// serve assets that live alongside the framework — see the fs.allow note below.
const PACKAGE_ROOT = fileURLToPath(new URL("../", import.meta.url));

/**
 * Dynamic import that Vite can never rewrite into a call on its SSR module
 * runner — which is already closed by the time `astro:build:done` hooks run,
 * otherwise failing with "Vite module runner has been closed". The runner only
 * intercepts the import when this package is consumed as a packed node_modules
 * dependency; a symlinked `link:` dep happens to dodge it. The Function body's
 * `import()` resolves through Node's native loader, outside the compiled
 * graph, so the imported module's own types never attach — hence the caller
 * casts. Build-time (node) only; the client-side twin with a dev/prod split
 * lives in lib/simRuntime.ts.
 */
const nativeImport = new Function("specifier", "return import(specifier)") as (
  s: string,
) => Promise<any>;

/**
 * Generate the per-course raster app icons + Safari pinned-tab mask into the
 * static output at build. The mask SVG needs nothing; the PNGs load
 * `sharp` — declared as this package's own optionalDependency, matching
 * Astro's supported range, so it resolves by NAME under every package manager
 * (including pnpm's unhoisted store) — through the same guarded dynamic
 * import as Pagefind below. A missing or failing sharp FAILS the build: the
 * prerendered manifest + apple-touch-icon/og:image tags already reference
 * these PNGs, so skipping would ship 404 icons and a broken install contract.
 * The icons are accent-tinted from the course's own `accent`/`accentDark`.
 *
 *   /apple-touch-icon.png   180×180 (iOS home screen; opaque)
 *   /icon-192.png /icon-512.png   manifest "any" (transparent rounded mark)
 *   /icon-maskable-512.png   manifest "maskable" (full-bleed ground)
 *   /safari-pinned-tab.svg   monochrome silhouette, tinted via the link `color`
 */
async function generateAppIcons(
  root: URL,
  outDir: string,
  logger: { info: (m: string) => void; warn: (m: string) => void },
): Promise<void> {
  // The pinned-tab mask is a plain string write — no rasterizer needed, so do
  // it first and unconditionally (Safari mask works even if sharp is missing).
  try {
    await writeFile(join(outDir, "safari-pinned-tab.svg"), maskIconSvg());
  } catch (err) {
    logger.warn(
      `Skipped mask-icon: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Read just the accent(s) from course.yaml — a shallow read (defaults to the
  // schema default) so icon generation never depends on full schema parsing.
  let accent = "#205ea6"; // courseSchema's accent default
  let accentDark: string | undefined;
  try {
    const yamlText = readFileSync(
      join(fileURLToPath(root), "content/course.yaml"),
      "utf8",
    );
    const data = parseYaml(yamlText) as
      | { accent?: unknown; accentDark?: unknown }
      | undefined;
    if (data?.accent) accent = String(data.accent);
    if (data?.accentDark) accentDark = String(data.accentDark);
  } catch {
    /* fall back to the default accent */
  }
  // Dark-surface accent: the mark's ground is near-black, like the favicon link.
  const markAccent = accentDark ?? accent;

  try {
    const sharpMod = await nativeImport("sharp");
    const sharp = sharpMod.default ?? sharpMod;

    // Render the mark at a generous fixed size, then resize down per target.
    const svg = Buffer.from(
      faviconSvg(markAccent).replace("<svg ", '<svg width="512" height="512" '),
    );
    const png = (size: number, opaque: boolean): Promise<Buffer> => {
      let img = sharp(svg, { density: 512 }).resize(size, size);
      if (opaque) img = img.flatten({ background: GROUND });
      return img.png().toBuffer();
    };

    await writeFile(join(outDir, "apple-touch-icon.png"), await png(180, true));
    await writeFile(join(outDir, "icon-192.png"), await png(192, false));
    await writeFile(join(outDir, "icon-512.png"), await png(512, false));
    await writeFile(
      join(outDir, "icon-maskable-512.png"),
      await png(512, true),
    );
    logger.info(
      "Generated app icons (apple-touch-icon, icon-192/512, maskable)",
    );
  } catch (err) {
    // Hard failure, never warn-and-skip: the manifest.webmanifest and the
    // apple-touch-icon/og:image tags are already prerendered pointing at these
    // PNGs (the manifest can't self-correct — it renders before build:done),
    // so a skip ships 404 icons and Chrome refuses the PWA install.
    throw new Error(
      `study-companion: could not generate the app icons — sharp failed to load or run (${
        err instanceof Error ? err.message : String(err)
      }). The emitted manifest and icon tags already reference these PNGs, so the site must not ship without them. sharp is an optionalDependency of study-companion; if your package manager skipped it (--no-optional, or an unsupported platform), reinstall with optional dependencies enabled.`,
    );
  }
}

/**
 * Every KaTeX @font-face lists `format('woff2')` first, and no supported
 * browser falls back to woff/ttf — so `katex/dist/katex.min.css`'s woff/ttf
 * faces (vendored for ancient browsers KaTeX itself no longer targets) are
 * pure dead weight once bundled into static output: ~0.8MB per build that no
 * browser ever fetches. Delete the emitted `KaTeX_*.woff` / `KaTeX_*.ttf`
 * assets (hashed filenames, so match on the basename pattern) and log what was
 * reclaimed. KaTeX's own woff2 files are untouched, as is every non-KaTeX font.
 */
async function removeKatexDeadWeight(
  outDir: string,
  logger: { info: (m: string) => void },
): Promise<void> {
  const isDeadWeight = /^KaTeX_.*\.(woff|ttf)$/;
  const entries = await readdir(outDir, { recursive: true });
  let count = 0;
  let bytes = 0;
  for (const entry of entries) {
    if (!isDeadWeight.test(entry.split(/[/\\]/).pop() ?? "")) continue;
    const path = join(outDir, entry);
    bytes += (await stat(path)).size;
    await unlink(path);
    count++;
  }
  if (count > 0) {
    logger.info(
      `Removed ${count} unused KaTeX woff/ttf file(s) (${(bytes / 1024).toFixed(1)} kB) — woff2 is the only format any supported browser fetches.`,
    );
  }
}

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
 * configuration: MDX + KaTeX math wired into the markdown pipeline, six page
 * routes injected straight from this package — `/` (overview), `/[slug]`
 * (modules + reference tools), `/sitemap.xml`, `/robots.txt`,
 * `/manifest.webmanifest` and `/404` — and a Pagefind index built over the
 * static output. All design/schema/page wiring lives here so the course repo
 * stays thin and upgrade-safe.
 */
export default function studyCompanion(
  options: StudyCompanionOptions = {},
): AstroIntegration {
  const { pagefind: buildPagefind = true } = options;

  // Captured in config:setup, read in build:done (which gets no `config`) to
  // locate the course's content/course.yaml for per-course icon generation.
  let projectRoot: URL | undefined;

  return {
    name: "study-companion",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectRoute }) => {
        projectRoot = config.root;
        // The framework emits root-absolute URLs everywhere (nav hrefs,
        // manifest icons, canonical/og/sitemap entries) and nothing consults
        // import.meta.env.BASE_URL, so a subpath deploy would build green and
        // 404 on every link. Fail fast instead of shipping a broken site.
        if (config.base !== "/") {
          throw new Error(
            "study-companion requires deployment at a domain/subdomain root — " +
              'set base "/" (the default) or deploy to a custom (sub)domain ' +
              "instead of a subpath.",
          );
        }
        // 1. Toolchain: MDX + server-rendered KaTeX math. The math plugins are
        //    set under `markdown`; @astrojs/mdx extends the markdown config by
        //    default, so they apply to both .md and .mdx with no client cost.
        updateConfig({
          integrations: [mdx()],
          build: {
            // Every emitted URL — canonical, og:url, sitemap <loc>, internal
            // hrefs — is deliberately slash-less (see trimTrailingSlash in
            // lib/seo.ts). The default "directory" output serves /slug/ and
            // 301s the slash-less form (a canonical-to-redirect conflict on
            // GH Pages), so emit /slug.html, which static hosts serve at
            // exactly /slug.
            format: "file",
          },
          markdown: {
            remarkPlugins: [remarkMath],
            rehypePlugins: [
              rehypeKatex,
              rehypePagefindIgnoreKatex,
              rehypeTableScroll,
            ],
            // Warm Flexoki-dark syntax theme instead of Astro's default cool
            // github-dark, so code sits in the warm-paper palette (see lib).
            shikiConfig: { theme: flexokiDark },
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

        // 3. Discoverability + installability endpoints. All prerendered to
        //    static files, course-derived, no per-course wiring: a hand-rolled
        //    sitemap (honours noindex/draft), robots.txt, the PWA manifest, and a
        //    branded 404 (otherwise a bad URL hits Astro's unstyled default).
        injectRoute({
          pattern: "/sitemap.xml",
          entrypoint: "study-companion/pages/sitemap.xml.ts",
          prerender: true,
        });
        injectRoute({
          pattern: "/robots.txt",
          entrypoint: "study-companion/pages/robots.txt.ts",
          prerender: true,
        });
        injectRoute({
          pattern: "/manifest.webmanifest",
          entrypoint: "study-companion/pages/manifest.webmanifest.ts",
          prerender: true,
        });
        injectRoute({
          pattern: "/404",
          entrypoint: "study-companion/pages/404.astro",
          prerender: true,
        });
      },

      "astro:build:done": async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);

        // Per-course raster app icons + pinned-tab mask. Independent of
        // the Pagefind step. Raster icon generation hard-fails the build if
        // sharp can't run (the manifest and icon tags already reference the
        // PNGs, so a skip would ship 404 icons); only the pinned-tab mask SVG
        // is warn-and-skip.
        if (projectRoot) {
          await generateAppIcons(projectRoot, outDir, logger);
        }

        // Independent of Pagefind: prune the unused KaTeX woff/ttf assets.
        await removeKatexDeadWeight(outDir, logger);

        if (!buildPagefind) return;
        try {
          // Dynamic import via nativeImport: pagefind spawns a native binary,
          // so we only load it when actually building an index (and never
          // during `astro dev`).
          const pagefind = (await nativeImport(
            "pagefind",
          )) as typeof import("pagefind");
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
