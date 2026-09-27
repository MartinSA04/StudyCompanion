/**
 * Duplicate `id`s on a built page. Two elements sharing an id break the
 * anchor: a `#link` lands on the first, and the other's `:target` highlight
 * never fires. The common case is a <Statement> whose name matches a heading
 * on the same page — Astro slugs the heading, the Statement slugs its name —
 * which no source-level check sees reliably, so the integration scans the
 * built HTML in astro:build:done (src/index.ts). Pure, for that scan.
 */

export interface DuplicateId {
  id: string;
  /** Each element carrying it, as `<tag class="…">`, in page order. */
  elements: string[];
}

export function findDuplicateIds(html: string): DuplicateId[] {
  // Script, style and template bodies and comments aren't page elements.
  const markup = html.replace(
    /<(script|style|template)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->/gi,
    "",
  );
  const seen = new Map<string, string[]>();
  for (const m of markup.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const id = /\sid="([^"]*)"/.exec(m[2])?.[1];
    if (!id) continue;
    const cls = /\sclass="([^"]*)"/.exec(m[2])?.[1];
    const el = cls ? `<${m[1]} class="${cls}">` : `<${m[1]}>`;
    seen.set(id, [...(seen.get(id) ?? []), el]);
  }
  return [...seen]
    .filter(([, els]) => els.length > 1)
    .map(([id, elements]) => ({ id, elements }));
}
