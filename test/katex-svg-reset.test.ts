import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/**
 * base.css resets media to `max-width: 100%`, and KaTeX draws `\vec` as an
 * absolutely positioned <svg> inside a zero-width `.accent-body`. Against that
 * containing block the reset resolves to 0px and the arrow vanishes, so
 * base.css exempts KaTeX's svgs. This pins both halves of that reasoning: the
 * KaTeX internal the exemption answers, and the exemption itself, so neither
 * a KaTeX upgrade nor a stylesheet clean-up can silently drop the arrows again.
 * visual/katex-accent.spec.ts measures the rendered result in a browser.
 */
const require = createRequire(import.meta.url);
const katexCss = readFileSync(
  require.resolve("katex/dist/katex.min.css"),
  "utf8",
);
const baseCss = readFileSync(
  new URL("../src/styles/base.css", import.meta.url),
  "utf8",
);

test("katex.min.css still gives .accent-body zero width", () => {
  assert.ok(
    katexCss.includes(".katex .accent .accent-body:not(.accent-full){width:0}"),
    "KaTeX changed how accents are boxed — re-check whether base.css still needs the svg exemption",
  );
});

test("base.css exempts KaTeX svgs from the media max-width reset", () => {
  const rule = baseCss.match(/\.katex svg\s*\{([^}]*)\}/);
  assert.ok(rule, "base.css has no `.katex svg { … }` rule");
  assert.match(rule![1], /max-width:\s*none/);
});
