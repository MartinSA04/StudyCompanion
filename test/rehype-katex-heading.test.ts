import { test } from "node:test";
import assert from "node:assert/strict";
import { rehypeKatexHeading } from "../src/lib/rehype-katex-heading.ts";

/**
 * Hand-built hast trees exercise the walker directly (no MDX pipeline). The
 * plugin returns a transformer that mutates the tree in place. The KaTeX nodes
 * mirror rehype-katex's real output for inline `$…$`: a `.katex` wrapper holding
 * a visually-hidden `.katex-mathml` (MathML glyphs + a raw-TeX `<annotation>`)
 * and the visible, `aria-hidden` `.katex-html` glyph layer.
 */
const run = (tree: any) => {
  rehypeKatexHeading()(tree);
  return tree;
};

const el = (tagName: string, props: any = {}, children: any[] = []) => ({
  type: "element",
  tagName,
  properties: props,
  children,
});
const text = (value: string) => ({ type: "text", value });

// glyphs = the rendered symbols (e.g. "eiπ+1=0"); tex = the raw LaTeX source.
const katexInline = (glyphs: string, tex: string) =>
  el("span", { className: ["katex"] }, [
    el("span", { className: ["katex-mathml"] }, [
      el("math", {}, [
        el("semantics", {}, [
          el("mrow", {}, [text(glyphs)]),
          el("annotation", { encoding: "application/x-tex" }, [text(tex)]),
        ]),
      ]),
    ]),
    el("span", { className: ["katex-html"], ariaHidden: "true" }, [
      text(glyphs),
    ]),
  ]);

// Naive descendant-text concatenation — exactly what Astro's rehypeHeadingIds
// does to build a heading's `text`, slug and id.
const collectText = (node: any): string => {
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(collectText).join("");
};

const findClass = (node: any, cls: string): any => {
  if (
    node.type === "element" &&
    Array.isArray(node.properties?.className) &&
    node.properties.className.includes(cls)
  )
    return node;
  for (const c of node.children ?? []) {
    const r = findClass(c, cls);
    if (r) return r;
  }
  return null;
};

const findTag = (node: any, tagName: string): any => {
  if (node.type === "element" && node.tagName === tagName) return node;
  for (const c of node.children ?? []) {
    const r = findTag(c, tagName);
    if (r) return r;
  }
  return null;
};

test("a heading with inline math collects its text once, visual layer intact", () => {
  const h = el("h2", {}, [
    text("Identiteten "),
    katexInline("eiπ+1=0", "e^{i\\pi} + 1 = 0"),
  ]);
  run({ type: "root", children: [h] });

  // Text reads the glyphs exactly once — not the tripled mathml+tex+html soup.
  assert.equal(collectText(h), "Identiteten eiπ+1=0");
  // The visually-hidden MathML/annotation layer is gone.
  assert.equal(findClass(h, "katex-mathml"), null);
  // The visible glyph layer survives and is un-hidden so AT can read it.
  const html = findClass(h, "katex-html");
  assert.ok(html);
  assert.equal(html.properties.ariaHidden, undefined);
  assert.equal(collectText(html), "eiπ+1=0");
});

test("a heading without math is left untouched", () => {
  const h = el("h2", {}, [text("Bare tekst")]);
  run({ type: "root", children: [h] });
  assert.equal(collectText(h), "Bare tekst");
  assert.equal(h.children.length, 1);
  assert.equal(h.children[0].type, "text");
});

test("inline math OUTSIDE a heading keeps all three layers (AT + Pagefind)", () => {
  const p = el("p", {}, [text("i brødteksten "), katexInline("x2", "x^2")]);
  run({ type: "root", children: [p] });
  // The mathml + annotation layer must remain so screen readers get the MathML.
  const mathml = findClass(p, "katex-mathml");
  assert.ok(mathml);
  assert.ok(findTag(mathml, "annotation"));
  // The visible layer stays aria-hidden in body text (a11y defers to MathML).
  assert.equal(findClass(p, "katex-html").properties.ariaHidden, "true");
});

test("multiple math spans in one heading each collapse to a single text layer", () => {
  const h = el("h3", {}, [
    text("Både "),
    katexInline("a2", "a^2"),
    text(" og "),
    katexInline("b2", "b^2"),
  ]);
  run({ type: "root", children: [h] });
  assert.equal(collectText(h), "Både a2 og b2");
  // No visually-hidden layer left anywhere in the heading.
  assert.equal(findClass(h, "katex-mathml"), null);
  // Both visible layers survive, both un-hidden.
  const htmls: any[] = [];
  const gather = (n: any) => {
    if (
      n.type === "element" &&
      Array.isArray(n.properties?.className) &&
      n.properties.className.includes("katex-html")
    )
      htmls.push(n);
    (n.children ?? []).forEach(gather);
  };
  gather(h);
  assert.equal(htmls.length, 2);
  for (const html of htmls) assert.equal(html.properties.ariaHidden, undefined);
});
