import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findKatexErrors,
  renderMathString,
  renderTex,
} from "../src/lib/katex.ts";
import { rehypeKatexErrors } from "../src/lib/rehype-katex-errors.ts";

/**
 * Every KaTeX call runs with throwOnError:false, so a TeX typo would ship as
 * red source on a green build. Component math goes through `renderTex`, which
 * still renders the red fallback (dev must keep showing the page) but marks
 * it; the build:done scan (`findKatexErrors`) turns the marks into a build
 * error naming page, source and message. MDX-body math fails at its file:line
 * via `rehypeKatexErrors`.
 */

test("renderTex: valid TeX renders unmarked", () => {
  const html = renderTex("\\theta_c", { displayMode: false });
  assert.match(html, /class="katex"/);
  assert.ok(!html.includes("data-katex-error"));
  assert.deepEqual(findKatexErrors(html), []);
});

test("renderTex: an undefined command still renders, marked with source and message", () => {
  // KaTeX draws an undefined command as red text INSIDE a normal .katex span —
  // no .katex-error element at all, which is why a class scan alone misses it.
  const html = renderTex("a + \\thetq", { displayMode: false });
  assert.match(
    html,
    /^<span data-katex-error="[^"]*Undefined control sequence/,
  );
  const [err, ...rest] = findKatexErrors(html);
  assert.equal(rest.length, 0);
  assert.equal(err.tex, "a + \\thetq");
  assert.match(err.message, /\\thetq/);
});

test("renderTex: a structural error (unbalanced brace) is marked too", () => {
  const [err] = findKatexErrors(renderTex("\\frac{1}{2", {}));
  assert.equal(err.tex, "\\frac{1}{2");
  assert.match(err.message, /KaTeX parse error/);
});

test("renderMathString marks a bad span and leaves good ones alone", () => {
  const html = renderMathString('Vinkel $\\theta$ og $\\sqrt{x$ & "sitat"');
  const errors = findKatexErrors(html);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].tex, "\\sqrt{x");
});

test("findKatexErrors: a bare .katex-error span reports its title and text", () => {
  const html =
    '<p><span class="katex-error" title="ParseError: KaTeX parse error: Expected &#x27;}&#x27;" style="color:#cc0000">\\frac{1</span></p>';
  assert.deepEqual(findKatexErrors(html), [
    { tex: "\\frac{1", message: "ParseError: KaTeX parse error: Expected '}'" },
  ]);
});

test("rehypeKatexErrors: throws with file:line, tex and message when failing", () => {
  const file = {
    path: `${process.cwd()}/content/sections/02-x.mdx`,
    messages: [
      {
        source: "rehype-katex",
        reason: "Could not render math with KaTeX",
        line: 14,
        cause: new Error(
          "KaTeX parse error: Undefined control sequence: \\thetq",
        ),
        ancestors: [
          { type: "element", children: [{ type: "text", value: "\\thetq_c" }] },
        ],
      },
      { source: "remark-lint", reason: "unrelated", line: 1 },
    ],
  };
  assert.throws(
    () => rehypeKatexErrors({ fail: true })(null, file),
    (err: Error) => {
      assert.match(
        err.message,
        /content\/sections\/02-x\.mdx:14: KaTeX could not render "\\thetq_c" — KaTeX parse error: Undefined control sequence/,
      );
      assert.ok(!err.message.includes("unrelated"));
      return true;
    },
  );
});

test("rehypeKatexErrors: no KaTeX messages, no error; dev mode only warns", () => {
  assert.doesNotThrow(() =>
    rehypeKatexErrors({ fail: true })(null, { messages: [] }),
  );
  const warn = console.warn;
  let warned = "";
  console.warn = (m: string) => (warned = m);
  try {
    rehypeKatexErrors({ fail: false })(null, {
      path: "x.mdx",
      messages: [{ source: "rehype-katex", reason: "bad", line: 3 }],
    });
  } finally {
    console.warn = warn;
  }
  assert.match(warned, /x\.mdx:3: KaTeX could not render "" — bad/);
});
