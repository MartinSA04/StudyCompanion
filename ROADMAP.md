# study-companion — Improvement Roadmap

Forward-looking plan for the framework: new widgets, UX/a11y, schema, perf, DX,
and the **SEO / social / Apple-mobile / PWA** surface (§4). This is a *menu*, not
a commitment — each item is sized and tagged so we can pull the highest-value
ones into a release.

> Scope reminder (see `CLAUDE.md`): everything must
> stay **data-driven off the schema**, with **zero per-course logic** in the
> framework. Course repos pin a tag and only author `content/`.

## How to read this

Each item carries:

- **SemVer** — `patch` (fix/polish, no contract change) · `minor` (new optional
  field or widget, backward-compatible) · `major` (breaking schema change). This
  governs the release it can ship in. Bump `SCHEMA_VERSION` + `MIGRATIONS.md`
  only for `major`.
- **Effort** — S (≲half-day) · M (1–2 sessions) · L (multi-session).
- **Priority** — P0 foundations → P4 speculative.

## Guiding principles (keep these honest)

1. **Reduce duplication** — if a content pattern recurs across modules, it should
   become a component/prop, not be re-authored. New widgets earn their place by
   removing repetition, not by adding surface area.
2. **Explicit over derived** — courses set concrete values (per-theme accents
   today); avoid algorithmic "magic". New schema fields follow suit.
3. **Library-grade polish** — screenshot-compare both themes; math in KaTeX;
   AA contrast verified in light *and* dark.
4. **Static-first** — server-render everything possible; islands stay small,
   vanilla, and degrade without JS.

---

## P0 — Foundations (do these first; they de-risk everything after) — ✅ Complete

These are cheap, mostly non-visual, and make every later change safer to ship in
a versioned library. **All five shipped** — see each item's **Done** note.

### 0.1 Unit tests for the pure logic — `minor`/infra, **M** — ✅ Done

**Why.** This is a *versioned* library; a numbering or contrast regression ships
to every pinned course. The pure functions are perfect test targets and have
zero rendering dependencies.
**What.** Cover `lib/nav.ts` (`sectionNumbers` gap-free `num` override,
`sectionSlug` edge cases, `shortTitle` splitting, `toolFlags`), `lib/color.ts`
(`contrastText`/`accentOnBg` against known WCAG pairs), `lib/progress.ts`
(round-trip + number coercion + corrupt-storage/throwing-storage fallback), and a
static smoke test that every `mdxComponents` import resolves to a real file and is
registered in the map.
**Done.** `test/*.test.ts` (24 cases) via the **built-in `node:test`** runner —
no Vitest. Rationale: this is a near-zero-dependency library and Node 23 strips TS
types natively, so the suite runs with **zero new devDeps** (and Vitest can't be
installed in the dev sandbox anyway — see the demo/verify memory). `"test": "node
--test … 'test/**/*.test.ts'"`. `.astro` execution stays covered by the demo
`pnpm build`; the smoke test is the static guard. Pure infra — no schema change.

### 0.2 In-repo dev fixture / kitchen-sink course — infra, **S–M** — ✅ Done

**Why.** The framework can't `astro build`/`dev` standalone (no `content/`), so
component work and screenshotting require an external course. A bundled fixture
makes `pnpm dev` show every widget in both themes — the screenshot-compare
workflow becomes one command.
**What.** A `fixtures/course/` with `course.yaml` + 2–3 sections exercising every
widget (a "kitchen sink" module). A dev script points Astro's content root at it.
Excluded from the published package via `files`/`.npmignore`.

### 0.3 Heading hierarchy fix — `patch` (a11y), **S** — ✅ Done

**Why.** Module and tool pages start at `<h2>` (`[slug].astro:107,151,…`) with no
`<h1>` — fails sequential-heading a11y and weakens document outline/SEO. The
topbar brand is a link, not a heading.
**What.** Promote the module/tool page title to `<h1>` (the overview already uses
`<h1>` for the course title). Demote in-content headings if needed so MDX `##`
stays below the page `<h1>`. Verify the type scale still reads right.

### 0.4 Print stylesheet upgrade — `patch`, **S** — ✅ Done

**Why.** Students print study guides. The current `@media print`
(`shell.css:618`) hides chrome but leaves every `<details>` collapsed — so
`<Solution>`, `<Derivation>`, `<SelfCheck>` answers and `<Quiz>` explanations
**print blank**.
**What.** Force-reveal collapsed content in print (`details > :not(summary){
display:block !important }`), avoid page-breaks inside `.formula`/`.example`
panels (`break-inside: avoid`), print link URLs after external links, and ensure
the formula sheet prints as a clean reference. Test print-to-PDF in both themes.

### 0.5 Doc + version reconciliation — `patch`, **S** — ✅ Done

**Why.** `CLAUDE.md` says "Astro 5"; `package.json`/README are on Astro **6**.
The README widget table is missing the widgets added since: `Example`,
`Solution`, `Answer`, `LearningGoals`, `ExamFocus`, plus the `course.yaml`-driven
`FormulaSheet`/`ExamList`/`Flashcards`. New authors can't discover half the API.
**What.** Fix the Astro version line in `CLAUDE.md`; regenerate the README widget
table from `mdx-components.ts` as the source of truth; add a one-line authoring
example per widget.

---

## P1 — High-value new widgets — ✅ Complete

Each removes a real authoring repetition seen in study-guide content. All are
additive → `minor`, available via `mdx-components.ts` with no per-file imports.
**All six shipped** — see each item's **Done** note.

### 1.1 `<Figure>` — captioned, numbered images/diagrams — `minor`, **M** — ✅ Done

**Why.** There is **no image component at all**. Diagram-heavy courses (optics ray
diagrams, algorithm illustrations) currently drop raw `<img>` with no caption,
numbering, lazy-load, or CLS protection.
**Done.** `<Figure src alt caption? number? width? height? full?>` → framed on the
paper ground (dark-mode aware), `loading="lazy"` + `decoding="async"`,
`width`/`height` reserve the `aspect-ratio` (no CLS), `<figcaption>` with KaTeX in
the caption. Numbering is **explicit** (`number` → "Figur N"), not auto-derived —
same stance as section/formula numbering, so reordering never silently renumbers
and a future `<FigureRef>` (2.4) has a stable target. **Deferred:** click-to-zoom
lightbox — kept v1 JS-free (static-first); add when a diagram-heavy course needs
it. Verified in both themes against the demo (`/mer`).

### 1.2 `<Steps>` — numbered procedure/method — `minor`, **S** — ✅ Done

**Why.** "How to solve a … problem" recurs in every quantitative module and is
currently a plain `<ol>` indistinguishable from prose lists.
**Done.** `<Steps>` (a real semantic `<ol>`) wrapping `<Step title?>` children:
a vertical ribbon with accent numbered nodes + connector line, distinct from
bullet lists. Numbers come from a CSS counter reset per `<Steps>` (multiple blocks
each start at 1); `title` accepts `$inline$` math. Verified both themes.

### 1.3 `<KeyTakeaways>` — end-of-module recap — `minor`, **S** — ✅ Done

**Why.** Nearly every module ends with a "huskeliste"/summary; authors rebuild it
ad hoc with a Callout + list each time.
**Done.** `<KeyTakeaways title?>` — a dedicated summary block in a distinct violet
tint (vs note/tip/goals/exam), reusing the `aside` + `<Icon>` pattern. The slotted
bullet list renders with check markers (an alpha-masked SVG glyph that tints with
the block colour, so it adapts per theme). Verified both themes.

### 1.4 `<Compare>` — side-by-side concept table — `minor`, **M** — ✅ Done

**Why.** Comparisons ("konstruktiv vs destruktiv", "reell vs virtuell bilde") are
constant and currently hand-built as fragile Markdown tables that wrap badly on
mobile.
**Done.** `<Compare>` wrapping `<CompareCol title>` cards. An `auto-fit` grid lays
2–3 columns side by side and **auto-stacks** on narrow screens with no declared
column count; each cell is free MDX (lists, prose, `$…$`), and `title` is
KaTeX-aware. Settled on **column cards** over a row-aligned table+row-labels: it's
far more authorable (no positional cells), covers the common A-vs-B case, and the
aspect can live inline in each bullet. Each `<section>` is `aria-label`led for
screen readers. Verified both themes.

### 1.5 `<Hint>` ladder — progressive disclosure for problems — `minor`, **S** — ✅ Done

**Why.** `<SelfCheck>` reveals one answer; real problem-solving wants *graduated*
hints (nudge → method → full solution) so students self-scaffold.
**Done.** `<Hints>` wrapping `<Hint>` children, each a native `<details>` (no JS).
Auto-labels "Hint 1", "Hint 2", … from a counter reset per ladder; `<Hint solution>`
is the green "Løsning" closer (tinted like `<Answer>`, left out of the numbering),
and `label` overrides for a custom rung. Verified both themes.

### 1.6 `<Statement>` — named results (law/theorem/definition) — `minor`, **M** — ✅ Done

**Why.** Physics/math guides reference named results ("Snells lov", "Huygens'
prinsipp") repeatedly; today they're bold prose with no consistent treatment and
no anchor to link to.
**Done.** `<Statement kind="law|theorem|definition|principle" name=… id?>` → an
accent-tinted boxed result with a mono kicker badge (Lov/Teorem/Definisjon/
Prinsipp) and a **stable `id` anchor** with a hover `#` deep-link (`scroll-margin`
clears the sticky topbar). `id` defaults to a slug of `name` (æ/ø/å mapped) so the
future `<FormulaRef>`/glossary cross-refs (2.3/2.4) have a target; `name` is
KaTeX-aware. Verified both themes; anchors confirmed (`snells-lov`,
`huygens-prinsipp`).

---

## P1 — UX & interaction upgrades — ✅ Complete

Mostly `patch`/`minor` polish on existing islands. High perceived-quality return.
**All five shipped** — see each item's **Done** note.

### 1.7 Keyboard control for islands — `patch` (a11y), **M** — ✅ Done

**Why.** Core interactions are mouse-only.
**Done.**

- **Flashcards**: `Space`/`Enter` flip current card, `←/→` navigate, `1`/`2` rate
  (Øv/Kan). Global `keydown` guarded against inputs, dialogs and the search palette.
- **Search**: `↑/↓` moves focus through results (from input, `↓` enters the list;
  `↑` from first result returns to the input). `Enter` in the input navigates to the
  first/highlighted result.
- **Quiz**: `↑/↓` while a quiz option is focused moves to the next/previous option
  (circular). Options were already `<button>`s with `Enter`/`Space`; this adds arrow
  group navigation.

### 1.8 Prev/next module via arrow keys — `patch`, **S** — ✅ Done

**Why.** Multi-page guide; readers expect `←/→` to page between modules.
**Done.** `data-page-prev` / `data-page-next` added to both section prev/next links
and the "Til oversikt" fallback link in `[slug].astro`. A `keydown` handler in
`CourseLayout.astro`'s inline script clicks the relevant link on `ArrowLeft`/
`ArrowRight` (guarded: no modifier keys, not typing, search dialog not open).

### 1.9 In-page "På denne siden" mini-TOC for long modules — `minor`, **M** — ✅ Done

**Why.** Long modules (lots of `##`) have no within-page wayfinding.
**Done.** New `<PageToc>` component (`src/components/PageToc.astro`). Uses the
`headings` array from Astro's `render(entry)` (built-in rehype-slug IDs). Renders a
sidebar-style nav for h2/h3, shown only when the module has ≥ 3 qualifying headings.
Scroll-spy via `getBoundingClientRect` highlights the last heading above the 90px
viewport threshold. Heading anchor `#` deep-links are injected by the component
script into every h2/h3 in `.prose` (show on hover via CSS). `scroll-margin-top`
added to prose headings so topbar doesn't occlude anchored targets. TOC label uses
`course.ui.tocLabel` (already in schema, default `"Innhold"`).

### 1.10 Progress surfaced on the overview — `patch`, **S–M** — ✅ Done

**Why.** Per-module done state is tracked but invisible on the overview.
**Done.** Each tile now has a `data-tile-order` attribute and a `.tile-check`
element (box mirrors `.nav-check` pattern from the sidebar). An `is:inline` script
reads the same `sc:progress:<code>` key from `body.dataset.progressKey`, marks done
tiles `.done` (green border + checkmark), shows an "X av N moduler fullført" line
in the hero, and reveals a **"Fortsett der du slapp →"** link to the first unread
module. All client-side, progressive-enhancement — zero change when progress is 0.

### 1.11 Flashcard deck filtering — `minor`, **S–M** — ✅ Done

**Why.** Decks render all cards; large decks want focus.
**Done.** Section filter chips (pill buttons, only shown when cards have sections),
**"Kun ukjente"** toggle (hides cards at level ≥ 2), and **"Bland"** toggle
(Fisher-Yates shuffle). Filter state (`section`, `onlyUnknown`, `shuffled`) gates
`buildQueue()`; the counter shows filtered N, with an empty-state message when none
match. `data-section` added to each card button as the filter target. No schema
change — data already present.
**Also (interaction fixes from review):** (a) **per-card mastery badge** — a green
"Kan" pill at level 2 and a muted amber dot at level 1, driven by `data-level` and
synced from the stored levels on load + every rating, so a reader can see at a
glance what they've already mastered. (b) Navigation is now a **stable carousel** —
removed the silent `buildQueue()` on wrap that reshuffled order mid-session, so
prev/next always moves to a different card. (c) Fixed a Space/Enter **double-flip**:
when the card button has focus the native click already flips it, so the keydown
handler now skips (they were cancelling out).

---

## P2 — Schema & scalability

These let bigger/second courses (algdat) land without template edits.

### 2.1 Section grouping into "parts" — `minor`, **M** — ✅ Done

**Why.** The module list is flat. A larger course wants chapters ("Del 1:
Geometrisk optikk"). Today the only grouping is the `Kom i gang / Verktøy /
Moduler / Lenker` chrome buckets.
**Done.** Optional `part: string` on `sectionSchema`. A generic `partGroups()` in
`lib/nav.ts` (unit-tested: flat fallback, first-appearance ordering, part-less
bucket, and a recurring-part-merge guard so a stray ungrouped module never splits
a chapter) drives both the **sidebar** (a `.nav-section` header per part replaces
the single "Moduler" label) and the **overview** (a `.part-head` editorial divider
above each tile grid). Absent `part` everywhere → today's flat behavior (one
`null`-part group → the generic "Moduler"/single grid), so it's backward-compatible
→ `minor`. Numbering in `lib/nav.ts` stays global and gap-free (independent of
parts). Verified in the demo (`Del 1: Grunnlag` / `Del 2: Komponenter`).

### 2.2 "Edit this page" + freshness — `minor`, **S** — ✅ Done

**Why.** Maintainability + trust. No way to jump from a rendered page to its MDX,
and no "last updated" signal.
**Done.** Optional `course.repoUrl` + `course.repoBranch` (default `main`) and an
optional per-section `updated` date. On module pages the footer renders a
`.footer-meta` line with an **"Oppdatert {date}"** span (localized via the course
`language`) and a **"Rediger denne siden"** edit link built as
`repoUrl/edit/<branch>/<filePath>` from Astro's `entry.filePath` (GitHub-style).
Both are independent — the line shows whichever is present; tool/overview pages get
neither. UI strings `editPageLabel`/`updatedLabel` added. Also linked the framework
attribution ("Bygget med study-companion") to the framework repo. Pure additive →
`minor`. Verified in the demo (repoUrl points at the framework repo, so the demo's
own section files resolve).

### 2.3 Glossary — schema + tool page — `minor`, **M** — ✅ Done

**Why.** Study guides define terminology constantly; there's no glossary and no
reuse of definitions.
**Done.** `course.glossary: [{ term, definition, section? }]` + a **Begreper** tool
page (`Glossary.astro`, slug `begreper`, gated by `toolFlags.glossary`) that mirrors
`FormulaSheet` — a free-text search box, grouped by `section` (section-less entries
fall into an untitled bucket), server-side KaTeX + inline HTML in definitions, and a
stable `#slug` anchor per term (hover `#`, `:target` flash). Inline `<Term name>`
links prose into it: `name` is the headword (slugified to the anchor), an optional
slot is the display word, and a DEV warning fires when `name` has no matching entry.
UI string `glossaryLabel` (default "Begreper") + a `book` nav icon. Reuses the proven
FormulaSheet UI pattern. Verified in the demo (`/begreper`, three groups + the
`<Term>` links in `/sammenligning`).

### 2.4 Formula cross-references — `minor`, **S–M** — ✅ Done

**Why.** Prose says "by the formula above" instead of linking. `formulas[]` entries
have no stable id.
**Done.** Optional `id` on `formulaEntrySchema`; the FormulaSheet renders it on the
row (`scroll-margin` clears the topbar, `:target` flashes the row on arrival). A
`<FormulaRef id>` inline resolves the entry via `loadCourse()` and deep-links to
`/formelsamling#id` — with no slot it renders the formula itself (server-side KaTeX)
as the link, a slot overrides the label; a DEV warning fires for an unknown id.
Couples with `<Statement>` ids (1.6) via the shared `slugify` (`lib/slug.ts`, now
the single source of truth, unit-tested). Verified in the demo (`<FormulaRef>` in
`/sammenligning` → rows `#snells` / `#tynnlinse` on the sheet).

> Keep these **minor**: all optional, no `SCHEMA_VERSION` bump. The first item
> that *requires* restructuring existing content is the next `major`.

### 2.9 Build-time cross-reference validation — `patch`/infra, **S** — ✅ Done

**Why.** `<Term name>` (2.3) and `<FormulaRef id>` (2.4) only `console.warn` on an
unresolved target, and **only** in `import.meta.env.DEV`. A production `astro build`
happily emits dead links to non-existent glossary/formula anchors — exactly the
regression a pinned course can't catch without running the dev server. (Surfaced
while auditing the optics course: link integrity had to be checked with an external
ad-hoc script because the build stays green.)
**Done.** Pure `validateXrefs` in `src/lib/xref.ts` (unit-tested — `test/xref.test.ts`,
11 cases) scans each section's raw MDX for `<Term name>`, `<FormulaRef id>` and
`<Statement>` anchors (code fences + inline code stripped first, so documentation
that *shows* a widget never false-positives) and diffs them against the `course.yaml`
glossary/formula sets via the shared `slugify`. Catches a `<Term>`/`<FormulaRef>`
with no matching entry, a duplicate `formulas[].id`, and a duplicate `<Statement>`
anchor. Wired into `src/pages/index.astro` (the always-built `/` route): it
**throws and fails `astro build`** on any error, and only `console.error`s in DEV so
the dev page still renders (the widgets already warn inline). Unreferenced glossary
terms are a soft DEV-only warning. Verified end-to-end — injecting a dead ref fails
the build with a message naming the section file + target. Purely a guard, no schema
change → `patch`.

---

## P2 — Performance & infrastructure

### 2.5 Self-host & subset fonts — `patch`, **M** — ✅ Done

**Why.** Fonts load from the Google CDN via a render-blocking `<link>`
(`CourseLayout.astro:80-85`) — a third-party dependency, a privacy footprint, and
a render/CLS cost. The project targets Lighthouse ≥95.
**Done.** `scripts/fetch-fonts.mjs` vendors Fraunces/Spectral/IBM Plex Mono woff2
into `src/styles/fonts/` and generates `src/styles/fonts.css` (`@font-face`,
`font-display: swap`). Imported from `CourseLayout`, so Vite fingerprints the woff2
and rewrites the url()s — works the same in a consuming course's build. The Google
`<link>` + preconnects are gone (verified: zero `fonts.gstatic`/`googleapis` in
output); the body + display faces are `preload`ed via hashed imports. KaTeX fonts
were already self-hosted (bundled from `katex/dist/katex.min.css`).
**Not** lossy-subset: we keep every Google range (latin/-ext, cyrillic/-ext,
vietnamese) with their `unicode-range`, so no prose glyph can go missing while a
page still downloads only the range(s) it uses — re-running the script refreshes
all ranges. (Per request: only subset when really needed; range-gating already
gives the runtime win without dropping glyphs.)

### 2.6 Visual regression snapshots — infra, **L** — ✅ Scaffolded

**Why.** The polish bar is high and verification is manual screenshotting. A
versioned library should lock in pixels.
**Done.** `visual/playwright.config.ts` (builds + previews the demo, both-theme
screenshots, animations disabled) + `visual/kitchen-sink.spec.ts` (full-page
snapshot of every injected route × {light, dark}, masking the canvas sim) +
`.github/workflows/visual.yml` (installs Chromium, runs on PRs, uploads the report
on failure). Scripts: `test:visual` / `test:visual:update`. Lives in `visual/` so
the root tsconfig (which Astro rewrites on sync) never type-checks the CI-only
`@playwright/test` import. **Caveat:** Playwright can't be installed in the dev
sandbox, so the suite is authored but unrun here — baselines must be generated once
on Linux (`pnpm install && pnpm test:visual:update`) and committed; CI then
compares. Catches the scoped-CSS regression class (the theme-toggle icon-scope bug).

### 2.10 Privacy-friendly analytics (GoatCounter) — `minor`, **S** — ✅ Done

**Why.** Course owners want traffic numbers, but the framework's privacy stance
(self-hosted fonts, no third-party CDN) rules out cookie-based analytics.
GoatCounter is cookieless and needs no consent banner — the same privacy thread
as 2.5.
**Done.** New optional `course.yaml` field `analytics.goatcounter` (a `z.url()`
count endpoint, e.g. `https://code.goatcounter.com/count`). When set,
`CourseLayout` injects GoatCounter's `async` `count.js` into `<head>` —
**production builds only** (`import.meta.env.PROD`), never in `astro dev`.
Presence-gated (omit the block to disable); the endpoint is taken verbatim (no
`/count` derivation, per "explicit over derived"). Additive → no
`SCHEMA_VERSION` bump. Covered by `test/schema.test.ts`; the demo course stays
clean (analytics has no visual surface), so no visual-baseline churn.

---

## P2 — Design-system consistency

### 2.7 Unify the "panel header" pattern — `patch`, **S–M** — ✅ Done

**Why.** `Example`, `Simulation`, `FormulaSheet`, `CodeBlock` each implement their
own header bar (badge/dot/title) with slightly different spacing. Small drifts
accumulate.
**Done.** Extracted `PanelHeader.astro` — one card-tinted bar (bottom hairline,
shared padding/typography) with a leading mark (mono kicker badge **or** accent
dot), an optional display title, and a `kicker-icon` slot. `<Example>` (icon +
kicker + md title, baseline) and `<Simulation>` (dot + lg title, centred) now route
through it; their duplicated header CSS is gone. Verified the bundled CSS keeps the
exact original values, so no visual change (the header element is a `<div>` rather
than `<figcaption>` — invisible). **Deliberately left out:** `<CodeBlock>`'s
filename strip (a lighter mono chrome, different border model) and the FormulaSheet
group title (a heading above a list, not a panel bar) — folding them in would
*change* their look, against the "no visual change" goal. Not author-facing (kept
out of `mdx-components`).

### 2.8 `importance` as a real visual system — `patch`, **S** — ✅ Done

**Why.** `core/useful/extra` exists in the schema and `--core/--useful/--extra`
tokens exist, but the distinction is nearly invisible in nav/tiles/header.
**Done.** One canonical signal — `ImportanceTag.astro`: a token-keyed marker whose
**shape** also varies (core = filled square, useful = filled disc, extra = hollow
ring) plus a mono label, so the tier survives without colour (AA + colourblind-safe,
never colour-alone). Applied to the **overview tiles** and the **module header**
meta line; the **sidebar** carries the compact half of the same vocabulary (a
left rule on core rows — presence vs absence is the non-colour cue). Labels live in
`lib/importance.ts` (single source, reused for the module-header kicker fallback).
Demo now spans all three tiers (Simulering → `extra`) to exercise the ring.

---

## P3 — Authoring kit & course onboarding — ✅ Complete

The framework (P0–P2) is feature-complete; the gap now is **authoring**. A course
still goes from empty repo to shippable guide on tribal knowledge — there is widget
*reference* (README), but no guide for the **author**,
no copyable starter, and no explicit per-section goals or quality bar. **All four
shipped** — see each item's **Done** note; the `course-template/` builds clean as a
smoke test (8 routes, all cross-refs resolve).

**Goal.** Take a course from an empty repo to a shippable guide with explicit,
verifiable goals and a clear quality bar — **without ever editing the framework**.
The audience is a content author, **including an authoring agent**: every item below
is written so an agent has concrete working goals and can self-check its work.

These are all `docs`/infra: **no schema change, no `SCHEMA_VERSION` bump.** The
template is excluded from the published package (`files`/`.npmignore`).

### 3.1 `course-template/` scaffold — infra, **M** — ✅ Done

**Why.** Every new course re-derives the three thin files + `content/` layout from
the README setup by hand. A copyable starter makes "new course" a one-liner and encodes the
conventions by example.
**Done.** A `course-template/` directory holding: the three thin files
(`package.json` pinning the newest `github:MartinSA04/StudyCompanion#vX.Y.Z` tag + a `link:` dev
note in the README, `astro.config.mjs`, `src/content.config.ts`) plus `tsconfig.json`
and `.gitignore`; an annotated `content/course.yaml` documenting every field inline
(it ships with tiny *working* `exam`/`formulas`/`glossary`/`exams` examples rather
than commented-out blocks, since 2.9 now fails the build on dead refs — a buildable
complete example beats dead stubs); a `flashcards.yaml` stub; a `sections/` folder
with **one worked example per archetype** (3.3); `public/` with a favicon + figure
placeholder and a **minimal `public/sims/example.js`** surfacing course-owned canvas
sims via `<Simulation>`; and the course-repo **`CLAUDE.md`** pointing the authoring
agent at `AUTHORING.md`. `degit`-able; excluded from the npm package (the `files:
["src"]` allowlist). Smoke-tested: a real `astro build` of the template emits 8
routes with every cross-reference resolving.

### 3.2 `AUTHORING.md` — the content author's guide — docs, **M** — ✅ Done

**Why.** README is *reference* (each widget's props) + architecture.
Neither tells an author **how to write a good module** or which widget to reach for.
An authoring agent needs that as its primary brief.
**Done.** A top-level `AUTHORING.md` (the first thing the course `CLAUDE.md` points
at), with: the **mental model** (a course is data; never edit the framework; links
to README/MIGRATIONS); the **workflow** (`course.yaml` first → outline by
`order`/`part` → draft → wire cross-refs → verify); a **widget decision guide**
("want X → use `<Y>`") covering the full set including course-owned `<Simulation>`
canvas sims **and** sim-driven `<CodeBlock>` stepping (§5, with the `init(api)` /
`api.codeBlock(id)` contracts); **conventions** (KaTeX + YAML backslash-escaping,
the explicit-numbering stance, Norwegian defaults, anchor slugging); an **external
references** section (`courseUrl`; university-hosted exam PDFs first, `public/`
fallback; `exam.formulaSheetUrl`); the **reduce-duplication** rule; and the **quality
bar**. The per-section definition-of-done (3.4) lives in §8.

### 3.3 Module archetypes & section anatomy — docs, **S–M** — ✅ Done

**Why.** "Clear goals for sections": an agent authoring a module needs a concrete
shape to fill, not a blank page.
**Done.** Three archetypes documented in `AUTHORING.md` §4 **and** seeded as real,
build-verified example sections in the template:

- **Concept** (`01-konsept.mdx`) — `<LearningGoals>` → prose with `<Formula>` /
  `<Statement>` / `<Figure>` → a `<Simulation>` → `<Example>` → `<SelfCheck>` →
  `<KeyTakeaways>`.
- **Method / problem** (`02-metode.mdx`) — `<Steps>` → a worked `<Example>` with
  `<Solution>`/`<Answer>` → a `<Hints>` ladder → `<SelfCheck>`.
- **Reference / overview** (`03-referanse.mdx`) — `<Compare>` + tight prose linking
  out via `<Term>`/`<FormulaRef>`.

Each example carries an honest `importance` tier and a realistic `estMinutes`, and
opens with an MDX comment naming the archetype + its shape. Starting points, **not**
rigid rules.

### 3.4 Per-section definition-of-done + section-brief template — docs, **S** — ✅ Done

**Why.** Mirrors the per-*course* DoD at *section* granularity, so an agent
can self-verify a module is finished and a course owner can hand an agent a bounded
goal.
**Done.**

- **Section DoD checklist** — `AUTHORING.md` §8: frontmatter complete; learning goals
  and at least one takeaway; all math renders; every `<Term>`/`<FormulaRef>`/`<Statement>`
  cross-ref resolves (now *enforced* by 2.9, not just by eye); a self-check/quiz where
  the material supports it; reads in both themes at AA; honest `importance`; no ad-hoc
  table where a widget exists; plausible `estMinutes`.
- **Section-brief template** — `course-template/SECTION-BRIEF.md`: a fillable
  one-pager (archetype, order/part, importance, goals, key formulas/terms, statements,
  a widget checklist, source material, scope boundary) that turns a syllabus into
  per-section **work orders** an authoring agent can execute against.

> **Backstop — 2.9 build-time xref validation (shipped).** The "cross-refs resolve"
> line in the DoD is now machine-enforced: `pnpm build` *fails* on a dead
> `<Term>`/`<FormulaRef>`/`<Statement>` target. The course-repo `CLAUDE.md` and
> `AUTHORING.md` both state this.

---

## P3 — Exam & official-reference surfacing — ✅ Complete

Surface the *authoritative* external references every course has — the university
course page, the official exam, the exam-provided formula sheet — as first-class,
consistently-placed elements instead of ad-hoc `links[]` entries. These build on data
the schema mostly already carries. **All three shipped** — verified in the demo
build (hero/footer link, exam-page header, official-sheet link).

### 3.5 `course.courseUrl` — canonical link to the university course page — `minor`, **S** — ✅ Done

**Why.** Every course has an official emneside (e.g. the NTNU course page); today it
can only go in the free-form `links[]` list, so its placement and label drift between
courses. It deserves a canonical slot.
**Done.** Optional `course.courseUrl` (`z.url()`) rendered in two consistent places —
a quiet mono **`.hero-meta`** link under the overview description and a footer link
(both labelled by the new `ui.courseLabel`, default "Emneside") — distinct from the
generic `links`. `AUTHORING.md` makes setting it part of the per-course DoD.
Backward-compatible new optional field → `minor`.

### 3.6 Exam page header — when / format / aids — `patch`, **S** — ✅ Done

**Why.** `course.exam` (date, durationMinutes, format, aids) only renders as a card on
the overview. The **Eksamen** tool page — where a student goes to revise — opens
straight into the past-exam list with no summary of the exam they're actually sitting.
**Done.** New `ExamSummary.astro` atop the `eksamen` page: an accent-bordered panel
with the date + a build-time countdown ("om N dager" / "i dag" / "i morgen" /
"avholdt") and a fact grid for duration (formatted from `durationMinutes`), format and
aids. Pure presentation of the existing `course.exam` (renders only present fields,
nothing if empty) → no schema change → `patch`.

### 3.7 Official exam formula-sheet link on Formelsamling — `minor`, **S** — ✅ Done

**Why.** The **Formelsamling** page is the *guide's* formula collection; it must not be
confused with the **official sheet handed out at the exam**. Students need a direct
link to that authoritative document.
**Done.** Optional `course.exam.formulaSheetUrl` → a prominent `.official-sheet`
link/button at the top of the Formelsamling page (file icon + the new
`ui.officialFormulaSheetLabel`, default "Offisiell formelsamling til eksamen", +
external icon). The authoring convention (3.2) tells authors to link the
**university-hosted** PDF when one exists and only vendor in `public/` as a fallback.
New optional field → `minor`.

---

## P3 — Content-widget upgrades — ✅ Complete

### 3.8 `<CodeBlock active-line>` — sim-drivable code stepping — `minor`, **M** — ✅ Done

**Why.** Algorithm-heavy courses (the planned algorithm-visualizer course) want to
*animate stepping through code* in lockstep with a visualization — highlight line 3,
then 4, then the loop body — which the current static Shiki `<CodeBlock>` can't do.
**Done.** `<CodeBlock>` gains `activeLine` / `activeLines` (1-based) and an optional
`id`; active lines render as a full-width tinted band (bleeding into the `pre`
padding, blank lines preserved) applied to Shiki's `.line` spans. A tiny script
applies author-set static active lines on load. The `<Simulation>` `api` gains
**`codeBlock(id?)`** → a controller `{ setActiveLine, setActiveLines, clear }` so a
course-owned sim can walk the highlight as it paints (matched by id, or the first
block). No active line + no JS = the plain highlighted block, unchanged. New optional
prop + additive API surface → `minor`. Exercised in the demo (`/simulering`): a
"step through the loop" sim drives a linked `sum.js` block, both themes. Written in
prep for the algorithm course — **no algdat repo touched**.

---

## P5 — Algorithm-course enablement (~`v1.2.0`) — ✅ Complete

Scope set from a gap analysis of the real algdat course (TDT4120,
`MartinSA04/TDT4120_companion`): its v0 is **SVG/DOM React visualizers** driven by
a **frame-stepping engine**, displaying **Python** (Shiki handles it). Decisions
with the maintainer: **port Norwegian-only** (no framework i18n) and **the
framework owns the visualizer engine**. The earlier "zero template edits"
assumption does **not** hold — these are the additions, all built (5.1, 5.2, 5.4).

### 5.1 DOM/SVG render host for `<Simulation>` — `minor`, **M** — ✅ Done

**Why.** `<Simulation>` handed the course module a `<canvas>` + 2D ctx only, but
every algdat visualizer (graphs, trees, bars) is SVG/DOM with labeled nodes —
rewriting to canvas would be a quality/a11y regression (no crisp labels, no
selectable text).
**Done.** `<Simulation host="dom">` renders an empty themed stage and the module
gets `api.stage` (an element) instead of `canvas`/`ctx`; `host="canvas"` is the
unchanged default. Mount/import/codeBlock/theme logic now lives in a shared
`src/lib/simRuntime.ts` used by both `<Simulation>` and `<Stepper>`. Additive prop,
no schema change → `minor`.

### 5.2 `<Stepper>` — generic algorithm trace player — `minor`, **L** — ✅ Done

**Why.** The player (prev/play/next + seek + speed), the current-step caption,
a variable strip on the linked code block, and code-line sync are generic across every algorithm
visualizer — the reduce-duplication principle. Each sim would otherwise hand-roll
all the chrome.
**Done.** New `<Stepper src codeId? title? caption? height?>` widget. A course
module in `public/steppers/` exports `run(input)` (the trace) + `render(stage,
frame)` (one frame), optional `defaultData`/`sizeRange` (→ shuffle + size control)
and `label`. The framework owns the player, restructured for a clean,
hierarchy-driven layout: a hero stage, a prominent serif step caption, and one
control bar — ghost prev/next, a filled primary play/pause (replays at end), a
seek scrubber, an `n / total` counter, a compact speed toggle (0.5×/1×/2×), plus
quiet shuffle + size when offered. The frame's variables render as a `key = value`
strip on the linked `<CodeBlock>` (state belongs with the code). Scoped
keyboard (←/→/space/r/s, `stopPropagation` so it never fights the page's arrow
paging), `prefers-reduced-motion` (no autoplay), theme repaint, and `<CodeBlock>`
line-sync (reuses 3.8 `codeBlock()`). Recognised frame fields: `line`,
`desc`/`label`, `vars`/`variables`; all else is opaque course payload. Pure logic
in `src/lib/stepper.ts` (`test/stepper.test.ts`, TDD); the island is exercised by
the demo (`/simulering`, a linear-max scan) — verified end-to-end in a headless
browser, both themes (frame render, step, speed toggle, line-sync, no console
errors). **Renderers
(bars/graph/tree) stay course-owned for now — promote a shared set into the
framework once a *second* course needs them** (the reduce-duplication trigger).

### 5.4 Reference / complexity `<Table>` — `minor`, **S–M** — ✅ Done

**Why.** Best/avg/worst/space tables (Θ/O/Ω) are pervasive; `<Compare>` is only
2–3 column cards and `AUTHORING.md` bans ad-hoc Markdown tables.
**Done.** New data-driven `<Table columns rows caption? rowHeader? align?>`: a
semantic `<table>` whose cells render `$math$` via `renderMathString` (the
Quiz/CompareCol path). First column is a `<th scope="row">`; wide tables scroll
horizontally inside a bordered viewport. No schema change. Verified in the demo
(`/sammenligning`) in both themes (KaTeX cells, row headers, alignment, caption).

**Deferred (not in `v1.2.0`):** the 152 KB interactive **exam bank**
(`examData.js`) — its own project, beyond `<ExamList>`+`<Quiz>`; `<Statement>`
`lemma`/`proof` kinds; inline concept cards; CLRS-ref chips. **Non-issues (already
covered):** Python via Shiki, code-line stepping (3.8), `<Quiz>`,
`<Glossary>`/`<Term>`, `<Figure>`, `<Callout>` pitfalls, exam PDFs via `<ExamList>`.

---

## P1 — SEO & social metadata — ✅ Complete

The framework renders a near-bare `<head>`: `title`, a **single** `description`
(emitted only when `course.subtitle` is set, and identical on every page), the
font preloads, the no-flash theme script and the inline SVG-`data:`-URI favicon
(`CourseLayout.astro:107-161`). There are **no Open Graph / Twitter tags, no
canonical link, no structured data, no sitemap, no `robots.txt`, no
`theme-color`**. These guides ship to their own public subdomains and get passed
around class group chats — so search ranking, link-unfurl previews
(Slack/Discord/iMessage/Teams) and rich results are all currently left on the
table. Everything below stays **data-driven off `course.yaml` + section
frontmatter**, **server-rendered at build** (no client cost, no third-party
calls — same privacy stance as self-hosted fonts and GoatCounter), and carries
**zero per-course logic** in the framework.

> **One contract touch.** Several items need an absolute origin (`Astro.site`),
> which lives in the *course's* `astro.config.mjs` — one of its "three thin
> files". Supplying `site:` is a one-line addition the course owns (same spirit
> as it owning `accent`): the framework stays generic, the course declares its
> canonical origin. This is the only place the SEO work touches the course
> contract; everything else is pure framework. See 4.1.

### 4.1 `site` origin + canonical URLs — `patch`/infra, **S** — ✅ Done

**Why.** Absolute URLs — `rel=canonical`, `og:url`, sitemap `<loc>`, an absolute
`og:image` src — all need `Astro.site`, which is unset today (the demo
`astro.config.mjs` omits it and course repos own their own config). Without it
Astro can only emit relative URLs, which social crawlers and `rel=canonical`
can't use.
**What.** Document `site: "https://<course>.<domain>"` as a required line in the
course `astro.config.mjs`; add it to `course-template/` and the AUTHORING
per-course DoD. The framework emits `<link rel="canonical" href={new
URL(Astro.url.pathname, Astro.site)}>` when `Astro.site` is set and **degrades
gracefully** (skips canonical + absolute OG, one DEV warning) when it isn't. The
single source of truth for every absolute-URL feature below.
**Done.** `CourseLayout` emits `rel=canonical` + `og:url` (the path is
origin-normalised — a trailing slash is trimmed so it agrees with the
sitemap/JSON-LD) when `site` is set, else skips the absolute-URL features with a
once-per-build DEV warning (`lib/seo.ts:warnMissingSiteOnce`). `site` added to the
demo + `course-template` config and the AUTHORING per-course DoD.

### 4.2 Open Graph + Twitter Card meta — `minor`, **M** — ✅ Done

**Why.** Shared links unfurl as bare URLs. A titled, described, imaged card
dramatically lifts click-through when a guide gets dropped in a study chat.
**What.** A per-page OG/Twitter block in `CourseLayout` (it already has `course`,
`pageTitle`, and the page `kind`): `og:type` (`website` for overview/tools,
`article` for modules), `og:title`, `og:description` (4.3), `og:url` (canonical),
`og:site_name` (`${code} ${title}`), `og:locale` mapped from `language`
(`nb`→`nb_NO`, `nn`→`nn_NO`, `en`→`en_US`), `article:modified_time` from a
section's `updated`, plus Twitter `summary_large_image` and
`og:image`/`og:image:alt` (4.11). All derived from existing data — no new
required schema.
**Done.** Full OG + Twitter block in `CourseLayout`: `og:type` (`article` for
modules, `website` else), title/description/url/`og:site_name`, `og:locale` from
`language` (`lib/seo.ts:ogLocale`), `article:modified_time` from `updated`,
`og:image`/`twitter:image` = the 512 raster icon (interim → a `summary` card
until 4.11) + `og:image:alt`, and `twitter:site`/`creator` from the new optional
`course.seo.twitter`.

### 4.3 Per-page derived meta description — `patch`, **S** — ✅ Done

**Why.** Today `description` is emitted only when `course.subtitle` exists and is
the **same string on every page** — duplicate descriptions hurt SEO and say
nothing on a module/tool page.
**What.** A per-page description resolver: module pages use the section `summary`
(already in schema); tool pages use a localized stock line ("Formelsamling for
…", "Begreper i …"); the overview uses `subtitle`/title. Always emit one,
soft-truncated to ~155 chars. Feeds both `<meta name="description">` and
`og:description` (4.2).
**Done.** `lib/seo.ts` resolver (unit-tested): modules use `summary`, tools a
localized `"<label> — <course>"` line, the overview `subtitle`/title; always
emitted, whitespace-collapsed and soft-truncated to ~155 chars at a word boundary.

### 4.4 Structured data (JSON-LD) — `minor`, **M** — ✅ Done

**Why.** No schema.org markup, so Google can't surface rich results (course,
breadcrumbs, defined terms, Q&A) and machine readers / LLM crawlers get no
structured shape of the guide.
**What.** Server-rendered `<script type="application/ld+json">` per page kind:
`Course` (+ `provider` from `courseUrl`/institution, `inLanguage`) on the
overview; `LearningResource`/`Article` with `dateModified` from `updated` per
module; `BreadcrumbList` from the nav model; `DefinedTermSet`/`DefinedTerm` from
the glossary; optionally `Quiz`/`FAQPage` from `<Quiz>`/`<SelfCheck>`. All built
from data already present; validate against Google's Rich Results test.
**Done.** Pure, unit-tested `lib/jsonLd.ts`: `Course` (+ explicit `provider` from
the new `institution` field — never guessed from a URL host) on the overview;
`LearningResource` (+ `dateModified`, `isPartOf`) + `BreadcrumbList` per module;
`DefinedTermSet`/`DefinedTerm` (anchors via the shared `slugify`) on Begreper.
Each renders as a `<`-escaped `ld+json` script. (`Quiz`/`FAQPage` left
demand-driven.)

### 4.5 Sitemap + `robots.txt` — `minor`, **S–M** — ✅ Done

**Why.** No `sitemap.xml` and no `robots.txt`, so crawlers get no index of the
prerendered module/tool pages and no sitemap pointer.
**What.** Wire `@astrojs/sitemap` from inside the integration's
`astro:config:setup` (`updateConfig({ integrations: [sitemap()] })` — the
framework owns config, so every course gets it for free) with `lastmod` from
section `updated`; emit `robots.txt` (allow-all + a `Sitemap:` line) in
`astro:build:done` or as an injected endpoint. Both need `site` (4.1) — skip with
a DEV warning when unset. Honours `noindex` (4.6).
**Done.** Hand-rolled injected endpoints — **not** `@astrojs/sitemap` — to keep
the near-zero-dependency stance and fully control `lastmod` (from `updated`) and
`noindex`/draft exclusion: `/sitemap.xml` and `/robots.txt` (allow-all +
`Sitemap:`), both gated on `site`. Verified: the demo's `noindex` `/mer` is absent
from the sitemap.

### 4.6 Per-section `draft` / `noindex` — `minor`, **S** — ✅ Done

**Why.** No way to publish a guide while one module is still rough, or to keep a
low-value page out of search.
**What.** Optional `draft?: boolean` / `noindex?: boolean` on `sectionSchema`.
`noindex` → `<meta name="robots" content="noindex">` + dropped from the sitemap
(4.5) and OG. `draft` additionally hides the module from nav/overview **in
production** but keeps it visible in `astro dev`. Additive optional fields →
`minor`.
**Done.** `draft`/`noindex` on `sectionSchema` (schema-tested). `loadCourse` drops
`draft` in PROD only — the single chokepoint, so nav, routing, sitemap and
xref-validation all agree — and keeps it visible in `astro dev`; `noindex` →
`<meta robots noindex>` + sitemap/OG exclusion.

---

## P1 — Apple, mobile & installable (PWA) — ✅ Complete

The Apple/mobile surface is essentially unconfigured. The headline wins are cheap
meta tags entirely absent today; the rest make the guide a real installable,
home-screen study app. All course-derived, no per-course code.

### 4.7 `theme-color`, `color-scheme` & `format-detection` — `patch`, **S** — ✅ Done

**Why.** Three cheap mobile-Safari wins, all missing. (a) No `theme-color`, so
the iOS/Android browser toolbar stays default grey instead of matching the page
ground. (b) No `color-scheme`, so native controls/scrollbars don't follow the
dark theme. (c) No `format-detection`, so iOS Safari auto-links decimals and
numeric ranges in a physics/maths guide as fake "phone numbers"
(tap-to-call on `1.5` or `240`).
**What.** `<meta name="theme-color" media="(prefers-color-scheme: light)"
content="…light ground…">` + a dark counterpart (values taken verbatim from the
real `tokens.css` grounds, not derived — explicit-over-derived); a `color-scheme:
light dark` meta + CSS; `<meta name="format-detection" content="telephone=no">`.
Pure additive, no schema.
**Done.** Per-scheme `theme-color` (light `#f5f7fa` / dark `#11161d`, verbatim from
`tokens.css`), `color-scheme: light dark`, and `format-detection: telephone=no` in
`CourseLayout`.

### 4.8 Web app manifest (installable PWA) — `minor`, **M** — ✅ Done

**Why.** No `manifest.webmanifest`, so the guide can't be "Add to Home
Screen"/installed — a natural fit for a revision tool a student opens daily in
exam season.
**What.** An injected `/manifest.webmanifest` endpoint (same `loadCourse()`
pattern as the pages) emitting `name`/`short_name` (`code`), `description`,
`lang`, per-theme `theme_color` + `background_color`, `display: standalone`,
`start_url: "/"`, `categories: ["education"]`, and `icons` (192/512 + a
`maskable` variant, 4.9). `<link rel="manifest">` in the head. Course-derived, no
per-course code.
**Done.** Injected `/manifest.webmanifest` from `loadCourse()`
(name/short_name/description/lang, `display: standalone`,
`categories:["education"]`, 192/512 + maskable icons) + `<link rel=manifest>`.

### 4.9 Apple touch icon + raster app icons — `minor`, **M** — ✅ Done

**Why.** The favicon is an SVG `data:` URI only. iOS ignores SVG for the
home-screen icon, and the manifest (4.8) needs raster PNGs — so an
installed/home-screened guide currently gets a blank/letter icon.
**What.** Rasterize the accent-tinted `>_` mark (reuse `lib/favicon.ts`
geometry) to 180×180 (`apple-touch-icon`) and 192/512 + maskable (manifest) at
build. Needs a rasterizer (`@resvg/resvg-js` or `sharp`) — a deliberate new
**build-time** dep weighed against the near-zero-dependency stance; mirror the
`scripts/fetch-fonts.mjs` pattern (a generator script whose output is
emitted/committed) so the runtime stays clean. Adds `<link rel="apple-touch-icon"
sizes="180x180" …>`.
**Done.** Per-course accent-tinted rasters generated in `astro:build:done` via a
**guarded dynamic `sharp` import** — located in the pnpm store / hoisted tree, so
**zero declared dependency** (same trick as the Pagefind import), degrading with a
warning if absent: `apple-touch-icon.png` (180, opaque), `icon-192/512.png`,
`icon-maskable-512.png`, plus a monochrome `safari-pinned-tab.svg`. Verified in the
demo build — no `@resvg`/extra dep after all.

### 4.10 Apple standalone meta + safe-area insets — `patch`, **S–M** — ✅ Done

**Why.** Once installable (4.8), the iOS standalone launch is unstyled: no
`apple-mobile-web-app-*` meta, and the sticky topbar/sidebar don't inset for the
notch / Dynamic Island / home indicator.
**What.** `mobile-web-app-capable` + `apple-mobile-web-app-capable`,
`apple-mobile-web-app-status-bar-style` (`black-translucent`),
`apple-mobile-web-app-title` (`code`); add `viewport-fit=cover` to the viewport
meta and `env(safe-area-inset-*)` padding to the topbar/sidebar/content in
`shell.css` so nothing hides under the notch in standalone or landscape. Also
clear the iOS tap-highlight flash and verify ≥44px tap targets on nav rows.
**Done.** `apple-mobile-web-app-*` + `application-name` meta; `viewport-fit=cover`;
`env(safe-area-inset-*)` insets on topbar/sidebar/footer via `max(token, env)` (so
0 on non-notch devices → no desktop regression); tap-highlight cleared; 44px min
nav-row height on touch.

---

## P2 — Generated assets, guards & polish — 4.12/4.13 ✅ · 4.11 ⏳

### 4.11 Auto-generated OG share image — `minor`, **L**

**Why.** A link card without an image is far weaker; hand-making one per
course/page doesn't scale and breaks the data-driven rule.
**What.** A build-time, per-page branded OG PNG (1200×630) — accent ground/rule,
the `>_` mark, course `code`, and the page title — via `satori` +
`@resvg/resvg-js` (the rasterizer from 4.9), emitted as static files by an
injected endpoint or build hook and wired to `og:image`/`twitter:image` +
`og:image:alt` (4.2). Static, no runtime or third-party calls. Big dep + effort,
so it sits behind the lighter metadata wins (4.1–4.7); could ship opt-in
(`course.yaml` `seo.ogImage: true`) at first.

### 4.12 Branded 404 page — `minor`, **S–M** — ✅ Done

**Why.** The integration injects only `/` and `/[slug]`
(`src/index.ts:77-86`), so a bad URL falls through to Astro's unstyled default
404 — off-brand, a dead end, and a soft-404 SEO smell.
**What.** Inject a `/404` route rendering the `CourseLayout` shell with a
course-styled "not found" message and links back to the overview + search.
Data-driven from `course`; no per-course code.
**Done.** Injected `/404` renders the full `CourseLayout` shell (topbar search +
sidebar) with a branded "Siden finnes ikke" panel + "Til oversikt" link; `noindex`.
Emits `404.html`.

### 4.13 Lighthouse CI budget (SEO/PWA/perf guard) — infra, **M** — ✅ Done

**Why.** The project targets Lighthouse ≥95 but nothing enforces it; the SEO/PWA tags
above can silently regress. Visual-regression (2.6) guards pixels, not metadata
or Core Web Vitals.
**What.** An `@lhci/cli` GitHub workflow that builds + previews the demo and
asserts category thresholds (Performance, SEO, Best-Practices, PWA) and CWV
budgets (LCP/CLS/TBT), alongside the existing `visual.yml`. Catches a dropped
canonical, a CLS regression, a missing `theme-color`. CI-only, like 2.6.
**Done.** `lighthouserc.json` + `.github/workflows/lighthouse.yml` (run via
`pnpm dlx` — no project dep). A11y + CLS are hard gates (`error`);
SEO/Best-Practices/Performance + LCP/TBT are `warn` (a localhost runner + the
demo's cross-origin canonical make them noisy — tune up once real baselines exist,
like the 2.6 pixel baselines). PWA is no longer a Lighthouse category.

---

## P3 — Offline & long-tail — 4.15 ✅ (partial) · 4.14 ⏳

### 4.14 Offline reading via service worker (PWA) — `minor`, **L**

**Why.** A revision guide is exactly what a student wants offline — on transit,
in a basement exam hall, on flaky campus wifi. Static output makes this safe and
cheap; with the manifest (4.8) it becomes a genuine installable offline study
app.
**What.** An **opt-in** precache service worker (`course.yaml`
`features.offline`) caching the static shell + visited pages (Cache-First for
fonts/CSS/KaTeX, Stale-While-Revalidate for pages); registered only in
production, with no network beacons (keeps the no-tracking stance). Hand-rolled
(small) rather than Workbox to keep deps lean; an update toast on new content.
Larger surface → demand-driven.

### 4.15 Long-tail Apple/social polish — `patch`, **S** each — ✅ Partial

**Why.** Remaining niceties below the headline wins.
**What.** Safari pinned-tab `mask-icon` (monochrome `>_` + accent `color`);
`apple-touch-startup-image` splash screens (generated, several device sizes —
only if standalone use grows); `@media (display-mode: standalone)` chrome tweaks;
`<meta name="author">` + a study-companion `<meta name="generator">`;
`og:image:alt`; an optional `course.seo.twitter` handle for
`twitter:site`/`creator`. Pull individually as demand appears.
**Done (the cheap head wins).** Shipped now: Safari pinned-tab `mask-icon`
(monochrome `>_`, tinted via the link `color`), `<meta name=generator>`,
`og:image:alt`, and the optional `twitter:site`/`creator` handle
(`course.seo.twitter`). **Still demand-driven:** generated
`apple-touch-startup-image` splash screens, `@media (display-mode: standalone)`
tweaks, `<meta name=author>`.

---

## P4 — Speculative (demand-driven)

- **`<Tabs>`** — alternative explanations / approaches / languages. *(minor, M)*
- **`<Embed>`** — privacy-friendly lecture-video facade with aspect-ratio box.
  *(minor, M)*
- **Preact escalation** for Quiz/Flashcards *only if* state grows. Not needed at
  current complexity.
- **Keystatic** content editing (a v1 non-goal) — revisit if non-technical
  authors appear.

---

## Recommended sequencing

1. **Release N (foundations + polish):** P0 wholesale — tests (0.1), dev fixture
   (0.2), heading fix (0.3), print (0.4), docs (0.5). Low-risk, unblocks the rest.
   → `minor` (tooling) + `patch` (fixes).
2. **Release N+1 (authoring power):** the widgets that kill the most repetition —
   `<Figure>` (1.1), `<Steps>` (1.2), `<KeyTakeaways>` (1.3), `<Hint>` (1.5).
   → `minor`.
3. **Release N+2 (UX):** keyboard control (1.7), arrow paging (1.8), overview
   progress (1.10), in-page TOC (1.9). → `minor`/`patch`.
4. **Release N+3 (scale):** parts (2.1), glossary (2.3), edit-this-page (2.2),
   self-hosted fonts (2.5). → `minor`/`patch`.
5. **Release N+4 (authoring kit & onboarding) — ✅ shipped:** the `course-template/`
   scaffold (3.1), `AUTHORING.md` with module archetypes + a widget decision guide
   (3.2–3.3), the per-section definition-of-done + brief template (3.4), and
   build-time xref validation (2.9) as the DoD's automated backstop.
   → `docs`/infra + `patch`.
6. **Release N+5 (exam & reference + code stepping) — ✅ shipped:** canonical
   `courseUrl` (3.5), the exam-page header (3.6), the official formula-sheet link
   (3.7), and the `<CodeBlock active-line>` sim-driven code-stepping upgrade (3.8,
   built in prep for the algorithm course). → `minor`/`patch`.
7. **Release N+6 (discoverability & install) — ✅ shipped:** the §4
   SEO/social/Apple/PWA tranche — `site` + canonical (4.1), Open Graph + Twitter
   (4.2), per-page descriptions (4.3), `theme-color`/`color-scheme`/
   `format-detection` (4.7), sitemap/`robots.txt` (4.5), JSON-LD (4.4); the
   installable-PWA set (manifest 4.8, raster icons 4.9, standalone + safe-area
   4.10); plus the branded 404 (4.12), Lighthouse CI (4.13) and the cheap long-tail
   head polish (4.15). All additive → `minor`/`patch`; verified against the demo
   build. **Deferred (both `L`, demand-driven):** the generated 1200×630 OG image
   (4.11) and the offline service worker (4.14).
8. **Ongoing:** visual-regression CI (2.6) and design-system unification
   (2.7–2.8) as capacity allows; the OG share image (4.11), offline SW (4.14) and
   the remaining long-tail polish (4.15) demand-driven.

**Status:** **All of P0–P3 is complete** (plus 2.9), **and the §4 SEO / social /
Apple-mobile / PWA tranche has now shipped** (N+6). Releases N through N+3 shipped
the foundations, the P1 widget set, the UX pass, and the scale + perf +
design-system work. Releases **N+4** (authoring kit — `course-template/` 3.1,
`AUTHORING.md` 3.2–3.3, section DoD + brief 3.4, build-time xref validation 2.9),
**N+5** (exam & reference surfacing 3.5–3.7 + sim-driven `<CodeBlock>` stepping 3.8)
and **N+6** (discoverability & install — 4.1–4.10, 4.12, 4.13, 4.15) are now shipped
and verified against the demo build. The framework is feature- *and*
onboarding-complete: a new course goes empty → shippable from the template against
`AUTHORING.md`, `pnpm build` enforces cross-reference integrity, and the head now
carries canonical/OG/Twitter, JSON-LD, a sitemap/`robots.txt`, an installable
manifest + per-course raster icons, and `theme-color`/safe-area mobile polish. **The
remaining framework work is small and demand-driven:** the generated 1200×630 OG
image (4.11, `L`), the offline service worker (4.14, `L`), generating the **2.6**
visual baselines on Linux, and the **P4 speculative** items (`<Tabs>`, `<Embed>`,
Preact/Keystatic escalation).

- **N (P0 foundations):** dev fixture, tests, heading fix, print, docs — all
  shipped and verified against the demo.
- **N+1 (authoring power):** the **entire P1 widget set** — `<Figure>` (1.1),
  `<Steps>` (1.2), `<KeyTakeaways>` (1.3), `<Compare>` (1.4), `<Hint>` (1.5),
  `<Statement>` (1.6) — all additive `minor`s, verified in both themes against the
  demo (`/mer`, `/sammenligning`).
- **N+2 (UX):** all five P1 UX items — keyboard control for islands (1.7),
  arrow-key paging (1.8), in-page TOC (1.9), overview progress (1.10), flashcard
  filtering (1.11) — all `patch`/`minor`, verified via `pnpm build`.
- **N+3 (scale + perf + design system):** parts (2.1), edit-this-page (2.2),
  glossary (2.3), formula cross-refs (2.4), self-hosted fonts (2.5), panel-header
  unification (2.7), importance visual system (2.8), visual-regression scaffold (2.6).
- **N+4 (authoring kit):** `course-template/` (3.1), `AUTHORING.md` + archetypes
  (3.2–3.3), section DoD + `SECTION-BRIEF.md` (3.4), and build-time xref validation
  (2.9) — the template builds clean (8 routes) as a smoke test.
- **N+5 (exam & reference + stepping):** `courseUrl` (3.5), exam-page header (3.6),
  official formula-sheet link (3.7), sim-driven `<CodeBlock>` stepping (3.8) — all
  verified in the demo build.
- **N+6 (discoverability & install):** the §4 tranche — `site`/canonical (4.1),
  OG + Twitter (4.2), per-page descriptions (4.3), JSON-LD (4.4), sitemap +
  `robots.txt` (4.5), `draft`/`noindex` (4.6), `theme-color`/`color-scheme`/
  `format-detection` (4.7), manifest (4.8), per-course raster icons (4.9),
  Apple standalone + safe-area (4.10), branded 404 (4.12), Lighthouse CI (4.13),
  long-tail head polish (4.15) — all `minor`/`patch`, verified in the demo build
  (new pure helpers `lib/seo.ts` + `lib/jsonLd.ts` are unit-tested).

**Do next:** with the §4 tranche shipped, the remaining work is mostly **content,
not framework**. **(a) Content:** migrate the first real course (optics) onto the
pinned framework using `course-template/` + `AUTHORING.md` (now including the
required `site` line), letting `pnpm build`'s xref validation (2.9) catch dead
links during the port; set `institution`/`seo.twitter` where they apply; exercise
**3.8** code stepping for real when the algorithm-visualizer course starts.
**(b) Remaining framework items, all demand-driven:** the generated 1200×630 OG
share image (4.11, `L` — would upgrade the interim square-icon card to
`summary_large_image`), the offline service worker (4.14, `L`), the remaining
long-tail Apple polish (4.15 — splash screens, `display-mode` tweaks), and
generating the **2.6** visual baselines on Linux (`pnpm test:visual:update`, then
commit) so CI has something to diff against — the §4 head changes are non-visual
(meta/JSON-LD), so they shouldn't move existing baselines. **P4 — Speculative**
(`<Tabs>`, `<Embed>`, Preact/Keystatic) stays demand-driven. Everything shipped is
additive, so `SCHEMA_VERSION` stays `1`; the §4 tranche is a `minor` release
(`package.json` bumped to `1.4.0`, the next minor after the existing `v1.3.0` tag).

## SemVer ledger (at a glance)

✅ = shipped · ⏳ = open (P-level in the body).

| Item | SemVer | Effort |
|---|---|---|
| ✅ 0.1 Unit tests | infra | M |
| ✅ 0.2 Dev fixture | infra | S–M |
| ✅ 0.3 Heading hierarchy | patch | S |
| ✅ 0.4 Print stylesheet | patch | S |
| ✅ 0.5 Docs/version reconcile | patch | S |
| ✅ 1.1 `<Figure>` | minor | M |
| ✅ 1.2 `<Steps>` | minor | S |
| ✅ 1.3 `<KeyTakeaways>` | minor | S |
| ✅ 1.4 `<Compare>` | minor | M |
| ✅ 1.5 `<Hint>` | minor | S |
| ✅ 1.6 `<Statement>` | minor | M |
| ✅ 1.7 Island keyboard control | patch | M |
| ✅ 1.8 Arrow-key paging | patch | S |
| ✅ 1.9 In-page TOC | minor | M |
| ✅ 1.10 Overview progress | patch | S–M |
| ✅ 1.11 Flashcard filtering | minor | S–M |
| ✅ 2.1 Section "parts" | minor | M |
| ✅ 2.2 Edit-this-page | minor | S |
| ✅ 2.3 Glossary | minor | M |
| ✅ 2.4 Formula cross-refs | minor | S–M |
| ✅ 2.9 Build-time xref validation | patch | S |
| ✅ 2.5 Self-host fonts | patch | M |
| ✅ 2.6 Visual regression CI | infra | L |
| ✅ 2.10 GoatCounter analytics | minor | S |
| ✅ 2.7 Unify panel header | patch | S–M |
| ✅ 2.8 `importance` visual system | patch | S |
| ✅ 3.1 `course-template/` scaffold | infra | M |
| ✅ 3.2 `AUTHORING.md` guide | docs | M |
| ✅ 3.3 Module archetypes | docs | S–M |
| ✅ 3.4 Section DoD + brief | docs | S |
| ✅ 3.5 `course.courseUrl` | minor | S |
| ✅ 3.6 Exam page header | patch | S |
| ✅ 3.7 Exam formula-sheet link | minor | S |
| ✅ 3.8 `<CodeBlock active-line>` | minor | M |
| ✅ 5.1 `<Simulation host="dom">` | minor | M |
| ✅ 5.2 `<Stepper>` trace player | minor | L |
| ✅ 5.4 `<Table>` | minor | S–M |
| ✅ 4.1 `site` origin + canonical | patch | S |
| ✅ 4.2 Open Graph + Twitter | minor | M |
| ✅ 4.3 Per-page description | patch | S |
| ✅ 4.4 Structured data (JSON-LD) | minor | M |
| ✅ 4.5 Sitemap + `robots.txt` | minor | S–M |
| ✅ 4.6 Section `draft`/`noindex` | minor | S |
| ✅ 4.7 `theme-color`/`color-scheme`/`format-detection` | patch | S |
| ✅ 4.8 Web app manifest | minor | M |
| ✅ 4.9 Apple touch + raster icons | minor | M |
| ✅ 4.10 Apple standalone + safe-area | patch | S–M |
| ⏳ 4.11 Auto OG share image | minor | L |
| ✅ 4.12 Branded 404 page | minor | S–M |
| ✅ 4.13 Lighthouse CI budget | infra | M |
| ⏳ 4.14 Offline service worker | minor | L |
| ✅ 4.15 Long-tail Apple/social polish (partial) | patch | S |

> ⏳ = open. No item here requires a **major** bump. The first change that forces existing
> courses to edit content (e.g. making `part` required, or restructuring
> `formulas`) is the trigger for v2 + `SCHEMA_VERSION` 2 + a `MIGRATIONS.md` entry.
