# study-companion

A versioned, data-driven **Astro 6 integration + component library** for interactive course study guides (e.g. `optikk.martinsundal.no`).

A *course* is authored as **data** — a `course.yaml` plus `sections/*.mdx` — and pins a version of this framework. The framework owns **all** design, schema, page wiring, and widgets; course repos stay thin and upgrade-safe. Static output, server-rendered KaTeX, near-zero client JS except small interactive islands.

> Build order, architecture, and contracts: see `study-companion-DESIGN.md`. Per-release content migrations: see `MIGRATIONS.md`.

---

## Consuming the framework (a course repo)

A course repo contains **three thin files** plus a `content/` folder — no pages, components, or toolchain config.

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
```
content/
├── course.yaml          # metadata, formulas, exams, features, ui strings
├── flashcards.yaml      # optional deck
└── sections/
    ├── 01-intro.mdx
    └── 02-...mdx
public/
├── favicon.svg          # courses provide their own favicon
└── sims/                # optional course-owned simulation modules (see below)
```

Run `pnpm dev` to preview, `pnpm build` for static output to `dist/`. Search (Pagefind) is built into `dist/pagefind/` and only works in `build`/`preview`, not `dev`.

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
accent: "#2f6df6"          # per-course theme colour (any CSS colour)
exam:                       # optional upcoming-exam card
  date: 2026-05-20          #   (optional) ISO date; build-time countdown
  format: 4t skriftlig
  aids: Godkjent kalkulator + formelark
features: { progress: true, search: true, flashcards: true, theme: true }
links:
  - { label: "Emneside (NTNU)", url: "https://www.ntnu.no/studier/emner/TFY4195" }
formulas:                   # optional → rendered as the Formelsamling section + flashcards
  - { tex: "n_1\\sin\\theta_1 = n_2\\sin\\theta_2", label: "Snells lov", section: "Geometrisk optikk" }
  - { tex: "\\sin\\theta_c = n_2/n_1", label: "Grensevinkel", section: "Geometrisk optikk", memorize: true, onSheet: false }
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
---

Markdown body. Inline math `$d\sin\theta = m\lambda$` and display math
$$ \Delta y \approx \frac{\lambda L}{d} $$ render server-side via KaTeX.

<Formula tex="d\sin\theta = m\lambda" caption="Maksima" />
```

### Widgets (available in every MDX section — no imports needed)
| Component | Props | Purpose |
|---|---|---|
| `<Formula>` | `tex`, `caption?`, `block?`, `memorize?` | Server-rendered KaTeX. `memorize` adds a "må pugges" badge. |
| `<Example>` | `label?`, `title?` | Worked example ("regneeksempel"); default slot is the problem, then a `<Solution>`. `title` may contain `$…$`. |
| `<Solution>` | `label?`, `open?` | Collapsible worked solution, used inside `<Example>`. Put `<Answer>` inside it so it stays hidden until revealed. |
| `<Answer>` | `label?` | Highlighted final answer; place inside `<Solution>`. |
| `<LearningGoals>` | `title?` | Module objectives ("læringsmål"); slotted list. |
| `<ExamFocus>` | `title?` | Exam-priority block ("eksamensfokus"); slotted MDX. |
| `<Callout>` | `type` = note\|tip\|warning, `title?` | Admonition box; slotted MDX body. |
| `<Derivation>` | `title?`, `open?` | Collapsible worked steps (`<details>`). |
| `<CodeBlock>` | `code`, `lang?`, `title?` | Shiki-highlighted block (+ auto copy button). |
| `<SelfCheck>` | `question` | Prompt with answer behind a reveal. |
| `<Quiz>` | `question`, `options[]`, `answer` (0-based), `explanation?` | Single-answer MCQ; text may contain `$…$`. |
| `<Simulation>` | `src`, `title?`, `caption?`, `height?` | Mounts a course-owned canvas simulation (see below). |

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
`api` = `{ canvas, ctx, controls, getSize:()=>({w,h}), onResize:(cb)=>void }`. The context is pre-scaled for `devicePixelRatio`, so you work in CSS pixels. The framework owns the chrome, DPR sizing, and lazy mount.

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
pnpm typecheck          # tsc on the framework source
```

`pnpm test` uses Node's built-in test runner (Node ≥ 23 strips the TS types
natively) — no extra dependency. It covers the pure modules (`lib/nav`,
`lib/color`, `lib/progress`) and statically checks the `mdxComponents` map; the
`.astro` widgets themselves are exercised by the demo `pnpm build`.

`dev`/`build` first self-link `node_modules/study-companion` → repo root (via
`scripts/ensure-self-link.mjs`) so the injected routes resolve the package by
name, exactly as a real course does. To develop against a real course instead:
`pnpm --dir ../course dev`.
