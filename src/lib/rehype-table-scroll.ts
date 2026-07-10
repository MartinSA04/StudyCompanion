/**
 * Wrap every markdown-authored `<table>` in `<div class="table-scroll">` so a
 * wide table gets horizontal scrolling instead of breaking the layout on
 * mobile — the same treatment `<Table>` gives its own markup (2.5). Plain GFM
 * tables in prose have no such wrapper by default, so this rehype plugin adds
 * one at build time. `.table-scroll` styling lives in base.css.
 *
 * Mirrors rehypePagefindIgnoreKatex in the integration: a small hast walker
 * over a minimally-typed node, registered alongside the other rehype plugins
 * in markdown.rehypePlugins.
 */
type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function isTable(node: HastNode): boolean {
  return node.type === "element" && node.tagName === "table";
}

/** Already-wrapped tables (e.g. authored directly as HTML) are left alone. */
function isTableScrollWrapper(node: HastNode): boolean {
  if (node.type !== "element" || node.tagName !== "div") return false;
  const c = node.properties?.className;
  return Array.isArray(c) ? c.includes("table-scroll") : c === "table-scroll";
}

function wrap(node: HastNode): HastNode {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["table-scroll"] },
    children: [node],
  };
}

export function rehypeTableScroll() {
  const walk = (node: HastNode): void => {
    if (!node.children) return;
    if (isTableScrollWrapper(node)) return; // already wrapped — don't descend
    node.children = node.children.map((child) =>
      isTable(child) ? wrap(child) : child,
    );
    node.children.forEach(walk);
  };
  return (tree: HastNode) => walk(tree);
}
