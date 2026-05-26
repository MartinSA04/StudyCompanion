# Migrations

Each entry documents what a **course** repo must change to move across a breaking
(`SCHEMA_VERSION`-bumping, i.e. **major**) framework release. The injected page
fails the build with a clear message when `course.schemaVersion` doesn't match
the framework's `SCHEMA_VERSION`, so a mismatch is never silent.

> SemVer reminder: breaking schema change → **major** (bump `SCHEMA_VERSION` here);
> new optional field or widget → **minor** (no migration needed); fix → **patch**.

---

## SCHEMA_VERSION 1 — initial

Set `schemaVersion: 1` in `content/course.yaml`. Required: `code`, `title`, `term`.
Everything else is optional with sensible defaults (see `README.md`).

Additive since the first tag (no migration, available when present):
- `course.formulas[]` — `{ tex, label?, section?, onSheet?, memorize? }` → renders the
  **Formelsamling** section + auto-generated flashcards. `memorize: true` (with
  `onSheet: false`) flags "må pugges" and enables the on-sheet/memorize filter.
- `course.exams[]` — `{ label, date?, url?, solutionUrl? }` → renders **ExamList**.
- `ui.formulaSheetLabel` — heading for the formula-sheet section (default "Formelsamling").
- `<Simulation>` MDX widget + the course `public/sims/` scaffold contract.

_No migrations have been required yet; this section will grow when a future major
release changes the schema._
