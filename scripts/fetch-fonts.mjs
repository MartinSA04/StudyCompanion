// Vendor the three brand fonts (Fraunces, Spectral, IBM Plex Mono) from Google
// Fonts into the package so the framework carries no render-blocking third-party
// request. Re-run this to refresh: `node scripts/fetch-fonts.mjs`.
//
// We vendor EVERY range Google ships (latin, latin-ext, greek, cyrillic, …) — no
// glyphs are dropped, so any character a course types in prose still renders in
// brand. This is not lossy "subsetting": each @font-face keeps its `unicode-range`,
// so a browser still downloads only the range(s) a page actually uses (a Norwegian
// page fetches just latin/latin-ext). The extra ranges only add committed files,
// not runtime cost. Spectral's italic (400, 600) is vendored alongside its upright
// weights so blockquote/<em> render true italics instead of faux-oblique. The
// files + generated fonts.css are committed; at build time Vite fingerprints the
// woff2 and rewrites the url()s. KaTeX fonts are already self-hosted via the
// bundled `katex/dist/katex.min.css` import.

import { mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

// A modern browser UA makes Google serve woff2 (not ttf) with subset comments.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const outDir = fileURLToPath(new URL("../src/styles/fonts/", import.meta.url));
const cssPath = fileURLToPath(
  new URL("../src/styles/fonts.css", import.meta.url),
);

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Metrics-matched fallback faces ("Spectral Fallback" / "Fraunces Fallback" /
 * "IBM Plex Mono Fallback"), sized and shaped to the real web font so the
 * fallback-swap causes minimal reflow (the token-stack entries that reference
 * these names are wired in tokens.css by the chrome package). The serif pair
 * bases on local("Georgia"); the mono face bases on local("Courier New") —
 * the standard metric-adjustment base for monospace stacks.
 *
 * size-adjust = webFontAvgAdvance / baseAvgAdvance, where each AvgAdvance is
 * a font's `xWidthAvg` (capsize's average-glyph-advance metric, seek-oss/capsize
 * `@capsizecss/metrics`) normalized by its own `unitsPerEm` — i.e. the average
 * advance expressed as a fraction of one em. The ascent/descent/line-gap
 * overrides are each the web font's hhea value similarly normalized, then
 * divided by size-adjust (since size-adjust already scales the fallback face,
 * the overrides must un-scale by the same factor to land on the real metric).
 *
 * Source metrics (Georgia/Spectral/Fraunces from @capsizecss/metrics@4.1.0,
 * cross-checked against the shipped woff2 via `fonttools` — unitsPerEm/ascent/
 * descent/lineGap match exactly, confirming the same font version. IBM Plex
 * Mono read directly off the shipped woff2 via `@capsizecss/unpack`'s
 * fromBuffer; Courier New from the same @capsizecss/metrics@4.1.0 collection):
 *   Georgia:      unitsPerEm 2048, xWidthAvg  913, ascent 1878, descent -449, lineGap 0
 *   Spectral:     unitsPerEm 1000, xWidthAvg  446, ascent 1059, descent -463, lineGap 0
 *   Fraunces:     unitsPerEm 2000, xWidthAvg  938, ascent 1956, descent -510, lineGap 0
 *   Courier New:  unitsPerEm 2048, xWidthAvg 1229, ascent 1705, descent -615, lineGap 0
 *   IBM Plex Mono: unitsPerEm 1000, xWidthAvg  600, ascent 1025, descent -275, lineGap 0
 *
 *   georgiaAvgAdvance     = 913 / 2048 = 0.445801
 *   spectralAvgAdvance    = 446 / 1000 = 0.446000
 *   frauncesAvgAdvance    = 938 / 2000 = 0.469000
 *   courierNewAvgAdvance  = 1229 / 2048 = 0.600098
 *   plexMonoAvgAdvance    = 600 / 1000 = 0.600000
 *
 *   Spectral size-adjust  = 0.446000 / 0.445801 = 100.0447%
 *   Spectral ascent-override  = 1059 / (1000 * 1.000447) = 105.8527%
 *   Spectral descent-override =  463 / (1000 * 1.000447) =  46.2793%
 *   Spectral line-gap-override =   0 / (1000 * 1.000447) =   0.0000%
 *
 *   Fraunces size-adjust  = 0.469000 / 0.445801 = 105.2039%
 *   Fraunces ascent-override  = 1956 / (2000 * 1.052039) =  92.9623%
 *   Fraunces descent-override =  510 / (2000 * 1.052039) =  24.2386%
 *   Fraunces line-gap-override =   0 / (2000 * 1.052039) =   0.0000%
 *
 *   IBM Plex Mono size-adjust  = 0.600000 / 0.600098 = 99.9837%
 *   (both faces are monospaced with a single advance width, so this ratio is
 *   exact rather than an average over a glyph distribution)
 *   IBM Plex Mono ascent-override  = 1025 / (1000 * 0.999837) = 102.5167%
 *   IBM Plex Mono descent-override =  275 / (1000 * 0.999837) =  27.5045%
 *   IBM Plex Mono line-gap-override =   0 / (1000 * 0.999837) =   0.0000%
 */
const FALLBACK_FACES = `
@font-face {
  font-family: 'Spectral Fallback';
  src: local("Georgia");
  size-adjust: 100.0447%;
  ascent-override: 105.8527%;
  descent-override: 46.2793%;
  line-gap-override: 0%;
}

@font-face {
  font-family: 'Fraunces Fallback';
  src: local("Georgia");
  size-adjust: 105.2039%;
  ascent-override: 92.9623%;
  descent-override: 24.2386%;
  line-gap-override: 0%;
}

@font-face {
  font-family: 'IBM Plex Mono Fallback';
  src: local("Courier New");
  size-adjust: 99.9837%;
  ascent-override: 102.5167%;
  descent-override: 27.5045%;
  line-gap-override: 0%;
}
`;

// A non-2xx here (rate-limit, outage, blocked UA) still returns a body — an
// error page — that parses to zero @font-face blocks; guard so we never treat
// that as "the fonts are gone" and wipe the committed set (see the abort below).
const cssRes = await fetch(CSS_URL, { headers: { "User-Agent": UA } });
if (!cssRes.ok) {
  throw new Error(
    `Google Fonts CSS fetch failed: ${cssRes.status} ${cssRes.statusText} (${CSS_URL})`,
  );
}
const css = await cssRes.text();

// Each @font-face is preceded by a `/* subset */` comment. Capture both.
const blockRe = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;

// Parse every block BEFORE touching the committed fonts, so a (family, style,
// subset) group can be inspected as a whole (see the collapse step below) AND
// so a bad response aborts with the vendored files still on disk.
const blocks = [];
for (const [, subset, face] of css.matchAll(blockRe)) {
  const family = /font-family:\s*'([^']+)'/.exec(face)?.[1] ?? "font";
  const style = /font-style:\s*([^;]+)/.exec(face)?.[1]?.trim() ?? "normal";
  const weight = Number(
    (/font-weight:\s*([^;]+)/.exec(face)?.[1] ?? "400").trim(),
  );
  const url = /url\(([^)]+)\)/.exec(face)?.[1];
  const unicodeRange = /unicode-range:\s*([^;]+);/.exec(face)?.[1]?.trim();
  if (!url || !unicodeRange) continue;
  blocks.push({ family, style, weight, subset, url, unicodeRange });
}

// The three families across all Google ranges yield dozens of blocks; anything
// this low means the response was truncated or not the CSS we expected, so bail
// with the committed fonts untouched rather than regenerating a broken set.
if (blocks.length < 20) {
  throw new Error(
    `Parsed only ${blocks.length} @font-face block(s) from Google — expected dozens; ` +
      "aborting without touching the committed fonts.",
  );
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

// A variable font (Fraunces) serves every requested weight from the SAME file
// per subset — Google's css2 endpoint still emits one @font-face per weight
// pointing at that one file, which is 4 duplicate rules per subset. Detect any
// (family, style, subset) group whose blocks all share one url and collapse it
// to a single `font-weight: <min> <max>` range rule; a static font (Spectral,
// IBM Plex Mono) has a distinct file per weight, so its groups never collapse.
const groupKey = (b) => `${b.family} ${b.style} ${b.subset}`;
const groups = new Map(); // key -> { weights: Set<number>, urls: Set<string> }
for (const b of blocks) {
  const key = groupKey(b);
  let g = groups.get(key);
  if (!g) groups.set(key, (g = { weights: new Set(), urls: new Set() }));
  g.weights.add(b.weight);
  g.urls.add(b.url);
}

const seen = new Map(); // url -> local filename (dedupe identical downloads)
const emittedGroups = new Set();
const out = [
  "/*",
  " * Self-hosted brand fonts — GENERATED by scripts/fetch-fonts.mjs, do not edit.",
  " * All Google ranges of Fraunces / Spectral / IBM Plex Mono; unicode-range gates",
  " * what each page downloads. Spectral italic (400, 600) is included alongside",
  ' * the upright weights. "Spectral Fallback" / "Fraunces Fallback" / "IBM Plex',
  ' * Mono Fallback" below are metrics-matched local() faces (Georgia / Georgia /',
  " * Courier New respectively), not part of the Google fetch.",
  " */",
  "",
];
let kept = 0;

for (const b of blocks) {
  const key = groupKey(b);
  const group = groups.get(key);
  const collapse = group.urls.size === 1 && group.weights.size > 1;

  if (collapse) {
    if (emittedGroups.has(key)) continue; // already wrote the merged rule
    emittedGroups.add(key);
  }

  const weightLabel = collapse
    ? `${Math.min(...group.weights)} ${Math.max(...group.weights)}`
    : String(b.weight);
  // Name files after the LOWEST weight in a collapsed group so a re-run stays
  // stable (the group's block order matches Google's ascending weight order).
  const namedWeight = collapse ? Math.min(...group.weights) : b.weight;

  let file = seen.get(b.url);
  if (!file) {
    file = `${slug(b.family)}-${namedWeight}-${b.style === "italic" ? "italic-" : ""}${b.subset}.woff2`;
    let n = 1;
    while ([...seen.values()].includes(file)) {
      file = `${slug(b.family)}-${namedWeight}-${b.style === "italic" ? "italic-" : ""}${b.subset}-${++n}.woff2`;
    }
    const fontRes = await fetch(b.url, { headers: { "User-Agent": UA } });
    if (!fontRes.ok) {
      throw new Error(
        `woff2 fetch failed: ${fontRes.status} ${fontRes.statusText} (${b.url})`,
      );
    }
    const bytes = Buffer.from(await fontRes.arrayBuffer());
    await writeFile(outDir + file, bytes);
    seen.set(b.url, file);
    console.log(`  ${file}  (${(bytes.length / 1024).toFixed(1)} kB)`);
  }

  out.push(
    "@font-face {",
    `  font-family: '${b.family}';`,
    `  font-style: ${b.style};`,
    `  font-weight: ${weightLabel};`,
    "  font-display: swap;",
    `  src: url("./fonts/${file}") format('woff2');`,
    `  unicode-range: ${b.unicodeRange};`,
    "}",
    "",
  );
  kept++;
}

out.push(FALLBACK_FACES.trim(), "");

await writeFile(cssPath, out.join("\n"));
console.log(
  `\nVendored ${seen.size} woff2 file(s), ${kept} @font-face block(s) + 2 fallback face(s) → src/styles/fonts.css`,
);
