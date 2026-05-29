# Authoring a course

This is the guide for **writing course content** with study-companion — the
primary brief for a content author, including an authoring agent. It tells you
*how to write a good module* and *which widget to reach for*; for the exhaustive
prop reference see `README.md`, and for the architecture see
`study-companion-DESIGN.md`.

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
   `glossary` you already know. This is the spine everything hangs off.
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
| Hide a long derivation behind a toggle | `<Derivation>` |
| Pose a quick self-test or MCQ | `<SelfCheck>` / `<Quiz>` |
| Show code (syntax-highlighted, copy button) | `` ```lang `` fence, or `<CodeBlock>` for a title/active line |
| **Illustrate a dynamic / interactive concept** | a **course-owned `<Simulation>`** — see §5 |
| **Animate stepping through code** | `<CodeBlock>` driven by a `<Simulation>` — see §5 |

When in doubt, prefer the most specific widget: it carries the consistent design,
a11y, and (for `<Statement>`/`<Term>`/`<FormulaRef>`) the cross-ref anchors.

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

**Section frontmatter** is the contract — `order` (the source of truth for
sequence, not the filename), `title`, `importance`, optional `summary`,
`estMinutes`, `tags`, `part`, `updated`.

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

`api = { canvas, ctx, controls, getSize, onResize, codeBlock }`. The context is
pre-scaled for `devicePixelRatio`, so you work in CSS pixels; the framework owns
the chrome, sizing, and lazy mount.

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
  `tex: "\\dfrac{a}{b}"`. Captions/labels (`<Formula caption>`, formula `label`,
  glossary `definition`) render `$…$` with KaTeX and pass the rest as **inline
  HTML** — use `<b>`/`<em>`, not Markdown `**…**`.
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

---

## 7. External references — link the authoritative sources

Every course has official external documents. Surface them as first-class fields,
not ad-hoc `links[]` entries:

- **`course.courseUrl`** — always set it to the official university course page
  (the emneside). It renders in the hero + footer. *(Part of the per-course DoD.)*
- **`course.exams[]`** — link **university-hosted** exam and solution PDFs when
  they exist. Only if one does *not* exist, vendor the PDF in `public/` and link
  that path (`/exams/2024.pdf`).
- **`course.exam.formulaSheetUrl`** — link the **official formula sheet handed out
  at the exam** (distinct from the guide's own Formelsamling). University-hosted
  PDF first; vendor in `public/` only as a fallback.

---

## 8. Quality bar & section definition-of-done

The polish bar is **library-grade**. A module is done when:

- [ ] **Frontmatter complete** — `order`, `title`, `importance` (+ `summary` where
      it helps the sidebar/overview).
- [ ] **Goals + recap** — has `<LearningGoals>` and at least one `<KeyTakeaways>`
      bullet (concept/method modules).
- [ ] **All math renders** — no raw `$…$` leaking; results that are *the point* are
      in display mode.
- [ ] **Cross-refs resolve** — every `<Term>` / `<FormulaRef>` / `<Statement>`
      target exists and is unique. *Enforced: `pnpm build` fails otherwise.*
- [ ] **A self-check** — a `<SelfCheck>` or `<Quiz>` where the material supports it.
- [ ] **Both themes read** — light *and* dark, AA contrast, no clipped widgets.
- [ ] **Honest `importance`** — core vs useful vs extra reflects the syllabus.
- [ ] **No ad-hoc HTML/Markdown table** where a widget exists (use `<Compare>`,
      `<Steps>`, `<Statement>`, …).
- [ ] **Plausible `estMinutes`.**

Per-course (in addition): `courseUrl` set; exam metadata + `formulaSheetUrl` where
the exam is known; screenshot-compared against the source guide.

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
