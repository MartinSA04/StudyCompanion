/**
 * The shared client-side filter kernel behind <Glossary> and <FormulaSheet>:
 * both toggle each row's `hidden` from a predicate, collapse any group whose
 * rows are all hidden, and flip a single empty-state element. Each widget keeps
 * its own extras (the sheet's chips, the glossary's sr-status) around this core.
 */
export interface FilterList {
  /** Every filterable row, in document order. */
  rows: HTMLElement[];
  /** Group wrappers; each collapses when all its rows are hidden. */
  groups: HTMLElement[];
  /** Selector for a row *within* a group (e.g. `.fs-row`). */
  rowSelector: string;
  /** Empty-state element, revealed when nothing matches (or null). */
  empty: HTMLElement | null;
  /** Row match test — a row is shown iff this returns true. */
  predicate: (row: HTMLElement) => boolean;
}

/** Apply `predicate` to every row; returns the count still visible. */
export function filterList({
  rows,
  groups,
  rowSelector,
  empty,
  predicate,
}: FilterList): number {
  let visible = 0;
  rows.forEach((r) => {
    const show = predicate(r);
    r.hidden = !show;
    if (show) visible++;
  });
  groups.forEach((g) => {
    g.hidden = ![...g.querySelectorAll<HTMLElement>(rowSelector)].some(
      (r) => !r.hidden,
    );
  });
  if (empty) empty.hidden = visible > 0;
  return visible;
}
