# study-companion

A versioned, data-driven **Astro 6 integration + component library** for interactive course study guides (e.g. `optikk.martinsundal.no`).

A *course* is authored as **data** — a `course.yaml` plus `sections/*.mdx` — and pins a version of this framework. The framework owns **all** design, schema, page wiring, and widgets; course repos stay thin and upgrade-safe. Static output, server-rendered KaTeX, near-zero client JS except small interactive islands.

> Roadmap & open work: see `ROADMAP.md`. Per-release content migrations: see `MIGRATIONS.md`.

---

## Consuming the framework (a course repo)

A course repo is **three thin files** — `package.json` (pins this framework via a git tag), `astro.config.mjs`, and `src/content.config.ts` — plus a `content/` folder. No pages, components, or toolchain config; the framework injects all of it.

Don't hand-write these. The canonical, ready-to-copy example is **[`course-template/`](course-template/)** — scaffold a new course from it:

```bash
npx degit MartinSA04/StudyCompanion/course-template course-mycode
```

It ships the framework pin, a GitHub Pages deploy workflow, an annotated `content/course.yaml`, and example sections. Then read **`AUTHORING.md`** — the content author's guide (archetypes, widget decision guide, conventions, per-section definition-of-done).

You author **only** under `content/` — `course.yaml` (metadata, formulas, glossary, exams, deadlines, features, analytics, ui strings), `flashcards.yaml`, and `sections/NN-slug.mdx` — and drop static assets in `public/` (`figures/`, `sims/`; the favicon and app icons are auto-generated from the course `accent`/`accentDark`). See `course-template/` for the exact file layout and an annotated `course.yaml`.

> For local framework development, point the `study-companion` dependency at a `link:../path/to/study-companion` instead of the git tag (see `course-template/package.json`).

Run `pnpm dev` to preview, `pnpm build` for static output to `dist/`. Search (Pagefind) is built into `dist/pagefind/` and only works in `build`/`preview`, not `dev`.

`pnpm build` also **validates cross-references** and fails on any dead link: a `<Term name>` / `<FormulaRef id>` with no matching `course.yaml` entry, or a duplicate `<Statement>` / formula anchor. The error names the section file and the unresolved target.

---

## Authoring content

Author under `content/` only. **[`course-template/content/`](course-template/content/)** is a complete, annotated example — `course.yaml` documents every field, and `sections/*.mdx` show the section shapes; **`AUTHORING.md`** is the full guide (archetypes, conventions, per-section definition-of-done). Two things that bite:

- **`course.yaml`** — YAML scalars containing LaTeX must be double-quoted with **escaped backslashes**: `tex: "\\dfrac{a}{b}"`.
- **`sections/NN-slug.mdx`** — frontmatter is the contract; `order` (not the filename) is the source of truth for sequence. Inline `$…$` and display `$$…$$` math render server-side via KaTeX.

> **Overview & chrome, straight from `course.yaml`.** The overview renders an
> **exam-facts** card (`exam.date` / `time` / `format` / `aids`, with a muted
> authority-note link to `exam.authorityUrl` — default **NTNU Studentweb**) and,
> when `deadlines[]` is set, a quiet **agenda**: ONE flat list (no per-section
> dates, no done-states) whose past items hide themselves client-side against the
> reader's clock. `links[]` may carry a `group` (buckets the sidebar Lenker list,
> first-seen order) and a muted `note`. The footer always shows
> `ui.footerDisclaimer` and, when `repoUrl` is set, a "Meld fra om feil" issue
> link beside the "Foreslå endring" edit link.

### Widgets (available in every MDX section — no imports needed)

| Component | Props | Purpose |
|---|---|---|
| `<Formula>` | `tex`, `caption?`, `block?`, `memorize?` | Server-rendered KaTeX. `memorize` adds a "må pugges" badge. |
| `<Figure>` | `src`, `alt`, `caption?`, `number?`, `width?`, `height?`, `full?` | Captioned image/diagram. `width`+`height` reserve the aspect-ratio (no layout shift); lazy-loaded. `caption` may contain `$…$`; `number` → "Figur N". |
| `<Statement>` | `kind?` (law\|theorem\|definition\|principle), `name`, `id?` | A named, boxed result with a stable `#` anchor for deep-linking. `name` may contain `$…$`; `id` defaults to a slug of `name`. |
| `<Term>` | `name`, slot? | Inline link into the glossary page. `name` is the headword (slugified to the row anchor); the slot, if any, is the display word (e.g. an inflected form), else `name` is shown. |
| `<Sidenote>` | `label?`, slot | Short margin note. Floats into the right margin strip on wide viewports; falls back to a quiet inline aside when the strip collapses. Floats beside the content that **follows** it, so place it just before the relevant paragraph. Keep it to a sentence or two. |
| `<FormulaRef>` | `id`, slot? | Inline cross-ref to a formula's row in the Formelsamling (matches `course.formulas[].id`). With no slot it renders the formula (KaTeX) as the link; the target row flashes via `:target`. |
| `<Example>` | `label?`, `title?` | Worked example ("regneeksempel"); default slot is the problem, then a `<Solution>`. `title` may contain `$…$`. |
| `<Solution>` | `label?`, `open?` | Collapsible worked solution, used inside `<Example>`. Put `<Answer>` inside it so it stays hidden until revealed. |
| `<Answer>` | `label?` | Highlighted final answer; place inside `<Solution>`. |
| `<LearningGoals>` | `title?` | Module objectives ("læringsmål"); slotted list. |
| `<ExamFocus>` | `title?` | Exam-priority block ("eksamensfokus"); slotted MDX. |
| `<Table>` | `columns`, `rows`, `caption?`, `rowHeader?`, `align?` | Data-driven reference/complexity table; cells may contain `$math$`. First column is a row header; scrolls horizontally on overflow. |
| `<Callout>` | `type?` = note\|tip\|warning, `title?` | Admonition box; slotted MDX body. |
| `<Derivation>` | `title?`, `open?` | Collapsible worked steps (`<details>`). |
| `<Steps>` / `<Step>` | `<Step title?>` | Numbered procedure as a vertical ribbon (a real `<ol>`). `title` may contain `$…$`. |
| `<KeyTakeaways>` | `title?` | End-of-module recap; the slotted bullet list renders as a checklist. |
| `<Hints>` / `<Hint>` | `<Hint solution? label? open?>` | Progressive hint ladder — auto "Hint 1", "Hint 2", …; `solution` makes the "Løsning" closer. Works with no JS. |
| `<Compare>` / `<CompareCol>` | `<CompareCol title>` | Side-by-side comparison of 2–3 concepts; cards auto-stack on mobile. `title` may contain `$…$`. |
| `<CodeBlock>` | `code`, `lang?`, `title?`, `id?`, `activeLine?`, `activeLines?` | Shiki-highlighted block (+ auto copy button). `activeLine`/`activeLines` emphasise 1-based line(s); with an `id`, a `<Simulation>` can step the highlight via `api.codeBlock(id)`. |
| `<SelfCheck>` | `question`, `revealLabel?` | Prompt with answer behind a reveal. `revealLabel` defaults to "Vis svar". |
| `<Quiz>` | `question`, `options[]`, `answer` (0-based), `explanation?` | Single-answer MCQ; text may contain `$…$`. |
| `<Simulation>` | `src`, `title?`, `caption?`, `height?`, `host?` (canvas\|dom) | Mounts a course-owned simulation (see below). `host="dom"` gives the module an SVG/HTML stage (`api.stage`) instead of a canvas. |
| `<Stepper>` | `src`, `codeId?`, `title?`, `caption?`, `height?` | Generic algorithm trace-player: the framework owns transport/seek/speed/variables + `<CodeBlock>` line-sync; a course module (`public/steppers/`) supplies `run(input)` + `render(stage, frame)`. See `AUTHORING.md` §5. |

Fenced code blocks (` ```py `) are highlighted by Shiki and get a copy button automatically.

> **Captions & labels** (`<Formula caption>`, `course.yaml` formula `label`, etc.)
> render `$…$` via KaTeX and allow a few attribute-less inline tags (`<b> <em>
> <sub> <sup> <code> <br>`, …) — use those for emphasis, **not** Markdown `**…**`.
> Full escaping rules and the exact tag whitelist: `AUTHORING.md` §6.

---

## Course-owned simulations

Interactive simulations live in the **course** repo (an ES module in
`public/sims/`) so the framework carries no per-course code:

```mdx
<Simulation src="/sims/thin-lens.js" title="Tynnlinse-avbildning" height={300} />
```

The module default-exports `init(api)`, called on scroll-into-view, where `api =
{ canvas, ctx, controls, getSize, onResize, codeBlock, signal }` (with `stage`
replacing `canvas`/`ctx` for `host="dom"`). The context is pre-scaled for
`devicePixelRatio`; `signal` is a page-lifecycle `AbortSignal` for teardown across
view transitions; `codeBlock(id)` returns a controller that drives a `<CodeBlock>`
in lockstep with what the sim paints. The `src` is verified **at build time**
(same for `<Stepper src>`), so a typo can't ship a dead widget. Full walkthrough
and examples: **`AUTHORING.md` §5**.

---

## Versioning

- **SemVer with intent:** breaking **schema** change → **major**; new optional field or widget → **minor**; fix → **patch**. Tag every release `vMAJOR.MINOR.PATCH`.
- Courses **pin a tag** and never break on framework changes until they move the pin.
- `loadCourse` (the single content chokepoint) compares `course.schemaVersion` against the framework's `SCHEMA_VERSION` and **fails the build with a clear message** on a mismatch (newer → bump the pin; older → migrate, see `MIGRATIONS.md`). `schemaVersion` is **required** — there is deliberately no default, so an omitted version can't silently "match".
- Within a major version `SCHEMA_VERSION` never changes.

## Development

The framework ships a kitchen-sink **demo course** (`content/`, served via
`srcDir: demo/`) so widgets can be developed and screenshot-verified standalone —
it exercises every component in both themes.

```bash
pnpm install
pnpm dev                # serve the demo course (http://localhost:4321)
pnpm build              # static build of the demo + Pagefind index → dist/
pnpm preview            # preview the build (search works here, not in dev)
pnpm test               # unit tests for the pure logic (built-in node:test)
pnpm test:visual        # Playwright snapshots of the demo, both themes (CI)
pnpm typecheck          # tsc on the framework source
```

The brand fonts are **self-hosted** (no Google Fonts request): `node
scripts/fetch-fonts.mjs` vendors Fraunces/Spectral/IBM Plex Mono woff2 into
`src/styles/fonts/` and regenerates `src/styles/fonts.css`; re-run it to refresh.
All Google ranges are kept (`unicode-range` gates what each page downloads), so no
glyph goes missing. KaTeX fonts are already bundled from its stylesheet.

`pnpm test:visual` (config in `visual/`) builds + previews the demo and compares
full-page screenshots per route × theme. Baselines are platform-specific — generate
them once on Linux with `pnpm test:visual:update` and commit
`visual/*-snapshots/`; CI (`.github/workflows/visual.yml`) compares against them.

`pnpm test` uses Node's built-in test runner (the toolchain pins **Node 22**,
which strips the TS types behind the experimental type-stripping flag) — no extra
dependency. It covers the pure modules (`lib/nav`, `lib/color`, `lib/progress`)
and statically checks the `mdxComponents` map; the `.astro` widgets themselves are
exercised by the demo `pnpm build`.

The repo depends on itself by name (`"study-companion": "link:."` in
`package.json`) so the injected routes resolve the package exactly as a real
course does — `pnpm install` wires `node_modules/study-companion` → the repo root
via pnpm's own `link:` mechanism, no bespoke script. To develop against a real
course instead: `pnpm --dir ../course dev`.

## Course hub (kurs.martinsundal.no)

A standalone one-pager listing every course site, deployed to GitHub Pages
from this repo (`.github/workflows/pages.yml`, pushes to `main`). It is a
second tiny Astro build — `astro.config.hub.mjs`, `srcDir: hub/`, no
integration — whose page imports the framework's own `src/styles/*` and
`ThemeToggle`, so it tracks the design system with zero copied CSS. Courses
live in `hub/courses.yaml` (code/title/url/term, plus an optional `note`
surfaced as a tile note — e.g. "Vedlikeholdes ikke lenger" for a frozen course;
file order is display order). `pnpm hub:dev` to work on it locally.
