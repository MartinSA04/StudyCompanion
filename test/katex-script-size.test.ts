import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import katex from "katex";

/**
 * base.css re-derives KaTeX's second-level script size (0.5 → 0.6) by
 * overriding KaTeX's own sizing classes, which are internals rather than a
 * documented option. This pins the selectors and values the override assumes,
 * so a KaTeX upgrade that renames or retunes them fails here instead of
 * silently dropping scriptscript glyphs back to 8.9px.
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

const PINNED: Array<[string, string]> = [
  ["reset-size6.size1", ".5em"],
  ["reset-size3.size1", ".7142857143em"],
  ["reset-size1.size3", "1.4em"],
  ["reset-size1.size6", "2em"],
];

for (const [transition, value] of PINNED) {
  test(`katex.min.css still ships .${transition} at ${value}`, () => {
    const rule = `.katex .fontsize-ensurer.${transition},.katex .sizing.${transition}{font-size:${value}}`;
    assert.ok(
      katexCss.includes(rule),
      `expected KaTeX rule not found: ${rule}`,
    );
  });

  test(`base.css overrides both .sizing and .fontsize-ensurer for .${transition}`, () => {
    for (const cls of ["sizing", "fontsize-ensurer"]) {
      assert.ok(
        baseCss.includes(`.katex .katex-html .${cls}.${transition}`),
        `base.css is missing the .${cls}.${transition} override`,
      );
    }
  });
}

test("an .mfrac vlist lists the denominator first (the clearance rule relies on it)", () => {
  const html = katex.renderToString("\\frac{a}{b}", { throwOnError: false });
  const vlist = html.match(
    /<span class="mfrac"><span class="vlist-t[^"]*"><span class="vlist-r"><span class="vlist"[^>]*>(<span style="top:[^"]*">.*?<\/span><\/span><\/span>)/s,
  );
  assert.ok(vlist, "fraction vlist not found in KaTeX output");
  const firstCell = vlist[1].split('<span style="top:')[1];
  assert.match(firstCell, />b</, "first vlist cell should be the denominator");
  assert.doesNotMatch(
    firstCell,
    />a</,
    "first vlist cell must not be the numerator",
  );
});

test("the four overrides are mutually consistent (0.7 / 0.6 / 1)", () => {
  const em = (t: string) => {
    const m = baseCss.match(
      new RegExp(
        `\\.sizing\\.${t.replace(".", "\\.")}[^{]*\\{\\s*font-size:\\s*([\\d.]+)em`,
      ),
    );
    assert.ok(m, `no override value found for ${t}`);
    return Number(m[1]);
  };
  const ss = em("reset-size6.size1"); // scriptscript / text
  assert.ok(Math.abs(em("reset-size3.size1") - ss / 0.7) < 1e-6);
  assert.ok(Math.abs(em("reset-size1.size3") - 0.7 / ss) < 1e-6);
  assert.ok(Math.abs(em("reset-size1.size6") - 1 / ss) < 1e-6);
});
