import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * `mdx-components.ts` imports `.astro` single-file components, which Node can't
 * execute outside the Astro/Vite pipeline — the demo `pnpm build` is what proves
 * they render. This is the static guard instead: every import must resolve to a
 * real file on disk, and every imported widget must be registered in the
 * exported map (and vice versa). It catches the two real regressions — a renamed
 * component file, or importing a widget but forgetting to expose it.
 */
const srcDir = fileURLToPath(new URL("../src/", import.meta.url));
const source = readFileSync(srcDir + "mdx-components.ts", "utf8");

const imports = [...source.matchAll(/import\s+(\w+)\s+from\s+"(.+?)"/g)].map(
  (m) => ({ name: m[1], path: m[2] }),
);

const mapBlock = /export const mdxComponents = \{([\s\S]*?)\}/.exec(source);
const registered = new Set(
  (mapBlock?.[1] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

test("mdx-components imports at least the known widget set", () => {
  assert.ok(imports.length >= 12, `only found ${imports.length} imports`);
});

test("every imported component file exists on disk", () => {
  for (const { name, path } of imports) {
    const abs = srcDir + path.replace(/^\.\//, "");
    assert.ok(existsSync(abs), `${name}: missing file ${path}`);
  }
});

test("imported names and registered names match exactly", () => {
  const imported = new Set(imports.map((i) => i.name));
  for (const name of imported)
    assert.ok(registered.has(name), `${name} imported but not registered`);
  for (const name of registered)
    assert.ok(imported.has(name), `${name} registered but not imported`);
});
