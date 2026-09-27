import { relative } from "node:path";

/**
 * Fail the build on a KaTeX error in MDX-body math (`$…$` / `$$` blocks).
 *
 * rehype-katex never throws: on a parse error it records a vfile message
 * (source "rehype-katex") and renders KaTeX's red fallback, so a typo like
 * `\thetq` or an unbalanced brace ships on a green build. Registered right
 * after rehypeKatex, this reads those messages and — in `astro build` — throws
 * one error naming each file:line, the source TeX and KaTeX's message. In
 * `astro dev` it only warns: the page must keep rendering while an author
 * types (the red fallback marks the spot on screen). Component-rendered math
 * is checked separately (renderTex in lib/katex.ts).
 */
type HastNode = {
  type: string;
  value?: string;
  children?: HastNode[];
};
type KatexMessage = {
  source?: string | null;
  reason: string;
  line?: number | null;
  cause?: unknown;
  ancestors?: HastNode[] | null;
};

const textOf = (n: HastNode): string =>
  n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(textOf).join("");

export function rehypeKatexErrors(options: { fail?: boolean } = {}) {
  return (
    _tree: unknown,
    file: { path?: string; messages: KatexMessage[] },
  ): void => {
    const found = file.messages.filter((m) => m.source === "rehype-katex");
    if (!found.length) return;
    const where = file.path ? relative(process.cwd(), file.path) : "(mdx)";
    const lines = found.map((m) => {
      const math = m.ancestors?.at(-1);
      const tex = math ? textOf(math).trim() : "";
      const why = m.cause instanceof Error ? m.cause.message : m.reason;
      return `${where}${m.line ? `:${m.line}` : ""}: KaTeX could not render "${tex}" — ${why}`;
    });
    const msg =
      "study-companion: KaTeX errors in MDX math —\n" +
      lines.map((l) => `  • ${l}`).join("\n");
    if (options.fail) throw new Error(msg);
    console.warn(`[study-companion] ${msg}`);
  };
}
