/**
 * Author-facing title strings may carry soft hyphens (U+00AD) to control where
 * a long Norwegian compound wraps on a narrow screen — see AUTHORING.md. In a
 * text node the browser treats one as an invisible break opportunity and draws
 * a real hyphen when it uses it ("Halvleder-/komponenter" instead of a raw
 * mid-word chop).
 *
 * That is exactly what we want on screen and never what we want in data. Every
 * boundary where a title stops being pixels and becomes a machine-read string —
 * `<title>`, OG/Twitter meta, JSON-LD, the web manifest, the Pagefind index —
 * runs it through `plain()` first.
 */

/** U+00AD SOFT HYPHEN — a break opportunity, not a character in the word. */
const SOFT_HYPHEN = /­/g;

/** Strip soft hyphens, giving the word as it is actually spelled. */
export function plain(s: string): string {
  return s.replace(SOFT_HYPHEN, "");
}
