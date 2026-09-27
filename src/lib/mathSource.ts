/**
 * Build-time checks for two math traps in MDX source that render WRONG without
 * any error — so a production build ships them green unless something looks.
 * Called next to validateXrefs (src/pages/index.astro), which fails the build
 * on any message here and only logs in DEV.
 *
 *   1. A one-line `$$…$$` block. remark-math makes display math only from `$$`
 *      fences on lines of their own; `$$x$$` on one line is INLINE math, so the
 *      "display" formula renders small and mid-paragraph.
 *   2. A doubled backslash inside `$…$` math in a quoted string prop
 *      (`question="…$\\Theta$…"`). JSX string attributes take no escapes, so
 *      the TeX really is `\\Theta`: a KaTeX line break followed by the letters
 *      "Theta". Expression props (`{"…$\\Theta$…"}`) are JS strings, where the
 *      doubled form IS right, and are not checked.
 *
 * TeX that fails to parse at all is the third trap; KaTeX reports that itself
 * and the integration fails the build on it (lib/katex.ts `renderTex`, the
 * rehype check in src/index.ts).
 *
 * Kept pure (no Astro/fs imports) so it is unit-testable in isolation.
 */

export interface MathSourceInput {
  /** Used in messages — the section's file path, e.g. content/sections/03-x.mdx. */
  label: string;
  /** The whole file (frontmatter included), so reported line numbers are exact. */
  body: string;
}

/**
 * Blank out fenced code blocks and inline code spans (keeping every newline,
 * so offsets and line numbers still point into the original file), plus a
 * leading YAML frontmatter block — documentation that SHOWS a trap must not
 * trip it.
 */
function maskCode(body: string): string {
  const blank = (s: string) => s.replace(/[^\n]/g, " ");
  return body
    .replace(/^---\n[\s\S]*?\n---(?=\n|$)/, blank)
    .replace(
      /^[ \t]*(`{3,}|~{3,})[^\n]*\n(?:[\s\S]*?\n)?[ \t]*\1[^\n]*$/gm,
      blank,
    )
    .replace(/`[^`\n]*`/g, blank);
}

const lineAt = (text: string, index: number) =>
  text.slice(0, index).split("\n").length;

/** The same `$…$` / `$$…$$` split renderMathString uses (lib/katex.ts). */
const MATH_SPAN = /\$\$[^$]*\$\$|\$[^$]+\$/g;

/**
 * Every quoted string attribute of a capitalised MDX component tag (`<Quiz`,
 * `<Callout` …): lowercase tags are HTML, and restricting to components keeps
 * a `$x<y$` in prose from being read as a tag. Walks the tag to its closing
 * `>`, skipping `{…}` expression props (and strings inside them) whole.
 */
function* stringProps(
  text: string,
): Generator<{ tag: string; prop: string; value: string; index: number }> {
  const open = /<([A-Z][\w.]*)/g;
  let m: RegExpExecArray | null;
  while ((m = open.exec(text))) {
    let i = m.index + m[0].length;
    let depth = 0;
    while (i < text.length) {
      const c = text[i];
      if (depth === 0 && c === ">") break;
      if (c === '"' || c === "'" || (depth > 0 && c === "`")) {
        // A JSX attribute string has no escapes; a JS string inside {…} does.
        let end = text.indexOf(c, i + 1);
        while (depth > 0 && end > 0 && text[end - 1] === "\\")
          end = text.indexOf(c, end + 1);
        if (end < 0) break;
        const name = /([A-Za-z_][\w-]*)\s*=\s*$/.exec(
          text.slice(Math.max(0, i - 80), i),
        );
        if (depth === 0 && name) {
          yield {
            tag: m[1],
            prop: name[1],
            value: text.slice(i + 1, end),
            index: i + 1,
          };
        }
        i = end + 1;
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") depth = Math.max(0, depth - 1);
      i++;
    }
    open.lastIndex = Math.max(open.lastIndex, i);
  }
}

export function validateMathSource(sections: MathSourceInput[]): string[] {
  const errors: string[] = [];
  for (const { label, body } of sections) {
    const text = maskCode(body);

    // 1. A line that is nothing but `$$…$$`.
    text.split("\n").forEach((line, i) => {
      const t = line.trim();
      if (!/^\$\$[\s\S]*\$\$$/.test(t) || t.length <= 4) return;
      const inner = t.slice(2, -2);
      if (inner.includes("$$") || !inner.trim()) return;
      errors.push(
        `${label}:${i + 1}: a one-line $$…$$ block renders as INLINE math — remark-math only makes display math when each $$ fence sits on a line of its own. Write it as three lines: $$, then ${inner.trim()}, then $$.`,
      );
    });

    // 2. A doubled backslash before a letter, in `$…$` math, in a string prop.
    for (const { tag, prop, value, index } of stringProps(text)) {
      for (const math of value.matchAll(MATH_SPAN)) {
        const bad = /\\\\[A-Za-z]/.exec(math[0]);
        if (!bad) continue;
        const line = lineAt(text, index + math.index! + bad.index);
        const fixed = math[0].replace(/\\\\(?=[A-Za-z])/g, "\\");
        errors.push(
          `${label}:${line}: <${tag} ${prop}="…"> contains ${math[0]}, but a string prop takes SINGLE backslashes — \\\\ there is a KaTeX line break, so the command after it renders as plain letters. Write ${fixed}, or pass the prop as an expression {"…"}, where backslashes are doubled.`,
        );
      }
    }
  }
  return errors;
}
