# Migrations

Each entry documents what a **course** repo must change to move across a breaking
(`SCHEMA_VERSION`-bumping, i.e. **major**) framework release. `loadCourse`
(`src/lib/loadCourse.ts`) fails the build with a clear message when
`course.schemaVersion` doesn't match the framework's `SCHEMA_VERSION`, so a
mismatch is never silent.

> SemVer reminder: breaking schema change → **major** (bump `SCHEMA_VERSION` here);
> new optional field or widget → **minor** (no migration needed); fix → **patch**.

---

## SCHEMA_VERSION 1 — initial

Set `schemaVersion: 1` in `content/course.yaml`. Required: `code`, `title`, `term`.
Everything else is optional with sensible defaults (see `README.md`).

Additive since the first tag (no migration, available when present):

- `course.formulas[]` — `{ tex, label?, section?, onSheet?, memorize?, id? }` →
  renders the **Formelsamling** page; an `id` makes the row a deep-link target
  for inline `<FormulaRef>` anchors. `memorize: true` (with `onSheet: false`)
  flags "må pugges" and enables the on-sheet/memorize filter chips.
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

---

## SCHEMA_VERSION 3 — strict schemas, required `schemaVersion`, `tags[]` → `tag`

Contract-tightening changes that land together:

- **`schemaVersion` is required** (no default). Defaulting it to the framework's
  own version made the skew guard vacuous — a course that omitted the field
  could never fail it. Every course must state the version its content was
  written against.
- **Unknown keys are rejected** everywhere (`course.yaml`, section frontmatter,
  `flashcards.yaml`): a typo'd key now fails the build naming the key instead of
  being silently ignored. This includes `estMinutes`, which v2 removed but
  tolerated — it is now an error like any other unknown key.
- **Section `tags[]` (array) is replaced by `tag` (single optional string)** —
  its real contract all along: a short kicker label on the module's overview
  tile (e.g. a week or theme marker). It renders nowhere else. Flashcard _card_
  `tags` are a different field and are unchanged.
- The build now also enforces section-shape invariants: unique `order` values,
  unique derived slugs, no slug colliding with a reserved tool slug
  (`formelsamling`, `begreper`, `flashcards`, `eksamen`), and no stray
  subdirectories or non-`*.mdx` files in `content/sections/`. Previously these
  were silently misrendered or skipped; each failure names the offending files.
- **Caption/label strings escape raw HTML.** Text on the KaTeX string path
  (`<Formula caption>`, `<Quiz>` texts, `<Table>` cells, formula `label`,
  glossary `definition`, flashcard faces, …) previously passed _any_ markup
  through verbatim — so a bare `<`, `>` or `&` (e.g. `n<m`) silently swallowed
  the rest of the string. Now everything is escaped except the documented
  simple-inline tags `<b> <i> <em> <strong> <sub> <sup> <code> <br>`
  (attribute-less, open/close). Anything else — `<a href>`, `<span class>`,
  `<mark>` — renders as visible text after the upgrade; rewrite it with the
  whitelist or move it into the section body (real MDX).

Migrate:

1. In section frontmatter (`content/sections/*.mdx`): replace `tags: [X, …]`
   with `tag: X` (keep the one label worth showing on the tile, drop the rest),
   or delete the line entirely — `tag` is optional.
2. Delete any remaining `estMinutes:` line from section frontmatter (required
   now — the build rejects the key).
3. Remove any other key the build names as unknown (it never did anything).
4. Set `schemaVersion: 3` in `content/course.yaml`. **The build fails until you
   do** (older content vs. newer framework is a hard error).

In the same release, client-side storage changes shape — **no content change**:
reading progress is now keyed by section slug (legacy `order`-number records
map order → slug against the rendered nav; entries matching no current section
are pruned), and flashcard ratings by a content hash of the card. Both get a
one-time automatic client migration on first visit — the stored record is
rewritten in the new shape — so readers keep their progress and ratings, and
renumbering sections no longer shifts done-marks between modules.
