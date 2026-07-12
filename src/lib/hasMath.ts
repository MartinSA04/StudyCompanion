/**
 * Build-time "does this page paint any KaTeX?" signal, so CourseLayout only
 * preloads the two KaTeX faces (~48KB) on pages that actually render math. The
 * formula sheet is always math; glossary/flashcards/module bodies are checked
 * against their real inputs; the overview/404/exam pages carry no math and skip
 * the preload. Data-driven off the schema + section source only — no per-course
 * logic. Erring is one-directional: a false POSITIVE only wastes a preload, a
 * false NEGATIVE would flash a fallback serif, so every "in doubt" case here
 * keeps the preload (see the widget-tag net for module bodies below).
 */

/**
 * A `$…$` / `$$…$$` math span, matching the SAME split `renderMathString` uses
 * (lib/katex.ts) — so any author string that will actually typeset registers as
 * math and never a string that only happens to contain a lone `$`.
 */
const MATH_DELIMITER = /\$\$[^$]*\$\$|\$[^$]+\$/;

/** True if any of `strings` contains a `$…$` / `$$…$$` span KaTeX will render. */
export function stringsHaveMath(strings: (string | undefined)[]): boolean {
  return strings.some((s) => s != null && MATH_DELIMITER.test(s));
}

/**
 * KaTeX-emitting widgets an MDX author can drop into a module body WITHOUT any
 * `$…$` delimiter in the raw source (their math arrives as a `tex=` prop or a
 * component that calls renderMathString internally). A module using one of these
 * paints KaTeX even when its prose has no `$`, so its presence keeps the preload
 * on. Names mirror the mdx-components.ts map; kept broad on purpose — a widget
 * added here that turns out never to typeset only costs a wasted preload, while
 * omitting one that does would flash the fallback serif.
 */
const MATH_WIDGET_TAGS = [
  "Formula",
  "FormulaRef",
  "Statement",
  "Quiz",
  "SelfCheck",
  "Table",
  "Figure",
  "Step",
  "CompareCol",
  "PanelHeader",
];
const MATH_WIDGET = new RegExp(`<(?:${MATH_WIDGET_TAGS.join("|")})[\\s/>]`);

/**
 * True if a module's raw MDX body will paint any KaTeX — either an inline
 * `$…$` / `$$…$$` span (remark-math) or a math-emitting widget (`<Formula>` &c.,
 * whose math never appears as a bare delimiter in the source).
 */
export function bodyHasMath(body: string | undefined): boolean {
  if (!body) return false;
  return MATH_DELIMITER.test(body) || MATH_WIDGET.test(body);
}
