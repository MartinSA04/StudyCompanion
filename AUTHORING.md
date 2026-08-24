# Authoring a course

This is the guide for **writing course content** with study-companion — the
primary brief for a content author, including an authoring agent. It tells you
*how to write a good module* and *which widget to reach for*; for the exhaustive
prop reference and architecture see `README.md`.

> **Read [`WRITING.md`](WRITING.md) too, before drafting prose.** It is the rules
> for the *words*: who the reader is, the per-module length budget, plain-language
> and terminology rules, the register these guides never use, and the design rules
> a course-owned simulation must follow. This file covers mechanics; that one
> covers the writing itself, and it is equally binding.
>
> Start a new course from `course-template/` (`npx degit
> MartinSA04/StudyCompanion/course-template course-mycode`). It encodes
> everything below by example.

---

## 1. Mental model

A course is **data**, not a website. You author a `course.yaml` plus
`sections/*.mdx` under `content/`, and the framework owns **all** design, schema,
page wiring, and widgets. Concretely:

- **Never edit the framework from a course repo.** No components, pages, layouts,
  styles, or toolchain config live in a course. If a widget is missing, add it to
  the framework and bump the pinned tag — don't hand-roll HTML in a section.
- **Everything renders from the schema.** Formulas, glossary, exams, links and
  metadata live in `course.yaml`; prose lives in `sections/`. Keeping data in the
  schema is what powers the Formelsamling, Begreper, Eksamen and Flashcards pages
  for free.
- **Static-first.** Math renders server-side (KaTeX); interactivity is a few small
  islands that degrade without JS.

See also: `README.md` (widget + `course.yaml` reference), `MIGRATIONS.md`
(per-release content migrations when you move the pin).

---

## 2. Workflow

1. **`course.yaml` first.** Identity (`code`, `title`, `term`, `language`),
   `accent` + `accentDark`, `courseUrl`, the `exam` block, and the `formulas` /
   `glossary` you already know. This is the spine everything hangs off. Also set
   **`site`** in `astro.config.mjs` to the guide's public origin — the framework
   needs it for the canonical link, social cards and the sitemap.
2. **Outline the sections** by `order` (and optional `part` for chapters). One
   `NN-slug.mdx` per module. Sketch the brief for each first — see
   `course-template/SECTION-BRIEF.md`.
3. **Draft each module against an archetype** (§4). Write prose, place widgets.
4. **Wire cross-references** — `<Term>`, `<FormulaRef>`, `<Statement>` ids — so
   prose links to the canonical definition instead of repeating it.
5. **Verify** against the definition-of-done (§8): `pnpm build` (which *fails* on
   a dead cross-reference), then read the module in both themes.

---

## 3. Widget decision guide

Reach for a widget by intent. All are global in MDX — **no imports**.

| Want to … | Use |
|---|---|
| State a formula (with caption / "må pugges" badge) | `<Formula>` |
| Show a captioned, numbered diagram/image | `<Figure>` |
| Point at a YouTube video that shows something you cannot draw | `<Video>` — see below |
| Frame a named law / theorem / definition / principle (anchored) | `<Statement>` |
| Link a word in prose to the glossary | `<Term name="…">` |
| Link prose to a formula's row in the Formelsamling | `<FormulaRef id="…">` |
| Give a worked example with a hidden solution | `<Example>` + `<Solution>` + `<Answer>` |
| Lay out a step-by-step procedure / method | `<Steps>` + `<Step>` |
| Offer graduated hints (nudge → method → solution) | `<Hints>` + `<Hint>` |
| Compare 2–3 concepts side by side | `<Compare>` + `<CompareCol>` |
| Lay out a reference / complexity table (math cells, scrolls) | `<Table>` |
| List module objectives / exam priorities | `<LearningGoals>` / `<ExamFocus>` |
| Recap at the end of a module | `<KeyTakeaways>` |
| Add a note / tip / warning | `<Callout type="…">` |
| Drop a short aside / cross-ref in the margin | `<Sidenote>` |
| Hide a long derivation behind a toggle | `<Derivation>` |
| Pose a quick self-test or MCQ | `<SelfCheck>` / `<Quiz>` |
| Show code (syntax-highlighted, copy button) | `` ```lang `` fence, or `<CodeBlock>` for a title/active line |
| **Illustrate a dynamic / interactive concept** | a **course-owned `<Simulation>`** — see §5 |
| **Animate stepping through code** | `<CodeBlock>` driven by a `<Simulation>` — see §5 |

When in doubt, prefer the most specific widget: it carries the consistent design,
a11y, and (for `<Statement>`/`<Term>`/`<FormulaRef>`) the cross-ref anchors.

### `<Video>` — borrowed explanation, on two conditions

Some things are far easier to watch than to read, and someone has often already
made that video. `<Video>` embeds one as a click-to-load facade: a text-only card
until the reader clicks, so nothing reaches Google on a plain page view.

```mdx
<Video
  id="https://youtu.be/WUvTyaaNkzM?t=95"
  title="The essence of calculus"
  channel="3Blue1Brown"
  duration="17:04"
  caption="Hvorfor arealet under en kurve og stigningstallet er samme spørsmål."
  number={1}
/>
```

Paste the share link as `id` — a watch URL, a youtu.be link, with or without a
`?t=` timestamp. The build reads the video id out of it and fails on a link it
cannot parse. Type `title`, `channel` and `duration` from the video page: the
card is built from your text, not from YouTube's thumbnail.

Two conditions on using it at all:

1. **The module must stand alone.** A reader who never clicks must still get the
   full argument from your prose. Never write "see the video for the derivation".
   The video adds intuition or motion; it never carries the load.
2. **The link can rot and nothing will tell you.** Unlike `<Figure>`, which fails
   the build on a missing file, a video that is deleted or set to private cannot
   be detected at build time. Prefer stable channels with a long track record,
   and re-check your `<Video>` links when you revise a course.

---

## 4. Module archetypes & section anatomy

Three starting shapes — **not rigid rules**. Each ships as a worked example
section in `course-template/content/sections/`.

### Concept module — introduce and explain one idea

`<LearningGoals>` → core prose with `<Formula>` / `<Statement>` / `<Figure>` →
(optional `<Simulation>` for a dynamic concept) → `<Example>` →
`<SelfCheck>`/`<Quiz>` → `<KeyTakeaways>`. Usually `importance: core`.

### Method / problem module — teach a procedure for a problem type

`<Steps>` → a worked `<Example>` with `<Solution>`/`<Answer>` → a `<Hints>` ladder
→ `<SelfCheck>`. Usually `importance: core`.

### Reference / overview module — summarise and contrast

`<Compare>` tables and tight prose that links out via `<Term>`/`<FormulaRef>`
rather than re-deriving. Usually `importance: useful` or `extra`.

**Headings start at `##`.** The page shell renders the module title as the
`<h1>`, so a module's own sections are `##` and a subsection inside one is
`###`. The in-page table of contents reads exactly those two levels and indents
`###` beneath `##` — open a module at `###` and you skip a heading level *and*
flatten every section into a sub-item with no parent.

**Section frontmatter** is the contract — `order` (the source of truth for
sequence, not the filename), `title`, `summary` (**required**: it is the
module's meta description and its search-result snippet — write one sentence for
a reader deciding whether to open it), `importance`, optional `tag`
(a single kicker label on the overview tile — e.g. "Uke 3"; renders nowhere
else), `num`, `part`, `updated`, plus `draft: true` (hide the module from
**production** builds while you draft it — still visible in `astro dev`) and
`noindex: true` (keep it in-site but out of search + the sitemap). The schema is
**strict**: an unknown or misspelled frontmatter key **fails the build** naming
the key, rather than being silently ignored. Section files must be **flat
`*.mdx`** directly under `content/sections/` — a nested folder or a `.md` stray
now errors at build time instead of vanishing from the guide.

---

## 5. Course-owned simulations & sim-driven code

Interactive simulations live in the **course** repo so the framework carries no
per-course code. Put an ES module in `public/sims/` and mount it:

```mdx
<Simulation src="/sims/thin-lens.js" title="Tynnlinse" height={300} />
```

The module default-exports `init(api)`, called when the figure scrolls into view:

```js
export default function init({ canvas, ctx, controls, getSize, onResize }) {
  function draw() { const { w, h } = getSize(); /* paint in CSS px */ }
  onResize(draw); // framework re-runs after a DPR resize / theme change
  draw();
}
```

`api = { canvas, ctx, controls, getSize, onResize, codeBlock, signal }`. The
context is pre-scaled for `devicePixelRatio`, so you work in CSS pixels; the
framework owns the chrome, sizing, and lazy mount. `signal` is a page-lifecycle
`AbortSignal` that fires when the page is swapped out (view transitions): stop
any `requestAnimationFrame` loop or timer on it — or bind listeners with `{
signal }` — so a navigated-away sim doesn't keep painting a detached canvas.

The `src` is checked **at build time**: a root-relative path (`/sims/…`) that
doesn't resolve to a real file under the course's `public/` **fails the build**,
so a typo can't ship a green build with a permanently dead widget. The same
check covers `<Stepper src>`.

**Sim-driven code stepping.** Give a `<CodeBlock>` an `id` and a simulation can
walk its highlighted line(s) in lockstep with what it paints:

```mdx
<CodeBlock id="sum-loop" lang="js" activeLine={2} code={`…`} />
<Simulation src="/sims/code-step.js" title="Steg gjennom løkka" />
```

```js
export default function init({ codeBlock /* … */ }) {
  const code = codeBlock("sum-loop"); // controller for that block (or null)
  code?.setActiveLine(4);             // highlight line 4
  // also: setActiveLines([3,4]), clear()
}
```

### Stepped algorithm traces — `<Stepper>`

For **algorithms you step through**, prefer `<Stepper>` over a hand-rolled
`<Simulation>`: the framework owns the whole player (transport, scrubber, speed,
step caption, code-line sync + a variable strip on the linked code block,
keyboard, a11y) and
the render *stage*. The course module (in `public/steppers/`) supplies only the
**trace** and how to **draw one frame**:

```mdx
<CodeBlock id="maks" lang="python" code={`def maks(a): ...`} />
<Stepper src="/steppers/maks.js" codeId="maks" title="Lineært søk etter største" />
```

```js
// public/steppers/maks.js — default export
export default {
  run(input) { return [frame, frame, …]; },     // required: build the trace
  render(stage, frame, api) { /* paint SVG/HTML into `stage` */ }, // required
  defaultData(size) { return [...]; },  // optional → adds a shuffle button
  sizeRange: { min, max, default },      // optional → adds a size slider
  label(frame) { /* override step text */ },     // optional
};
```

The framework reads only three fields off each frame — `line` (number | number[],
drives the linked `<CodeBlock>`), `desc`/`label` (the step text), and
`vars`/`variables` (a `key = value` strip on the linked code block). Everything
else is **your** payload, passed
straight back to `render`. Draw with SVG/HTML (not canvas) so labels stay crisp;
use `var(--accent)`, `var(--green)`, etc. via inline `style` so frames re-theme.
Keep `run(input)` deterministic for a given input (shuffle re-calls
`defaultData`). For a non-stepped interactive diagram, use
`<Simulation host="dom">` and draw into `api.stage` instead.

---

## 6. Conventions

- **Math.** Inline `$d\sin\theta = m\lambda$`, display `$$ … $$`. In **`course.yaml`**
  LaTeX scalars must be **double-quoted with escaped backslashes**:
  `tex: "\\dfrac{a}{b}"`.

  **Props that render `$…$` with KaTeX.** Every reader-visible string prop below
  goes through the same renderer, so put math in the prop rather than working
  around it in the body:

  | Where | Props |
  |---|---|
  | `course.yaml` | formula `label`, glossary `term` + `definition`, flashcard `front` + `back` |
  | Captions | `<Figure>`, `<Formula>`, `<Table>`, `<Simulation>`, `<Stepper>` |
  | Tables | `<Table columns>` and every cell in `rows` |
  | Headings | `<Statement name>`, `<Step title>`, `<CompareCol title>` |
  | Self-tests | `<Quiz question / options / explanation>`, `<SelfCheck question>` |

  Everything else is escaped, except the simple inline tags
  `<b> <i> <em> <strong> <sub> <sup> <code> <br>` (attribute-less) — use
  `<b>`/`<em>`, not Markdown `**…**`. A literal `<`/`&` (`n<m`, `T&C`) is safe
  plain text; anything fancier belongs in the section body, not a prop string.
- **Explicit numbering.** Figures (`number`), formulas, and statement ids are set
  **by hand**, never auto-derived — so reordering content never silently
  renumbers, and a cross-ref target stays stable. Section display numbers are the
  one exception (auto, gap-free from `order`; override with `num`).
- **Cross-ref anchors.** `<Term name>` → the glossary row `slugify(term)`;
  `<FormulaRef id>` → the `formulas[].id`; `<Statement id>` defaults to
  `slugify(name)`. Norwegian æ/ø/å fold to ae/o/a. The build fails on any dead or
  duplicate anchor (§8).
- **Language.** Defaults and chrome are Norwegian (`language: nb`). Override
  individual strings under `course.yaml` → `ui` for `nn`/`en` courses.
- **Long titles.** A long compound (`Halvlederkomponenter`) has to wrap somewhere
  on a 360 px phone. The browser hyphenates the hero and module headings on its
  own, but it picks a syllable; to choose the seam yourself, put a **soft hyphen**
  (U+00AD) there using YAML's `\xAD` escape in a **double-quoted** scalar:

  ```yaml
  title: "Halvleder\xADkomponenter" # wraps as "Halvleder-" / "komponenter"
  ```

  It is invisible when the line fits and renders as a real hyphen when used. It
  is display-only — the framework strips it from `<title>`, social cards,
  JSON-LD and the web manifest, so the course is still spelled
  `Halvlederkomponenter` everywhere a machine reads it. Works in `title`,
  `subtitle` and section `title`s. Use it sparingly: one seam per compound, at
  the morpheme boundary.
- **Strict schema.** `course.yaml` is validated against a strict schema: an
  unknown or misspelled top-level or nested key **fails the build** naming the
  key. `course.yaml` also requires `schemaVersion` (no default) — set it to the
  framework's `SCHEMA_VERSION` (currently **4**); a mismatch fails the build with
  a migrate/bump-the-pin message (see `MIGRATIONS.md`).

---

## 7. External references — link the authoritative sources

Every course has official external documents. Surface them as first-class fields,
not ad-hoc `links[]` entries:

- **`course.courseUrl`** — always set it to the official university course page
  (the emneside). It renders in the hero + footer. *(Part of the per-course DoD.)*
- **`course.exams[]`** — link **university-hosted** exam and solution PDFs when
  they exist. Only if one does *not* exist, vendor the PDF in `public/` and link
  that path (`/exams/2024.pdf`). Each entry's `date` takes a full `YYYY-MM-DD`
  **or** a month-precision `YYYY-MM`: several institutes name a paper after the
  semester (`…_221200`) and print no date on it, so the exam day is genuinely
  unknown. Write `date: 2022-08` there. The row still sorts into the right
  place, and the Eksamen page prints "august 2022" instead of a day nobody
  verified — do **not** reach for the 1st of the month to make it sort. A paper
  whose month is also unknown simply omits `date`.
- **`course.examArchive`** — `{ url, label? }` to the official **complete**
  archive. When the `exams[]` you list are a hand-picked selection, set this: the
  Eksamen page then shows a "these are the most relevant; older sets are in the
  archive" note (`ui.examArchiveNote`) and appends an "open the full archive" row.
- **`course.exam.formulaSheetUrl`** — link the **official formula sheet handed out
  at the exam** (distinct from the guide's own Formelsamling). University-hosted
  PDF first; vendor in `public/` only as a fallback.
- **`course.exam.formulaSheet`** — defaults to `true`. Set `false` for a
  **closed-book / no-aids exam**: the Formelsamling page then shows a clear
  "no sheet is provided" notice and drops the on-sheet / must-memorize chips and
  per-row badges (they are meaningless when nothing is on a sheet). Use this
  instead of marking every `formulas[]` entry `onSheet: false` / `memorize: true`.
  Override the notice wording with `ui.noFormulaSheetNote` for `nn`/`en` courses.

> **Accuracy is non-negotiable — these pages are a source of truth.** Never seed a
> placeholder or guessed value (an exam date, a duration, a room, a syllabus
> reference) into `course.yaml` or a module. A plausible-but-wrong fact is worse
> than an absent one. Every schema field is optional with a sensible default, so
> **omit what you cannot verify** rather than inventing it — e.g. leave
> `exam.date` unset until the official date is published, and add it later. If a
> value is genuinely needed but unknown, ask; do not fabricate.

---

## 8. Quality bar & section definition-of-done

The polish bar is **library-grade**. A module is done when:

- [ ] **Frontmatter complete** — `order`, `title`, `summary`, `importance`. The
      `summary` is what search results and social shares show; a vague one costs
      real clicks.
- [ ] **Goals + recap** — has `<LearningGoals>` and at least one `<KeyTakeaways>`
      bullet (concept/method modules).
- [ ] **All math renders** — no raw `$…$` leaking; results that are *the point* are
      in display mode.
- [ ] **Cross-refs resolve** — every `<Term>` / `<FormulaRef>` / `<Statement>`
      target exists and is unique. *Enforced: `pnpm build` fails otherwise.*
- [ ] **No fabricated facts** — every concrete value (dates, durations, syllabus
      refs, figures) is verified; anything unknown is **omitted**, never guessed.
- [ ] **A self-check** — a `<SelfCheck>` or `<Quiz>` where the material supports it.
- [ ] **Both themes read** — light *and* dark, AA contrast, no clipped widgets.
- [ ] **Honest `importance`** — core vs useful vs extra reflects the syllabus.
- [ ] **No ad-hoc HTML/Markdown table** where a widget exists (use `<Compare>`,
      `<Steps>`, `<Statement>`, …).
- [ ] **No unknown frontmatter keys** — the schema is strict, so a typo'd key
      fails the build; keep the frontmatter to the documented fields.
- [ ] **`WRITING.md` §7 passed** — length budget measured and met, scope limited to
      the week, one word per concept, no coined metaphors, register budgets held in
      prose *and* in reader-visible props, `course.yaml` entries swept too.

Per-course (in addition): **`site`** set in `astro.config.mjs` (canonical / social
cards / sitemap); `courseUrl` set; exam metadata + `formulaSheetUrl` where the exam
is known; screenshot-compared against the source guide.

---

## 9. Reduce duplication

If a content pattern recurs across modules, it should become a **framework
widget or a `course.yaml` field** — not be re-authored per file. Spot the
repetition, then request the feature in the framework (see `ROADMAP.md`); don't
work around it with copy-pasted markup. New widgets earn their place by removing
repetition, not by adding surface area.

---

## 10. Analytics (optional)

To measure traffic, set a [GoatCounter](https://www.goatcounter.com/) count
endpoint in `course.yaml`:

```yaml
analytics:
  goatcounter: "https://yourcode.goatcounter.com/count"
```

The framework then injects GoatCounter's async script on every page. Notes:

- **Production only.** The tag is emitted by `pnpm build`, never by `pnpm dev`,
  so local development sends no traffic.
- **Cookieless.** GoatCounter sets no cookies and collects no personal data, so
  no consent banner is required.
- **Verbatim endpoint.** Use the full count URL including the `/count` path; it
  is taken as-is (no derivation). Omit the whole `analytics` block to disable.
