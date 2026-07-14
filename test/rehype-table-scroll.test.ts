import { test } from "node:test";
import assert from "node:assert/strict";
import { rehypeTableScroll } from "../src/lib/rehype-table-scroll.ts";

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
