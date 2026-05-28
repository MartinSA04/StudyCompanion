/**
 * A stable, ASCII anchor slug. Norwegian æ/ø/å are mapped to ae/o/a; any other
 * non-ASCII run collapses to a separator (good enough — slugs only need to be
 * stable + unique). `$math$` and inline HTML are stripped first.
 *
 * Single source of truth for anchor ids so cross-referencing widgets agree:
 * `<Statement>` results, `<Glossary>`/`<Term>` and `<FormulaRef>` all slug the
 * same way, so a link built on one side resolves to the anchor built on the other.
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\$[^$]*\$/g, " ") // drop math
    .replace(/<[^>]*>/g, " ") // drop inline html
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
