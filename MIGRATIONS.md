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
- `course.examArchive` — `{ url, label? }` → a "full archive" row appended to
  **ExamList** + a curated-selection note (`ui.examArchiveNote`) above it.
- `course.exam.formulaSheet` — boolean, default `true`. Set `false` for a
  closed-book exam: the **Formelsamling** page shows a "no sheet provided" notice
  and drops the on-sheet/must-memorize chips + badges (no need to mark every
  formula). Pair with `ui.noFormulaSheetNote` to localize the notice.
- `ui.formulaSheetLabel` — heading for the formula-sheet section (default "Formelsamling").
- `ui.noFormulaSheetNote` — notice text shown when `exam.formulaSheet: false`.
- `<Simulation>` / `<Stepper>` MDX widgets + the course `public/sims/` &
  `public/steppers/` scaffold contracts.

---

## SCHEMA_VERSION 2 — drop `estMinutes`

The per-section `estMinutes` reading-time estimate was removed. Reading time is a
poor fit for study material — it measures passive reading, not the time to work
through the math, worked examples and self-tests — so the number was misleading,
and the importance tag (`Kjernepensum` / `Pensum` / `Tilleggsstoff`) already
carries the useful "what should I prioritise?" signal.

Migrate:

1. Set `schemaVersion: 2` in `content/course.yaml`. **The build fails until you
   do** (older content vs. newer framework is a hard error).
2. Remove any `estMinutes:` line from section frontmatter (`content/sections/*.mdx`).
   This is cleanup, not strictly required — the key is now ignored rather than
   rejected — but it no longer renders anything, so leave nothing dangling.

The module header and overview tiles now show only the importance tag (plus any
extra `tags[]`); nothing else changes.
