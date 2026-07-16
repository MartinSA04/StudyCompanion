import { test } from "node:test";
import assert from "node:assert/strict";
import { rehypeTableScroll } from "../src/lib/rehype-table-scroll.ts";
import { rehypeKatexScroll } from "../src/lib/rehype-katex-scroll.ts";

/**
 * Hand-built hast trees exercise the walker directly (no MDX pipeline). The
 * plugin returns a transformer that mutates the tree in place.
 */
const run = (tree: any) => {
  rehypeTableScroll()(tree);
  return tree;
};

const el = (tagName: string, props: any = {}, children: any[] = []) => ({
  type: "element",
  tagName,
  properties: props,
  children,
});
const table = () => el("table", {}, [el("tbody")]);

const isWrapper = (node: any) =>
  node.type === "element" &&
  node.tagName === "div" &&
  Array.isArray(node.properties?.className) &&
  node.properties.className.includes("table-scroll");

test("a bare table is wrapped in a div.table-scroll", () => {
  const root = { type: "root", children: [table()] };
  run(root);
  assert.equal(root.children.length, 1);
  const wrapper = root.children[0];
  assert.ok(isWrapper(wrapper));
  // Keyboard-focusable so the scroll viewport can be reached without a pointer.
  assert.equal(wrapper.properties.tabIndex, 0);
  assert.equal(wrapper.children.length, 1);
  assert.equal(wrapper.children[0].tagName, "table");
});

test("an already-wrapped table (className array) is not double-wrapped", () => {
  const root = {
    type: "root",
    children: [el("div", { className: ["table-scroll"] }, [table()])],
  };
  run(root);
  const wrapper = root.children[0];
  assert.ok(isWrapper(wrapper));
  // Still exactly one table inside, not a wrapper-inside-a-wrapper.
  assert.equal(wrapper.children.length, 1);
  assert.equal(wrapper.children[0].tagName, "table");
});

test("an already-wrapped table (className string) is not double-wrapped", () => {
  const root = {
    type: "root",
    children: [el("div", { className: "table-scroll" }, [table()])],
  };
  run(root);
  const wrapper = root.children[0];
  assert.equal(wrapper.tagName, "div");
  assert.equal(wrapper.children.length, 1);
  assert.equal(wrapper.children[0].tagName, "table");
});

test("a nested table (inside a non-wrapper element) is still wrapped", () => {
  const root = {
    type: "root",
    children: [el("section", {}, [el("div", {}, [table()])])],
  };
  run(root);
  const inner = root.children[0].children[0]; // the plain div
  assert.ok(isWrapper(inner.children[0]));
  assert.equal(inner.children[0].children[0].tagName, "table");
});

/**
 * rehypeKatexScroll stamps tabindex on the display-math block that owns the
 * overflow-x:auto viewport, so it too can be scrolled from the keyboard.
 */
const runKatex = (tree: any) => {
  rehypeKatexScroll()(tree);
  return tree;
};

test("a .katex-display block (className array) is stamped tabindex=0", () => {
  const node = el("span", { className: ["katex-display"] }, [el("span")]);
  runKatex({ type: "root", children: [node] });
  assert.equal(node.properties.tabIndex, 0);
});

test("a .katex-display block (className string) is stamped tabindex=0", () => {
  const node = el("span", { className: "katex-display" });
  runKatex({ type: "root", children: [node] });
  assert.equal(node.properties.tabIndex, 0);
});

test("a nested .katex-display block is still stamped", () => {
  const node = el("span", { className: ["katex-display"] });
  runKatex({ type: "root", children: [el("p", {}, [node])] });
  assert.equal(node.properties.tabIndex, 0);
});

test("a non-display .katex block is left untouched", () => {
  const node = el("span", { className: ["katex"] });
  runKatex({ type: "root", children: [node] });
  assert.equal(node.properties.tabIndex, undefined);
});
