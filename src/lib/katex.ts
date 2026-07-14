import katex from "katex";

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
          katex.renderToString(part.slice(2, -2), {
            displayMode: true,
            throwOnError: false,
          }),
        );
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        return ignoreInSearch(
          katex.renderToString(part.slice(1, -1), {
            displayMode: false,
            throwOnError: false,
          }),
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
