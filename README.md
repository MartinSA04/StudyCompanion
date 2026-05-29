# study-companion

A versioned, data-driven **Astro 6 integration + component library** for interactive course study guides (e.g. `optikk.martinsundal.no`).

A *course* is authored as **data** — a `course.yaml` plus `sections/*.mdx` — and pins a version of this framework. The framework owns **all** design, schema, page wiring, and widgets; course repos stay thin and upgrade-safe. Static output, server-rendered KaTeX, near-zero client JS except small interactive islands.

> Build order, architecture, and contracts: see `study-companion-DESIGN.md`. Per-release content migrations: see `MIGRATIONS.md`.

---

## Consuming the framework (a course repo)

A course repo contains **three thin files** plus a `content/` folder — no pages, components, or toolchain config.

> **Starting a course?** Scaffold from the starter instead of by hand:
> `npx degit MartinSA04/StudyCompanion/course-template course-mycode`. Then read
> **`AUTHORING.md`** — the content author's guide (archetypes, widget decision
> guide, conventions, per-section definition-of-done).

`package.json`

```jsonc
{
  "type": "module",
  "scripts": { "dev": "astro dev", "build": "astro build", "preview": "astro preview" },
  "dependencies": {
    "astro": "^6",
    "study-companion": "github:martinsundal/study-companion#v1.0.0"
  }
}
```

> During local development you can use `"study-companion": "link:../path/to/study-companion"` instead of the GitHub tag.

`astro.config.mjs`

```js
import { defineConfig } from "astro/config";
import studyCompanion from "study-companion";
export default defineConfig({ integrations: [studyCompanion()] });
```

`src/content.config.ts`

```ts
export { collections } from "study-companion/content";
```

`content/` — the only place you author:

```text
content/
├── course.yaml          # metadata, formulas, exams, features, analytics, ui strings
├── flashcards.yaml      # optional deck
└── sections/
    ├── 01-intro.mdx
    └── 02-...mdx
public/
├── favicon.svg          # courses provide their own favicon
├── figures/             # optional images/diagrams referenced by <Figure src="/figures/…">
└── sims/                # optional course-owned simulation modules (see below)
```

Run `pnpm dev` to preview, `pnpm build` for static output to `dist/`. Search (Pagefind) is built into `dist/pagefind/` and only works in `build`/`preview`, not `dev`.

`pnpm build` also **validates cross-references** and fails on any dead link: a `<Term name>` / `<FormulaRef id>` with no matching `course.yaml` entry, or a duplicate `<Statement>` / formula anchor. The error names the section file and the unresolved target.

---

## Authoring content

### `course.yaml`

```yaml
schemaVersion: 1            # must match the framework's SCHEMA_VERSION
code: TFY4195               # course code
title: Optikk
subtitle: Interaktiv pensumguide
term: V2026
language: nb               # nb | nn | en
accent: "#2f6df6"          # per-course theme colour, LIGHT mode (any CSS colour)
accentDark: "#6ea9d8"      # optional — accent for DARK mode (defaults to `accent`)
repoUrl: "https://github.com/you/optikk"   # optional → footer "edit this page" links
repoBranch: main           # optional — branch the edit links target (default: main)
courseUrl: "https://www.ntnu.no/studier/emner/TFY4195"  # optional → canonical course page (hero + footer)
exam:                       # optional upcoming-exam card + Eksamen-page header
  date: 2026-05-20          #   (optional) ISO date; build-time countdown
  durationMinutes: 240      #   (optional) structured duration
  format: 4t skriftlig
  aids: Godkjent kalkulator + formelark
  formulaSheetUrl: "https://www.ntnu.no/.../formelark.pdf"  # optional → official sheet on Formelsamling
features: { progress: true, search: true, flashcards: true, theme: true }
analytics: { goatcounter: "https://yourcode.goatcounter.com/count" }  # optional → privacy-friendly analytics; prod builds only, cookieless. Endpoint must include /count
links:
  - { label: "Emneside (NTNU)", url: "https://www.ntnu.no/studier/emner/TFY4195" }
formulas:                   # optional → rendered as the Formelsamling section + flashcards
  - { tex: "n_1\\sin\\theta_1 = n_2\\sin\\theta_2", label: "Snells lov", section: "Geometrisk optikk", id: snells }   # id → <FormulaRef id="snells">
  - { tex: "\\sin\\theta_c = n_2/n_1", label: "Grensevinkel", section: "Geometrisk optikk", memorize: true, onSheet: false }
glossary:                   # optional → Begreper tool page + inline <Term name="…">
  - { term: "Koherens", definition: "Konstant faseforskjell mellom to bølger.", section: "Bølgeoptikk" }
exams:                      # optional past-exam list (<ExamList>)
  - { label: "Eksamen V2023", date: 2023-05-24, url: "/exams/2023.pdf", solutionUrl: "/exams/2023-sol.pdf" }
ui: { progressLabel: Fremgang, searchLabel: Søk, ... }   # optional chrome string overrides
```

YAML scalars containing LaTeX must be double-quoted with **escaped backslashes**, e.g. `tex: "\\dfrac{a}{b}"`.

### `sections/NN-slug.mdx`

Frontmatter is the contract; `order` (not the filename) is the source of truth for sequence.

```mdx
---
order: 2
title: Interferens
summary: Superposisjon, koherens og tofelt-interferens.   # optional
importance: core            # core | useful | extra (core gets a TOC dot)
estMinutes: 45              # optional
tags: [bølger, koherens]    # optional
part: "Del 2: Bølgeoptikk"  # optional — chapter grouping in sidebar + overview
updated: 2026-05-20         # optional — footer freshness line ("Oppdatert …")
---

Markdown body. Inline math `$d\sin\theta = m\lambda$` and display math
$$ \Delta y \approx \frac{\lambda L}{d} $$ render server-side via KaTeX.

<Formula tex="d\sin\theta = m\lambda" caption="Maksima" />
```

### Widgets (available in every MDX section — no imports needed)

| Component | Props | Purpose |
|---|---|---|
| `<Formula>` | `tex`, `caption?`, `block?`, `memorize?` | Server-rendered KaTeX. `memorize` adds a "må pugges" badge. |
| `<Figure>` | `src`, `alt`, `caption?`, `number?`, `width?`, `height?`, `full?` | Captioned image/diagram. `width`+`height` reserve the aspect-ratio (no layout shift); lazy-loaded. `caption` may contain `$…$`; `number` → "Figur N". |
| `<Statement>` | `kind?` (law\|theorem\|definition\|principle), `name`, `id?` | A named, boxed result with a stable `#` anchor for deep-linking. `name` may contain `$…$`; `id` defaults to a slug of `name`. |
| `<Term>` | `name`, slot? | Inline link into the glossary page. `name` is the headword (slugified to the row anchor); the slot, if any, is the display word (e.g. an inflected form), else `name` is shown. |
| `<FormulaRef>` | `id`, slot? | Inline cross-ref to a formula's row in the Formelsamling (matches `course.formulas[].id`). With no slot it renders the formula (KaTeX) as the link; the target row flashes via `:target`. |
| `<Example>` | `label?`, `title?` | Worked example ("regneeksempel"); default slot is the problem, then a `<Solution>`. `title` may contain `$…$`. |
| `<Solution>` | `label?`, `open?` | Collapsible worked solution, used inside `<Example>`. Put `<Answer>` inside it so it stays hidden until revealed. |
| `<Answer>` | `label?` | Highlighted final answer; place inside `<Solution>`. |
| `<LearningGoals>` | `title?` | Module objectives ("læringsmål"); slotted list. |
| `<ExamFocus>` | `title?` | Exam-priority block ("eksamensfokus"); slotted MDX. |
| `<Callout>` | `type` = note\|tip\|warning, `title?` | Admonition box; slotted MDX body. |
| `<Derivation>` | `title?`, `open?` | Collapsible worked steps (`<details>`). |
| `<Steps>` / `<Step>` | `<Step title?>` | Numbered procedure as a vertical ribbon (a real `<ol>`). `title` may contain `$…$`. |
| `<KeyTakeaways>` | `title?` | End-of-module recap; the slotted bullet list renders as a checklist. |
| `<Hints>` / `<Hint>` | `<Hint solution? label? open?>` | Progressive hint ladder — auto "Hint 1", "Hint 2", …; `solution` makes the "Løsning" closer. Works with no JS. |
| `<Compare>` / `<CompareCol>` | `<CompareCol title>` | Side-by-side comparison of 2–3 concepts; cards auto-stack on mobile. `title` may contain `$…$`. |
| `<CodeBlock>` | `code`, `lang?`, `title?`, `id?`, `activeLine?`, `activeLines?` | Shiki-highlighted block (+ auto copy button). `activeLine`/`activeLines` emphasise 1-based line(s); with an `id`, a `<Simulation>` can step the highlight via `api.codeBlock(id)`. |
| `<SelfCheck>` | `question` | Prompt with answer behind a reveal. |
| `<Quiz>` | `question`, `options[]`, `answer` (0-based), `explanation?` | Single-answer MCQ; text may contain `$…$`. |
| `<Simulation>` | `src`, `title?`, `caption?`, `height?`, `host?` (canvas\|dom) | Mounts a course-owned simulation (see below). `host="dom"` gives the module an SVG/HTML stage (`api.stage`) instead of a canvas. |
| `<Stepper>` | `src`, `codeId?`, `title?`, `caption?`, `height?` | Generic algorithm trace-player: the framework owns transport/seek/speed/variables + `<CodeBlock>` line-sync; a course module (`public/steppers/`) supplies `run(input)` + `render(stage, frame)`. See `AUTHORING.md` §5. |

Fenced code blocks (` ```py `) are highlighted by Shiki and get a copy button automatically.

> **Captions & labels** (`<Formula caption>`, `course.yaml` formula `label`, etc.) are
> rendered with KaTeX for `$…$` spans and pass the rest through as **inline HTML** —
> use `<b>…</b>`/`<em>…</em>` for emphasis, not Markdown `**…**`.

---

## Course-owned simulations

Interactive simulations stay in the **course** repo so the framework carries no per-course code. Put an ES module in the course's `public/sims/` and reference it:

```mdx
<Simulation src="/sims/thin-lens.js" title="Tynnlinse-avbildning" height={300} />
```

The module default-exports an `init(api)` called when the figure scrolls into view:

```js
// public/sims/thin-lens.js
export default function init({ canvas, ctx, controls, getSize, onResize }) {
  function draw() { const { w, h } = getSize(); /* paint with ctx (CSS px) */ }
  // append <input>/<button> to `controls`, call draw() on change
  onResize(draw);   // framework re-runs this after DPR resize
  draw();
}
```

`api` = `{ canvas, ctx, controls, getSize:()=>({w,h}), onResize:(cb)=>void, codeBlock:(id?)=>controller|null }`. The context is pre-scaled for `devicePixelRatio`, so you work in CSS pixels. The framework owns the chrome, DPR sizing, and lazy mount.

`api.codeBlock(id)` returns a controller for a `<CodeBlock id="…">` on the page — `{ setActiveLine(n), setActiveLines([…]), clear() }` — so a simulation can walk the highlighted source line(s) in lockstep with what it paints (e.g. animate an algorithm). Returns `null` if no such block exists.

---

## Versioning

- **SemVer with intent:** breaking **schema** change → **major**; new optional field or widget → **minor**; fix → **patch**. Tag every release `vMAJOR.MINOR.PATCH`.
- Courses **pin a tag** and never break on framework changes until they move the pin.
- The injected page compares `course.schemaVersion` against the framework's `SCHEMA_VERSION` and **fails the build with a clear message** on a mismatch (newer → bump the pin; older → migrate, see `MIGRATIONS.md`).
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

`pnpm test` uses Node's built-in test runner (Node ≥ 23 strips the TS types
natively) — no extra dependency. It covers the pure modules (`lib/nav`,
`lib/color`, `lib/progress`) and statically checks the `mdxComponents` map; the
`.astro` widgets themselves are exercised by the demo `pnpm build`.

`dev`/`build` first self-link `node_modules/study-companion` → repo root (via
`scripts/ensure-self-link.mjs`) so the injected routes resolve the package by
name, exactly as a real course does. To develop against a real course instead:
`pnpm --dir ../course dev`.
