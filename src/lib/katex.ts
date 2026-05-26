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
        return katex.renderToString(part.slice(2, -2), {
          displayMode: true,
          throwOnError: false,
        });
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        return katex.renderToString(part.slice(1, -1), {
          displayMode: false,
          throwOnError: false,
        });
      }
      return part;
    })
    .join("");
}
