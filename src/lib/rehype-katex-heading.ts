/**
 * Inside heading elements only (h1–h6), collapse KaTeX's three-layer inline-math
 * markup down to its single visible layer, so the heading's collected text reads
 * the formula ONCE.
 *
 * @astrojs/mdx appends Astro's `rehypeHeadingIds` AFTER these user rehype
 * plugins, and that pass builds each heading's `text` (and its slug/id) by
 * concatenating EVERY descendant text node. Walked over an already-expanded
 * rehype-katex subtree it reads all three layers — the `.katex-mathml` MathML
 * glyphs, the raw `<annotation>` TeX it wraps, and the `.katex-html` glyphs —
 * so a heading `## X $e^{i\pi}+1=0$` collects as "X eiπ+1=0e^{i\pi}+1=0eiπ+1=0".
 * [slug].astro then prints that soup verbatim in the on-page TOC (PageToc) and
 * the anchor aria-label. Navigation is unaffected (id and href derive from the
 * same string); only the displayed text is broken.
 *
 * The fix drops the visually-hidden `.katex-mathml` subtree — both its MathML
 * and the raw-TeX `<annotation>` inside it — and keeps the visible `.katex-html`
 * glyph layer, leaving exactly one text layer for `rehypeHeadingIds` to read.
 * rehype-katex marks `.katex-html` `aria-hidden="true"` because it defers a11y
 * to the MathML we just removed; leaving it would make the heading's math SILENT
 * to assistive tech, so within headings we strip that `aria-hidden` so AT reads
 * the rendered glyph text instead. Reading glyphs is coarser than the dropped
 * MathML semantics, but a heading must have one clean text layer, and this beats
 * silence. Body math is untouched — it keeps all three layers, so AT still gets
 * the MathML there and Pagefind still sees the annotation.
 *
 * Runs after rehypeKatex (needs the expanded subtree). Mirrors rehypeKatexScroll:
 * a small hast walker over a minimally-typed node, registered alongside the
 * other rehype plugins in markdown.rehypePlugins.
 */
type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function hasClass(node: HastNode, cls: string): boolean {
  if (node.type !== "element") return false;
  const c = node.properties?.className;
  return Array.isArray(c) ? c.includes(cls) : c === cls;
}

export function rehypeKatexHeading() {
  // Applied to a heading's subtree: drop every `.katex-mathml` (its MathML +
  // annotation) and un-hide every `.katex-html` so its glyphs are both the sole
  // collected heading text and reachable by AT.
  const clean = (node: HastNode): void => {
    if (hasClass(node, "katex-html")) {
      // rehype-katex sets ariaHidden:"true"; deleting the key removes the attr.
      delete node.properties!.ariaHidden;
    }
    if (node.children) {
      node.children = node.children.filter((c) => !hasClass(c, "katex-mathml"));
      node.children.forEach(clean);
    }
  };
  const walk = (node: HastNode): void => {
    if (node.type === "element" && node.tagName && HEADINGS.has(node.tagName)) {
      clean(node);
      return; // headings don't nest — the whole subtree is handled here
    }
    node.children?.forEach(walk);
  };
  return (tree: HastNode) => walk(tree);
}
