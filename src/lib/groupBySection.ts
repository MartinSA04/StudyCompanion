/**
 * Group entries by their optional `section`, preserving first-seen order of
 * both sections and entries. Server-side grouping shared in shape by <Glossary>
 * and <FormulaSheet> (the render-time counterpart to filterList's client-side
 * kernel); <Glossary> carries the same algorithm inline.
 *
 * Section-less entries are collected into ONE trailing group so a labelled
 * section is never interrupted by an unlabelled one, and so the heading
 * numbering (`String(i + 1)` over the returned array) stays contiguous: the
 * only group that renders without a heading — `section: ""` — can occur solely
 * when EVERY entry is section-less, where it sits alone at index 0. A group
 * carrying `otherLabel` is a real heading and takes its number like any other.
 *
 * - all entries section-less → one `{ section: "", items }` group (a single
 *   unlabelled list; no heading is manufactured for the whole thing)
 * - all entries sectioned    → the sections in first-seen order
 * - a mix                    → the sections, then one `{ section: otherLabel }`
 *   group holding the section-less entries, placed last
 */
export function groupBySection<T extends { section?: string }>(
  entries: readonly T[],
  otherLabel: string,
): { section: string; items: T[] }[] {
  const sectioned: { section: string; items: T[] }[] = [];
  const unsectioned: T[] = [];
  for (const e of entries) {
    if (e.section) {
      let g = sectioned.find((x) => x.section === e.section);
      if (!g) {
        g = { section: e.section, items: [] };
        sectioned.push(g);
      }
      g.items.push(e);
    } else {
      unsectioned.push(e);
    }
  }
  if (sectioned.length === 0) return [{ section: "", items: unsectioned }];
  if (unsectioned.length === 0) return sectioned;
  return [...sectioned, { section: otherLabel, items: unsectioned }];
}
