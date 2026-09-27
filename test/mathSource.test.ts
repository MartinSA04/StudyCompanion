import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMathSource } from "../src/lib/mathSource.ts";

/**
 * `validateMathSource` fails the build on two MDX math traps that render
 * wrong with no error of their own: a one-line `$$…$$` block (remark-math
 * makes that INLINE math) and a doubled backslash inside `$…$` math in a
 * quoted string prop (there `\\` is a KaTeX line break). Messages name the
 * file and line, like validateXrefs's.
 */
const check = (body: string) =>
  validateMathSource([{ label: "content/sections/03-x.mdx", body }]);

test("a one-line $$…$$ block is an error naming file, line and the fix", () => {
  const errors = check("---\ntitle: X\n---\n\nTekst.\n\n$$E = mc^2$$\n");
  assert.equal(errors.length, 1);
  assert.match(
    errors[0],
    /^content\/sections\/03-x\.mdx:7: a one-line \$\$…\$\$ block/,
  );
  assert.match(errors[0], /line of its own/);
  assert.match(errors[0], /E = mc\^2/);
});

test("fenced $$ blocks and inline math are fine", () => {
  assert.deepEqual(
    check("$$\nE = mc^2\n$$\n\nOg $x$ inline, $$y$$ midt i en setning.\n"),
    [],
  );
  // Indented inside a component body — still only the one-line form counts.
  assert.deepEqual(check("<Example>\n  $$\n  a = b\n  $$\n</Example>\n"), []);
  assert.equal(check("<Example>\n  $$a = b$$\n</Example>\n").length, 1);
});

test("a one-line $$ block inside code is documentation, not a trap", () => {
  assert.deepEqual(
    check(
      "Ikke skriv `$$x$$` alene.\n\n```mdx\n$$E = mc^2$$\n```\n\n~~~\n$$y$$\n~~~\n",
    ),
    [],
  );
});

test("a doubled backslash in $…$ math in a string prop is an error", () => {
  const errors = check(
    'Tekst.\n\n<Quiz\n  question="Hva er $\\\\Theta(n)$ her?"\n  options={["$\\\\Theta(n)$", "b"]}\n  answer={0}\n/>\n',
  );
  assert.equal(errors.length, 1);
  assert.match(
    errors[0],
    /^content\/sections\/03-x\.mdx:4: <Quiz question="…">/,
  );
  assert.match(errors[0], /SINGLE backslashes/);
  // The fix, spelled out: single backslash.
  assert.match(errors[0], /Write \$\\Theta\(n\)\$/);
});

test("single backslashes, expression props and \\\\ before a space pass", () => {
  assert.deepEqual(
    check(
      '<Callout title="Om $\\Theta$">x</Callout>\n' +
        '<Quiz question={"Hva er $\\\\Theta$?"} options={["a"]} answer={0} />\n' +
        '<Table caption="$\\begin{aligned} a \\\\ b \\end{aligned}$" />\n',
    ),
    [],
  );
});

test("a doubled backslash outside math, or in a lowercase HTML tag, is not checked", () => {
  assert.deepEqual(
    check(
      '<Figure alt="C:\\\\Users" src="/x.svg" />\n<img src="/x.svg" alt="$\\\\x$" />\n',
    ),
    [],
  );
});
