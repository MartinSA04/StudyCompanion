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

---

## SCHEMA_VERSION 4 — section `summary` is required

The per-section `summary` moves from optional to **required**.

It was always the module's `<meta name="description">`, its Open Graph
description and its JSON-LD `description`. When it was absent the page fell back
to `"<Title> — <Course title>"`, so a guide with fifteen summary-less modules
shipped fifteen near-identical meta descriptions — duplicate-description warnings
in Search Console, and nothing for a search engine to build a snippet from.
Making it required removes the fallback rather than papering over it.

In the same release, structured data changes shape — **no content change**:

- The overview no longer declares the site to be a `Course` with the university
  as its `provider`. It is now a `LearningResource` (a study guide) `about` a
  `Course`, and `institution` names the provider of **that** referenced course.
  A study guide is about a course; it is not the course, and the old markup
  asserted an institutional authorship the footer disclaimer denies.
- `<Quiz>` and the flashcards page emit schema.org `Quiz` structured data
  (Google's "practice problems" rich result).

Migrate:

1. Give every `content/sections/*.mdx` a `summary:` line. **The build fails
   until you do**, naming the file. Write one sentence for a reader deciding
   whether to open the module — it is what search results will show.
2. Optionally set `author:` (and `authorUrl:`) in `content/course.yaml` to
   populate the JSON-LD `author` and `<meta name="author">`. Omit them and no
   author is emitted, the same no-guessing rule `institution` follows.
3. Set `schemaVersion: 4` in `content/course.yaml`.

Additive since 4.0 (no migration, available when present):

- `course.exams[].date` also accepts a **month-precision** `YYYY-MM` (v4.6.0)
  alongside the existing `YYYY-MM-DD`. Use it for a paper whose exam day is not
  published anywhere — several institutes name a set after the semester
  (`…_221200`) and print no date on it. The row still sorts into the right
  place, and the Eksamen page renders "august 2022" rather than a guessed day.
  Existing `YYYY-MM-DD` entries are unaffected.
- `course.symbols[]` — `{ tex, meaning, unit?, note?, section?, id?, term?,
  formula? }` (v4.7.0) → renders the **Symboler** page, a textbook-style list of
  symbols (symbol · meaning · unit) with search over the TeX and its plain
  spelling. `term` links a row to its glossary headword and `formula` to a
  `formulas[].id` (both validated at build); `id` makes the row a
  `/symboler#id` target. The page exists only when the list is non-empty. The
  slug `symboler` joins the reserved tool slugs, so a section file named
  `NN-symboler.mdx` now fails the build — rename it.
- `course.exams[].id` + `<ExamRef id task?>` (v4.8.0) → an inline link from an
  exam task quoted in a module straight to the paper (`exams[].url`, new tab).
  The id follows the `formulas[].id` rule; the build fails on a dead or
  duplicate id, or on a reference to a paper with no `url`. `ui.examTaskLabel`
  (default «oppgave») is the word before the task number. `AUTHORING.md` §3
  makes quoting past-exam tasks this way standard practice.

---

## SCHEMA_VERSION 5 — `onSheet` is the only formula-sheet switch

`course.formulas[].memorize` and its «må pugges» badge are gone. A formula now
carries one sheet fact, `onSheet`: is it on the formula sheet handed out at the
exam? `onSheet: false` puts a «Ikke på formelarket» tag above the formula.

«Må pugges» was an instruction, and often a wrong one: an off-sheet formula that
follows from formulas on the sheet need not be learned by heart, so courses left
it unflagged and the reader saw nothing. «Ikke på formelarket» is a fact that
holds for every off-sheet row. The tag sits on its own line above the formula,
in the formula's column, because a badge beside the description took ~100–180 px
from the narrowest cell in the row (on TFE4146's Formelsamling, 37 of 38 marked
rows grew taller, 24 % of the list).

In the same release:

- `ui.memorizeLabel` is replaced by `ui.offSheetLabel` (default «Ikke på
  formelarket»). It names both the third filter chip and the tag, so a course
  in `nn`/`en` translates both at once — the old badge text was hard-coded.
- The filter chips appear when the list has both on- and off-sheet formulas
  (they used to need a `memorize` row).
- The tag never appears when `exam.formulaSheet` is `false`, in modules too.

Migrate:

1. Delete every `memorize:` key from `content/course.yaml` `formulas[]`. **The
   build fails until you do** (strict schema). Keep `onSheet: false` on those
   rows; they get the tag.
2. If you overrode `ui.memorizeLabel`, rename it to `ui.offSheetLabel` and
   reword it as a fact («Ikke på formelarket»), not an instruction.
3. In MDX, replace `<Formula … memorize />` with `<Formula … onSheet={false} />`.
   A leftover `memorize` prop fails the build with that hint.
4. Set `schemaVersion: 5` in `content/course.yaml`.
