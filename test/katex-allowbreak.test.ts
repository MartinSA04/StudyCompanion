import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import katex from "katex";

/**
 * base.css turns an author's top-level `\allowbreak` into the ONE place a
 * nowrap formula may wrap (taken only when the line overflows). That leans on
 * three things pinned here, so neither a KaTeX upgrade nor a stylesheet
 * clean-up can silently make every `\allowbreak` inert again — or, worse,
 * unconditional. visual/katex-allowbreak.spec.ts measures the rendered result.
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

test("KaTeX ends a top-level chunk at \\allowbreak, after the operator glue", () => {
  for (const displayMode of [false, true]) {
    const html = katex.renderToString("a^2 \\allowbreak - b", { displayMode });
    // The `.allowbreak` span is a direct child of a `.base`, the binop glue
    // that follows it stays in the same chunk, and the next `.base` starts
    // right after — i.e. the break base.css opens sits exactly at the seam.
    assert.match(
      html,
      /<span class="mspace allowbreak"><\/span>(<span class="mspace" style="[^"]*"><\/span>)?<\/span><span class="base">/,
      `displayMode=${displayMode}: KaTeX changed how it chunks around \\allowbreak — re-check base.css`,
    );
  }
});

test("\\allowbreak inside a group is NOT a chunk boundary (so the CSS never fires there)", () => {
  const html = katex.renderToString("\\left( a \\allowbreak - b \\right)", {
    displayMode: false,
  });
  assert.doesNotMatch(
    html,
    /<span class="base"><span class="strut"[^>]*><\/span><span class="mspace allowbreak">/,
  );
  assert.doesNotMatch(
    html,
    /class="mspace allowbreak"><\/span>(<span class="mspace"[^>]*><\/span>)?<\/span><span class="base">/,
  );
});

test("katex.min.css still boxes .base as an inline-block min-content run", () => {
  // The premise for `display: inline` on the marked chunk: an inline-block
  // sized to min-content would take any break inside it unconditionally.
  assert.ok(
    katexCss.includes(".katex .base,.katex .strut{display:inline-block}"),
  );
  assert.match(
    katexCss,
    /\.katex \.base\{[^}]*white-space:nowrap[^}]*min-content/,
  );
});

test("base.css opens exactly one soft-wrap opportunity at the \\allowbreak chunk", () => {
  const inline = baseCss.match(
    /\.katex \.katex-html > \.base:has\(> \.allowbreak\)\s*\{([^}]*)\}/,
  );
  assert.ok(inline, "base.css has no `.base:has(> .allowbreak)` rule");
  assert.match(inline![1], /display:\s*inline\b/);
  const after = baseCss.match(
    /\.katex \.katex-html > \.base:has\(> \.allowbreak\)::after\s*\{([^}]*)\}/,
  );
  assert.ok(after, "base.css has no `::after` rule on the \\allowbreak chunk");
  assert.match(after![1], /content:\s*"\\200B\\200B"/);
  assert.match(after![1], /white-space:\s*normal/);
});
