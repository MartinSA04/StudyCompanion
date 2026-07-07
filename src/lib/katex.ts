import katex from "katex";

/**
 * Render `$inline$` and `$$display$$` math inside an otherwise-plain author
 * string to server-side KaTeX HTML, leaving the surrounding text as-is.
 *
 * Used by widgets whose text arrives as component props (Quiz, Flashcards),
 * where MDX/remark-math can't reach. Author strings are trusted content, so
 * non-math text is passed through verbatim — simple inline HTML like
 * `<em>…</em>` is allowed, mirroring how this content was authored before.
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
      return part;
    })
    .join("");
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
  return html.replace(
    '<span class="katex-mathml">',
    '<span class="katex-mathml" data-pagefind-ignore>',
  );
}
