import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMathString } from "../src/lib/katex.ts";

/**
 * `renderMathString` typesets `$…$` / `$$…$$` spans in an author string and
 * HTML-escapes the non-math remainder — except the documented whitelist of
 * attribute-less inline tags. The `.katex-mathml` layer gets
 * `data-pagefind-ignore` so search excerpts index the glyphs, not raw LaTeX.
 */

test("inline math renders KaTeX with the search-ignore attribute on mathml", () => {
  const out = renderMathString("angle $\\theta$ here");
  assert.match(out, /class="katex"/);
  // The ignore attribute lands on the mathml span, and the visible glyph layer
  // (katex-html) is retained for search excerpts.
  assert.match(out, /<span data-pagefind-ignore[^>]*class="[^"]*katex-mathml/);
  assert.ok(out.includes("katex-html"));
});

test("display math ($$…$$) also renders KaTeX with the ignore attribute", () => {
  const out = renderMathString("$$\\int_0^1 x\\,dx$$");
  assert.match(out, /class="katex/);
  assert.match(out, /<span data-pagefind-ignore[^>]*class="[^"]*katex-mathml/);
});

test("plain prose passes through unchanged", () => {
  assert.equal(renderMathString("just some text"), "just some text");
});

test("whitelisted attribute-less inline tags survive", () => {
  assert.equal(renderMathString("a <b>bold</b> c"), "a <b>bold</b> c");
  assert.equal(
    renderMathString("<em>x</em> and <sub>0</sub>"),
    "<em>x</em> and <sub>0</sub>",
  );
  assert.equal(renderMathString("line<br>break"), "line<br>break");
});

test("a bare < or & in prose is escaped (the new behavior)", () => {
  assert.equal(
    renderMathString("O(n) where n<m & p>q"),
    "O(n) where n&lt;m &amp; p&gt;q",
  );
  // An attributed / unlisted tag stays visible text, not live HTML.
  assert.equal(renderMathString("<b class=x>y</b>"), "&lt;b class=x&gt;y</b>");
});

test("empty input and a lone `$` stay literal text (no typeset)", () => {
  assert.equal(renderMathString(""), "");
  assert.equal(renderMathString("costs $5 today"), "costs $5 today");
  // `$$` with nothing inside is not a math span.
  assert.equal(renderMathString("$$"), "$$");
});
