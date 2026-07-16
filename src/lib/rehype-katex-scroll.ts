/**
 * Stamp `tabindex="0"` on every display-math `.katex-display` block so a wide
 * formula that overflows its `overflow-x:auto` viewport (base.css) can be
 * scrolled by keyboard, not just by pointer — the same treatment Shiki gives
 * every `<pre>` and `<div class="table-scroll">` gives a GFM table (WCAG
 * 2.1.1). rehype-katex produces `.katex-display` from `$$…$$` markdown; this
 * plugin runs after it.
 *
 * Mirrors rehypeTableScroll: a small hast walker over a minimally-typed node,
 * registered alongside the other rehype plugins in markdown.rehypePlugins.
 */
type HastNode = {
  type: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function isKatexDisplay(node: HastNode): boolean {
  if (node.type !== "element") return false;
  const c = node.properties?.className;
  return Array.isArray(c) ? c.includes("katex-display") : c === "katex-display";
}

export function rehypeKatexScroll() {
  const walk = (node: HastNode): void => {
    if (isKatexDisplay(node)) {
      node.properties = node.properties ?? {};
      node.properties.tabIndex = 0;
      return; // the scroll viewport is this block; no need to descend
    }
    node.children?.forEach(walk);
  };
  return (tree: HastNode) => walk(tree);
}
