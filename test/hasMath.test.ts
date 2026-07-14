import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bodyHasMath, stringsHaveMath } from "../src/lib/hasMath.ts";

/**
 * `bodyHasMath` gates the KaTeX preload on a module body. Erring is
 * one-directional (a false positive only wastes a preload), so these assert the
 * two must-not-regress ends: a widget-only body still registers, and prose with
 * a lone `$` does not.
 */

test("bodyHasMath: a math widget with no `$` still counts", () => {
  assert.equal(bodyHasMath("Text\n\n<Formula tex='x^2' />\n"), true);
  assert.equal(bodyHasMath("<Statement>foo</Statement>"), true);
});

test("bodyHasMath: inline $…$ and display $$…$$ both count", () => {
  assert.equal(bodyHasMath("The angle $\\theta$ is small."), true);
  assert.equal(bodyHasMath("$$\\int_0^1 x\\,dx$$"), true);
});

test("bodyHasMath: prose with a lone `$` (a price) does not count", () => {
  assert.equal(bodyHasMath("The book costs $5 at the store."), false);
});

test("bodyHasMath: empty / undefined body is false", () => {
  assert.equal(bodyHasMath(undefined), false);
  assert.equal(bodyHasMath(""), false);
});

test("stringsHaveMath: true iff any string carries a real math span", () => {
  assert.equal(stringsHaveMath(["plain", "$x$"]), true);
  assert.equal(stringsHaveMath(["plain", undefined]), false);
  assert.equal(stringsHaveMath(["a lone $ sign"]), false);
});

/**
 * Drift guard. `MATH_WIDGET_TAGS` (private to hasMath.ts) is a net over the
 * author-facing widgets whose math never appears as a `$` in source. Every such
 * tag MUST be a real `mdxComponents` key or the net matches a tag no author can
 * write. `PanelHeader` is the one deliberate exception: it is an INTERNAL
 * building block (rendered by Example/Simulation/Stepper, never registered in
 * mdxComponents), listed only so a body that reaches it via those widgets keeps
 * the preload. If a future edit makes PanelHeader author-facing (registers it)
 * or drops it from the net, this guard's exception list must be revisited.
 */
const INTERNAL_TAGS = new Set(["PanelHeader"]);

test("every author-facing MATH_WIDGET_TAG is a registered mdx component", () => {
  const hasMathSrc = readFileSync(
    fileURLToPath(new URL("../src/lib/hasMath.ts", import.meta.url)),
    "utf8",
  );
  const block = /const MATH_WIDGET_TAGS = \[([\s\S]*?)\]/.exec(hasMathSrc);
  assert.ok(block, "could not locate MATH_WIDGET_TAGS array");
  const tags = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(tags.length >= 8, `only parsed ${tags.length} tags`);

  // mdx-components.ts imports `.astro` files Node can't execute; read its map
  // as text (same approach as mdx-components.test.ts) to list registered names.
  const mdxSrc = readFileSync(
    fileURLToPath(new URL("../src/mdx-components.ts", import.meta.url)),
    "utf8",
  );
  const mapBlock = /export const mdxComponents = \{([\s\S]*?)\}/.exec(mdxSrc);
  const registered = new Set(
    (mapBlock?.[1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  for (const tag of tags) {
    if (INTERNAL_TAGS.has(tag)) {
      assert.ok(
        !registered.has(tag),
        `${tag} is listed as internal but is now a registered mdx component — update the exception`,
      );
      continue;
    }
    assert.ok(
      registered.has(tag),
      `${tag} is in MATH_WIDGET_TAGS but not an mdx component — authors can't write it`,
    );
  }
});
