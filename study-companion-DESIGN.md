# Study Companion Framework — Design Document

**Status:** Build-ready spec for Claude Code
**Owner:** Martin Sundal
**Target:** A versioned, data-driven static-site framework for interactive course study guides (cf. `optikk.martinsundal.no`, `algdat.martinsundal.no`).

This document is written to be handed to Claude Code. It specifies the architecture, the exact repo layouts, file contents, schemas, component contracts, versioning strategy, and a milestone plan with acceptance criteria. Build in milestone order (§11).

---

## 1. Goals & non-goals

**Goals**
- One fixed "study companion" design, reused across many courses.
- A course is authored as **data** (`course.yaml` + MDX sections), never by editing templates.
- The framework is a **versioned dependency**. Each course pins a framework version and is immune to framework updates until it chooses to upgrade.
- Each course is its **own repo**, deployed independently to its **own subdomain**.
- Static output, near-zero JS except for interactive islands (progress, search, theme, flashcards).
- Build fails loudly on malformed content (schema validation).

**Non-goals (v1)**
- No server runtime, no database, no auth.
- No headless CMS (file-based authoring; Keystatic is a possible later add-on).
- No multi-course-per-repo (one subject = one repo = one subdomain).

---

## 2. Architecture overview

Two kinds of repos:

```
study-companion         (the FRAMEWORK — an Astro integration + component library, published & tagged)
   ▲ pinned by version
   │
course-optikk           (a COURSE repo — mostly content; pins study-companion@v1.x)
course-algdat           (a COURSE repo — pins study-companion@v2.x, independently)
```

**Key mechanism — version pinning via git tags (no npm registry required).**
Each course's `package.json` installs the framework straight from a GitHub tag:

```jsonc
"dependencies": { "study-companion": "github:martinsundal/study-companion#v1.2.0" }
```

`optikk` can stay on `v1.2.0` forever while `algdat` runs `v2.0.0`. Publishing a new framework tag changes nothing until a course bumps its pin and rebuilds.

**Key mechanism — framework is an Astro integration.**
The framework ships as an installable Astro integration that, when added to a course's `astro.config.mjs`:
- injects the page route(s) from the package (course repos never copy page code),
- registers MDX + `remark-math` + `rehype-katex` via `updateConfig` (course repos never configure the toolchain),
- exposes the content **schema/collection definitions** for the course's `src/content.config.ts` to re-export,
- exports the component/island library and a `loadCourse()`/styles entrypoint.

This is what keeps course repos thin and upgrade-safe: all wiring lives in the versioned package.

### Verified technical constraints (build to these)
1. **Routes can be injected from the package.** `injectRoute({ pattern: '/', entrypoint: 'study-companion/pages/index.astro', prerender: true })` works as long as `package.json#exports` exposes that file. Course repos therefore have **no `src/pages/`**.
2. **`src/content.config.ts` must physically exist in the course repo** — Astro auto-loads only the consumer's `src/content.config.ts`. It will be a **one-line re-export** of the framework's collections. The framework owns the Zod schemas and `glob()` loaders; the loaders' `base` paths resolve against the **course repo's** cwd at build, so they read the course's `content/` folder.
3. Static output mode is `output: 'static'` (the default in Astro 5).

---

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework/SSG | **Astro 5** (`output: 'static'`, islands) |
| Content authoring | **MDX** sections + **YAML** metadata, via Content Layer API (`glob()` loader, Zod schemas) |
| Math | **KaTeX** (`remark-math` + `rehype-katex`) — server-rendered, no client cost |
| Code highlighting | Astro built-in **Shiki** |
| Search | **Pagefind** (build-time index over static output) |
| Interactive islands | Prefer **vanilla TS + Astro islands**; use a small framework (Preact via `@astrojs/preact`) only for flashcards/quiz if state gets complex |
| Styling | CSS custom-property **token system** (no Tailwind required; keep dependencies lean). Follow the `frontend-design` philosophy: real type scale, deliberate tokens, restrained motion |
| Package manager | **pnpm** |
| Language | **TypeScript**, strict |
| Lint/format | ESLint + Prettier (+ `prettier-plugin-astro`) |
| Hosting | **Cloudflare Pages** (one project per course → one subdomain) |
| Version automation | **Renovate** on each course repo to PR framework bumps |

---

## 4. Framework repo (`study-companion`)

### 4.1 File tree

```
study-companion/
├── package.json
├── tsconfig.json
├── README.md
├── CLAUDE.md                         # build notes for Claude Code (see §12)
├── src/
│   ├── index.ts                      # the Astro integration (default export)
│   ├── content.ts                    # exports `collections` (schemas + glob loaders)
│   ├── schema.ts                     # Zod schemas + SCHEMA_VERSION + inferred types
│   ├── lib/
│   │   ├── loadCourse.ts             # read+validate content/course.yaml
│   │   ├── nav.ts                    # slugs + nav model (sections + tool pages)
│   │   └── progress.ts               # localStorage progress contract (per-section done)
│   ├── pages/                        # MULTI-PAGE: overview + one page per module/tool
│   │   ├── index.astro               # the overview (hero + stats + module tiles)
│   │   └── [slug].astro              # one prerendered page per module + each tool page
│   ├── layouts/
│   │   └── CourseLayout.astro        # the fixed shell (topbar, sidebar nav, content, footer)
│   ├── components/                   # chrome + content widgets (§4.4)
│   │   ├── ThemeToggle.astro         # island (dispatches sc:themechange)
│   │   ├── SearchPalette.astro       # island (Pagefind UI; build/preview only)
│   │   ├── Formula.astro
│   │   ├── Derivation.astro
│   │   ├── SelfCheck.astro           # island
│   │   ├── Quiz.astro                # island
│   │   ├── Callout.astro
│   │   ├── CodeBlock.astro
│   │   ├── FormulaSheet.astro        # island (filter/copy)
│   │   ├── ExamList.astro
│   │   ├── Simulation.astro          # island (mounts course public/sims/*.js)
│   │   └── Flashcards.astro          # island
│   ├── mdx-components.ts             # maps MDX tags → components (auto-available in sections)
│   └── styles/
│       ├── tokens.css                # design tokens + light/dark (Fraunces/Spectral/IBM Plex Mono)
│       ├── base.css                  # element/base styles
│       └── shell.css                 # topbar + sidebar nav + hero + module header chrome
└── .changeset/ (optional)            # if using changesets for versioning
```

### 4.2 `package.json` (exports are critical — injected route & re-exports depend on them)

```jsonc
{
  "name": "study-companion",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./content": "./src/content.ts",
    "./schema": "./src/schema.ts",
    "./styles": "./src/styles/tokens.css",
    "./pages/index.astro": "./src/pages/index.astro",
    "./components/*": "./src/components/*"
  },
  "peerDependencies": { "astro": "^5" },
  "dependencies": {
    "@astrojs/mdx": "^4",
    "remark-math": "^6",
    "rehype-katex": "^7",
    "katex": "^0",
    "pagefind": "^1",
    "yaml": "^2",
    "zod": "^3"
  }
}
```

> If `github:` install of a TS-source package causes resolution issues in a consumer, add a `build` step that emits to `dist/` and point `exports` there. Start with source exports; switch to `dist/` only if needed. Document whichever is chosen in `CLAUDE.md`.

### 4.3 The integration (`src/index.ts`) — responsibilities

```ts
import type { AstroIntegration } from "astro";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function studyCompanion(): AstroIntegration {
  return {
    name: "study-companion",
    hooks: {
      "astro:config:setup": ({ updateConfig, injectRoute, config }) => {
        // 1. Toolchain: MDX + math, so course repos configure nothing.
        updateConfig({
          integrations: [mdx()],
          markdown: {
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeKatex],
          },
        });
        // 2. Inject the page from THIS package.
        injectRoute({
          pattern: "/",
          entrypoint: "study-companion/pages/index.astro",
          prerender: true,
        });
      },
      "astro:build:done": async ({ dir }) => {
        // 3. Build the Pagefind index over the emitted static output.
        // (shell out to pagefind --site <dir>; or import the node API)
      },
    },
  };
}
```

### 4.4 Content schema (`src/schema.ts`) — the contract

```ts
import { z } from "zod";

export const SCHEMA_VERSION = 1;

export const courseSchema = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  code: z.string(),                       // "TFY4195"
  title: z.string(),                      // "Optikk"
  subtitle: z.string().optional(),
  term: z.string(),                       // "V2026"
  language: z.enum(["nb", "nn", "en"]).default("nb"),
  accent: z.string().default("#2f6df6"),  // brand accent (light mode)
  accentDark: z.string().optional(),      // brand accent (dark mode); defaults to `accent`
  exam: z.object({
    date: z.coerce.date().optional(),
    durationMinutes: z.number().optional(),
    format: z.string().optional(),
    aids: z.string().optional(),
  }).optional(),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  features: z.object({
    progress: z.boolean().default(true),
    search: z.boolean().default(true),
    flashcards: z.boolean().default(false),
    theme: z.boolean().default(true),
  }).default({}),
  // Optional UI string overrides for localization of the chrome:
  ui: z.object({
    progressLabel: z.string().default("Fremgang"),
    searchLabel: z.string().default("Søk"),
    resetLabel: z.string().default("Nullstill"),
    skipToContent: z.string().default("Hopp til innhold"),
  }).default({}),
});

export const sectionSchema = z.object({
  order: z.number(),
  title: z.string(),
  summary: z.string().optional(),
  importance: z.enum(["core", "useful", "extra"]).default("useful"),
  estMinutes: z.number().optional(),
  tags: z.array(z.string()).default([]),
});

export const flashcardsSchema = z.object({
  cards: z.array(z.object({
    front: z.string(),
    back: z.string(),
    section: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })),
});

export type Course = z.infer<typeof courseSchema>;
export type Section = z.infer<typeof sectionSchema>;
```

> **Schema versioning:** the injected page reads `course.schemaVersion`; if it is greater than the framework's `SCHEMA_VERSION`, fail the build with a clear "content is newer than framework — upgrade the framework pin" message, and vice-versa for too-old content. This makes upgrade mismatches obvious instead of mysterious.

### 4.5 Collections (`src/content.ts`) — re-exported by every course

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { courseSchema, sectionSchema, flashcardsSchema } from "./schema";

// NOTE: base paths resolve against the COURSE repo's cwd at build time.
const course = defineCollection({
  loader: glob({ pattern: "course.yaml", base: "./content" }),
  schema: courseSchema,
});
const sections = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./content/sections" }),
  schema: sectionSchema,
});
const flashcards = defineCollection({
  loader: glob({ pattern: "flashcards.yaml", base: "./content" }),
  schema: flashcardsSchema,
});

export const collections = { course, sections, flashcards };
```

### 4.6 The injected pages — **multi-page**, one module per view

The guide is **not** one long scroll. Following the original optics guide, the
integration injects two routes (§4.1 page tree): an **overview** at `/` and a
single dynamic route `/[slug]` that prerenders **one page per module** plus a
page per reference tool. Navigation lives in the persistent sidebar; the topbar
carries the global progress meter, search and theme toggle.

```astro
---
// src/pages/[slug].astro — getStaticPaths fans out over modules + tools
export async function getStaticPaths() {
  const { course, sections } = await loadCourse();
  const tools = toolFlags(course, /* flashcardCount */ n);
  const paths = sections.map((entry, i) => ({
    params: { slug: sectionSlug(entry.id) },          // "01-foton" → "foton"
    props: { kind: "section", entry, prev: …, next: … },
  }));
  if (tools.formulas)   paths.push({ params: { slug: "formelsamling" }, props: { kind: "formulas" } });
  if (tools.flashcards) paths.push({ params: { slug: "flashcards" },    props: { kind: "flashcards" } });
  if (tools.exams)      paths.push({ params: { slug: "eksamen" },       props: { kind: "exams" } });
  return paths;
}
---
<CourseLayout course={course} nav={nav} tools={tools} active={Astro.params.slug}>
  {/* module: <mod-head> (index · kicker · title · "Marker fullført") +
      <article class="prose"><Content components={mdxComponents}/></article> +
      prev/next page-actions. Tool pages render FormulaSheet / Flashcards / ExamList. */}
</CourseLayout>
```

`/` (`index.astro`) renders the hero, data-derived stats, an optional exam card,
and the module-tile grid.

### 4.7 Component contracts (build these)

**Chrome / layout** — the sidebar nav and progress are owned by the layout (no
separate TableOfContents/ProgressTracker components; navigation is page-to-page,
so a per-heading scroll-spy TOC is unnecessary).
- `CourseLayout.astro` — props `{ course, nav, tools, active, pageTitle? }`. Renders the sticky topbar (brand+prism, progress meter, search, theme, reset), the grouped sidebar nav (Kom i gang / Verktøy / Moduler / Lenker, with active + per-module done state), `<main class="content">` slot, footer, mobile menu+scrim. Inline scripts: progress (reads `sc:progress:<code>`, marks done nav links + meter, binds any `[data-done-order]` button), mobile menu, copy-code. Imports `tokens.css`/`base.css`/`shell.css`; sets the per-theme accent vars (`--accent-light`/`--accent-dark` + their on-accent text colours) inline from `course.accent`/`course.accentDark`, `lang` from `course.language`; honours `features.*`/`ui.*`. Loads the Fraunces/Spectral/IBM Plex Mono webfonts.
- `ThemeToggle.astro` *(island)* — toggles `data-theme` on `<html>`, persists to `localStorage`, respects `prefers-color-scheme` on first load (inline no-flash script in `<head>`), and dispatches `sc:themechange` so canvas sims repaint.
- `SearchPalette.astro` *(island)* — `⌕` button + modal using the Pagefind index over the built site (each page is indexed → results deep-link to modules). Keyboard: `/` or `⌘K` to open. In `astro dev` the index doesn't exist yet, so it shows a friendly notice.

**Content widgets (auto-available in MDX via `mdx-components.ts`)**
- `Formula.astro` — props `{ tex: string, caption?: string, block?: boolean, memorize?: boolean }`. KaTeX render; `memorize` adds a "★ må pugges" badge (not on the exam sheet).
- `Derivation.astro` — collapsible `<details>` with steps slot.
- `Callout.astro` — props `{ type: "note"|"tip"|"warning" }`, slot body.
- `Example.astro` — a worked example ("regneeksempel"). Props `{ label?, title? }` (`title` may contain `$math$`). Default slot = the problem, followed by a child `<Solution>`. Subject-agnostic; no slots to remember.
- `Solution.astro` — collapsible worked solution used inside `<Example>` (closed by default). Props `{ label?, open? }`. Put `<Answer>` inside it so the answer is hidden until revealed.
- `Answer.astro` — highlighted final answer (`--answer-bg`), placed inside `<Solution>`. Prop `{ label? }`, slot body.
- `LearningGoals.astro` — module objectives ("læringsmål"); prop `{ title? }`, slot body. Teal `--goals-bg`.
- `ExamFocus.astro` — exam-priority block ("eksamensfokus"); prop `{ title? }`, slot body. Warm `--exam-bg`.
- `CodeBlock.astro` — Shiki + copy button (or rely on MDX fenced code + a copy island).
- `SelfCheck.astro` *(island)* — props `{ question: string }`, slotted answer hidden behind reveal.
- `Quiz.astro` *(island)* — props `{ question, options: string[], answer: number }`.
- `FormulaSheet.astro` — gathers/renders a reference sheet (from a `formulas` array if added to schema later, or from `<Formula>` usage).
- `ExamList.astro` — props `{ exams: {...}[] }` (add `exams` to course schema when needed).
- `Flashcards.astro` *(island)* — reads the `flashcards` collection; deck UI with flip + simple SRS in `localStorage`.

### 4.8 Tokens (`src/styles/tokens.css`)

```css
:root {
  --accent: #2f6df6;            /* overridden per course */
  --bg: #ffffff; --fg: #11141a; --muted: #5b6472; --card: #f5f7fb;
  --border: #e3e7ee;
  --radius: 12px; --maxw: 760px;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "JetBrains Mono", monospace;
}
:root[data-theme="dark"] {
  --bg: #0d0f14; --fg: #e7eaf0; --muted: #8b94a6; --card: #161a22; --border: #232a36;
}
```

---

## 5. Course repo (e.g. `course-optikk`)

### 5.1 File tree

```
course-optikk/
├── package.json                      # pins study-companion@<tag>
├── astro.config.mjs                  # 3 lines: add the integration
├── tsconfig.json
├── CLAUDE.md                         # "how to author this course" notes
├── src/
│   └── content.config.ts             # one line: re-export framework collections
├── content/                          # ← the only place you author
│   ├── course.yaml
│   ├── flashcards.yaml               # optional
│   └── sections/
│       ├── 01-stralegang.mdx
│       └── 02-interferens.mdx
└── public/                           # optional static assets (favicon, images)
```

There is **no `src/pages/`, no components, no toolchain config** — all injected by the framework.

### 5.2 The three thin files

`package.json`:
```jsonc
{
  "name": "course-optikk",
  "type": "module",
  "scripts": { "dev": "astro dev", "build": "astro build", "preview": "astro preview" },
  "dependencies": {
    "astro": "^5",
    "study-companion": "github:martinsundal/study-companion#v1.0.0"
  }
}
```

`astro.config.mjs`:
```js
import { defineConfig } from "astro/config";
import studyCompanion from "study-companion";
export default defineConfig({ integrations: [studyCompanion()] });
```

`src/content.config.ts`:
```ts
export { collections } from "study-companion/content";
```

### 5.3 Content format

`content/course.yaml`:
```yaml
schemaVersion: 1
code: TFY4195
title: Optikk
subtitle: Interaktiv pensumguide
term: V2026
language: nb
accent: "#2f6df6"
accentDark: "#7fb1e6"   # optional: brand accent for dark mode (lighter so it reads on dark)
exam:
  date: 2026-05-20
  durationMinutes: 240
  format: 4t skriftlig
  aids: Godkjent kalkulator + formelsamling
features: { progress: true, search: true, flashcards: true }
links:
  - { label: "Emneside (NTNU)", url: "https://www.ntnu.no/studier/emner/TFY4195" }
```

`content/sections/02-interferens.mdx`:
```mdx
---
order: 2
title: Interferens
summary: Superposisjon, koherens og tofelt-interferens.
importance: core
estMinutes: 45
tags: [bølger, koherens]
---

To bølger som møtes legger seg sammen...

<Formula tex="\\Delta = d \\sin\\theta = m\\lambda" caption="Konstruktiv interferens" />

<SelfCheck question="Hva skjer med stripemønsteret når d øker?">
Stripene rykker tettere sammen.
</SelfCheck>
```

> MDX components are made globally available to sections via the framework's `mdx-components.ts` (provided through `<Content components={...} />` or an MDX provider in the injected page), so authors don't import them per file.

---

## 6. Versioning & upgrade strategy

- **SemVer with intent:** breaking **schema** change → **major**; new optional schema field or new widget → **minor**; fix → **patch**. Tag every release `vMAJOR.MINOR.PATCH`.
- **Courses pin a tag.** They never break on framework changes because they don't move until their pin moves.
- **`schemaVersion` guard** (built into the injected page, §4.6) turns version mismatch into a clear build error instead of a silent break.
- **Renovate** on each course repo watches the GitHub dependency and opens a PR when a new framework tag exists. Workflow: tag framework → Renovate PRs each course → preview deploy → merge when happy. You get stability *and* low-friction upgrades.
- **Upgrade guide:** maintain `MIGRATIONS.md` in the framework; each major version documents what content changes (if any) a course must make.

---

## 7. Build & deploy (per subdomain)

- One **Cloudflare Pages** project per course repo. Build command `pnpm build`, output dir `dist`, custom domain `optikk.martinsundal.no`. Push to `main` → auto build & deploy.
- Each subdomain is a clean **root** site (`/`), matching the current setup. No path prefixes.
- Framework tags do **not** trigger course deploys; courses deploy only on their own commits (or on a merged Renovate PR).

---

## 8. Conventions

- TypeScript `strict: true`. No `any` in framework code except validated boundaries.
- Section files named `NN-slug.mdx`; `order` in frontmatter is the source of truth for sequence (filename is for humans).
- `localStorage` keys namespaced `sc:<feature>:<course.code>`.
- Islands hydrate with `client:idle` (or `client:visible` for below-the-fold) — never `client:load` unless required for no-flash theme.
- Conventional Commits in the framework repo (feeds changelog/versioning).
- Accessibility: skip-link, focus-visible styles, `aria-current` on active TOC item, color contrast checked in both themes.

---

## 9. Definition of done (per course)

A course ships when: `pnpm build` passes with no schema errors; every section renders with working math; TOC + progress + search + theme all function; light/dark both pass contrast; deployed to its subdomain over HTTPS; Lighthouse performance ≥ 95 and zero hydration on a JS-disabled read-through of content.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `github:` install of TS-source package fails to resolve in consumer | Add a `dist/` build step + point `exports` at compiled output; document in `CLAUDE.md`. |
| MDX components not auto-available in sections | Wire an MDX components provider in the injected page; test with a section using `<Formula>` early (Milestone 3). |
| `glob()` base path resolves to framework instead of course | Confirm base resolves against consumer cwd in Milestone 2; if not, expose a config option `studyCompanion({ contentDir })` and pass it into the loader. |
| Pagefind index path after build | Run Pagefind in `astro:build:done` against the emitted `dir`; verify the search UI loads the index from `/pagefind/`. |
| Flashcard/quiz state complexity | Escalate those two islands to Preact; keep everything else vanilla. |

---

## 11. Milestone plan (build in this order)

Each milestone is a Claude Code work session with explicit acceptance criteria.

**M0 — Framework skeleton.**
Scaffold `study-companion`: `package.json` with `exports`, `tsconfig`, the integration in `src/index.ts` (MDX + math + injected `/` route), `schema.ts`, `content.ts`, an `index.astro` that renders a hardcoded "hello course", `tokens.css`.
*Done when:* a throwaway local course repo can install it via relative path, run `astro dev`, and see the page.

**M1 — Design shell.**
`CourseLayout.astro` + `tokens.css` + `base.css` + `ThemeToggle`. Nail typography, spacing, light/dark. Render header/sidebar/content/footer from a `course` object.
*Done when:* the shell looks polished in both themes; theme persists with no flash.

**M2 — Data pipeline end-to-end.**
Finalize `schema.ts`, `content.ts`, `loadCourse`. Create `course-optikk` repo with the three thin files + a real `course.yaml` + 2–3 ported sections. Injected page reads the collection and renders sorted sections.
*Done when:* editing `course.yaml`/MDX live-reloads; a schema error fails the build with a clear message; `glob` base resolves to the course's `content/`.

**M3 — MDX widgets + math.**
`Formula`, `Callout`, `Derivation`, `CodeBlock`, plus `mdx-components` wiring so they're available without imports. Port a math-heavy optikk section.
*Done when:* KaTeX renders server-side; widgets work inside MDX with no per-file imports.

**M4 — Interactivity.**
`TableOfContents` (scroll-spy), `ProgressTracker` (localStorage `X/N` + reset), `SearchPalette` (Pagefind, built in `astro:build:done`).
*Done when:* progress survives reload and resets; search returns section hits; TOC highlights active section. This is feature-parity with the example sites' core UX.

**M5 — Exam-prep widgets.**
`SelfCheck`, `Quiz`, `Flashcards` (+ `flashcards.yaml`), and `ExamList`/`FormulaSheet` (extend schema with `exams`/`formulas` as needed).
*Done when:* flashcard deck flips & remembers; quiz checks answers; exam list renders.

**M6 — Versioning & release.**
Tag `study-companion@v1.0.0`. Repoint `course-optikk` to the GitHub tag. Add Renovate config to the course repo. Write `MIGRATIONS.md` + `README` authoring guide.
*Done when:* `course-optikk` builds against the pinned tag; bumping the tag is a one-line PR.

**M7 — Deploy + second course (the real test).**
Cloudflare Pages project for `course-optikk` → `optikk.martinsundal.no`. Then create `course-algdat` from scratch — only by writing content — and deploy it. If algdat needs code-/visualization-heavy widgets beyond the library, add them to the framework as a **minor** release and pin algdat to it.
*Done when:* both subdomains are live; algdat required **zero template edits**, only content + (optionally) new shared widgets.

---

## 12. Suggested `CLAUDE.md` for each repo

**Framework repo `CLAUDE.md`:**
```
This is study-companion: an Astro 5 integration + component library for course study guides.
- It is consumed by separate "course" repos that pin a git tag of this repo.
- Course repos contain only content; this repo owns ALL design, schema, and page wiring.
- The integration (src/index.ts) injects the page route and sets up MDX+KaTeX.
- Schemas live in src/schema.ts; bump SCHEMA_VERSION + MIGRATIONS.md on breaking changes.
- SemVer: breaking schema=major, new field/widget=minor, fix=patch. Tag every release vX.Y.Z.
- Never add per-course logic here. Keep everything data-driven off the schema.
- Build order & contracts: see study-companion-DESIGN.md.
```

**Course repo `CLAUDE.md`:**
```
This is a course study guide. It pins study-companion via a GitHub tag in package.json.
- DO NOT add components, pages, or toolchain config — the framework injects all of it.
- Author ONLY under content/: course.yaml (metadata) and sections/*.mdx (content).
- To change the design or add widgets, change the FRAMEWORK repo and bump the pin here.
- Run: pnpm dev (preview), pnpm build (static output to dist/).
```

---

## 13. First commands for Claude Code

```bash
# Framework
mkdir study-companion && cd study-companion && pnpm init
pnpm add -D astro typescript
pnpm add @astrojs/mdx remark-math rehype-katex katex pagefind yaml zod
# ...build M0 files per §4, then:
git init && git add -A && git commit -m "feat: framework skeleton" && git tag v0.1.0

# Course (local link first, then switch to github: tag at M6)
mkdir course-optikk && cd course-optikk && pnpm init
pnpm add astro
pnpm add link:../study-companion   # local during dev; swap to github:…#v1.0.0 later
# ...add the three thin files + content/ per §5
pnpm dev
```

Build M0 → M7 in order. Start each session by reading this file and the repo's `CLAUDE.md`.
