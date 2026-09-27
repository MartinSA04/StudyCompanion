import katex, { type KatexOptions } from "katex";

const escapeAttr = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const unescapeAttr = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/**
 * TeX → KaTeX HTML for every component-rendered formula (renderMathString,
 * Formula, FormulaRef, FormulaSheet, SymbolList) — the one place those call
 * KaTeX, so a TeX error is caught the same way everywhere.
 *
 * With `throwOnError: false` alone, a typo (`\thetq`, an unbalanced brace)
 * ships as red source text on a green build. So this renders strictly first;
 * on a parse error it still renders KaTeX's red fallback in place — `astro dev`
 * must keep showing the page while an author types — but MARKS it:
 * `data-katex-error` (KaTeX's message) and `data-katex-tex` (the source) on the
 * output's outer element. The integration scans the built pages for that mark
 * in astro:build:done (`findKatexErrors`) and fails the build naming page,
 * source and message. MDX-body math never comes through here; the rehype check
 * in src/index.ts covers it at the file and line.
 */
export function renderTex(tex: string, options: KatexOptions = {}): string {
  try {
    return katex.renderToString(tex, { ...options, throwOnError: true });
  } catch (err) {
    let html: string;
    try {
      html = katex.renderToString(tex, { ...options, throwOnError: false });
    } catch {
      // Not a ParseError (KaTeX handles only those itself): mirror its markup.
      html = `<span class="katex-error">${escapeAttr(tex)}</span>`;
    }
    const message = err instanceof Error ? err.message : String(err);
    const mark = `<span data-katex-error="${escapeAttr(message)}" data-katex-tex="${escapeAttr(tex)}"`;
    return html.replace(/^<span\b/, () => mark);
  }
}

/**
 * Every KaTeX error in a built page: `renderTex`'s marks, plus any bare
 * `.katex-error` span (KaTeX's own error markup, with the message in `title`)
 * from a path that bypassed it. Pure, for the astro:build:done scan.
 */
export function findKatexErrors(
  html: string,
): { tex: string; message: string }[] {
  const found: { tex: string; message: string }[] = [];
  const marked =
    /<span\b[^>]*?\bdata-katex-error="([^"]*)"[^>]*?\bdata-katex-tex="([^"]*)"/g;
  for (const m of html.matchAll(marked)) {
    found.push({ tex: unescapeAttr(m[2]), message: unescapeAttr(m[1]) });
  }
  const bare =
    /<span\b(?![^>]*\bdata-katex-error=)([^>]*\bclass="[^"]*\bkatex-error\b[^"]*"[^>]*)>([^<]*)</g;
  for (const m of html.matchAll(bare)) {
    const title = /\btitle="([^"]*)"/.exec(m[1]);
    found.push({
      tex: unescapeAttr(m[2]),
      message: title ? unescapeAttr(title[1]) : "KaTeX error",
    });
  }
  return found;
}

/**
 * Render `$inline$` and `$$display$$` math inside an otherwise-plain author
 * string to server-side KaTeX HTML.
 *
 * Used by widgets whose text arrives as component props (Quiz, Flashcards),
 * where MDX/remark-math can't reach. Non-math segments are HTML-escaped —
 * a bare `<`, `>` or `&` ("O(n) where n<m") must render as text, not silently
 * swallow everything after it — except the documented "simple inline HTML"
 * affordance: attribute-less <b> <i> <em> <strong> <sub> <sup> <code> <br>
 * (and their closers) pass through, mirroring how this content was authored.
 */
export function renderMathString(text: string): string {
  return text
    .split(/(\$\$[^$]*\$\$|\$[^$]+\$)/g)
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
        return ignoreInSearch(
          renderTex(part.slice(2, -2), { displayMode: true }),
        );
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        return ignoreInSearch(
          renderTex(part.slice(1, -1), { displayMode: false }),
        );
      }
      return escapeKeepingInlineTags(part);
    })
    .join("");
}

/**
 * Escape `&`, `<`, `>` in a non-math segment, then un-escape exactly the
 * whitelisted simple-inline-HTML tag tokens. Escape-then-restore (rather than
 * parse) keeps every malformed or unlisted tag as visible text.
 */
function escapeKeepingInlineTags(part: string): string {
  return part
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;(\/?)(b|i|em|strong|sub|sup|code|br)&gt;/g, "<$1$2>");
}

/**
 * Tag KaTeX's `.katex-mathml` (the visually-hidden MathML + `\tex` annotation)
 * with `data-pagefind-ignore` so the search index drops the raw LaTeX source but
 * KEEPS the visible `.katex-html` glyph layer. Search excerpts then render the
 * formula as symbols (e.g. "θ₂=90∘") instead of the raw-LaTeX-plus-doubled-glyph
 * soup Pagefind produces when it indexes both layers. Fractions/subscripts
 * flatten, since a plain-text excerpt can't typeset them. The MDX path does the
 * same via a rehype plugin in the integration.
 */
export function ignoreInSearch(html: string): string {
  // KaTeX currently emits `<span class="katex-mathml">`, but match the span
  // through a regex tolerant of extra attributes / attribute order, so a KaTeX
  // upgrade degrades to noisier excerpts at worst — never to silently skipping
  // the tagging. First occurrence only: each renderToString output carries a
  // single mathml layer.
  return html.replace(
    /<span\s+([^>]*\bclass="[^"]*\bkatex-mathml\b[^"]*"[^>]*)>/,
    "<span data-pagefind-ignore $1>",
  );
}
