# study-companion — Improvement Roadmap

Forward-looking plan for the framework: new widgets, UX/a11y, schema, perf, and
DX. This is a *menu*, not a commitment — each item is sized and tagged so we can
pull the highest-value ones into a release.

> Scope reminder (see `CLAUDE.md` + `study-companion-DESIGN.md`): everything must
> stay **data-driven off the schema**, with **zero per-course logic** in the
> framework. Course repos pin a tag and only author `content/`.

## How to read this

Each item carries:

- **SemVer** — `patch` (fix/polish, no contract change) · `minor` (new optional
  field or widget, backward-compatible) · `major` (breaking schema change). This
  governs the release it can ship in. Bump `SCHEMA_VERSION` + `MIGRATIONS.md`
  only for `major`.
- **Effort** — S (≲half-day) · M (1–2 sessions) · L (multi-session).
- **Priority** — P0 foundations → P3 speculative.

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

## P1 — High-value new widgets

Each removes a real authoring repetition seen in study-guide content. All are
additive → `minor`, available via `mdx-components.ts` with no per-file imports.

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

### 1.4 `<Compare>` — side-by-side concept table — `minor`, **M**
**Why.** Comparisons ("konstruktiv vs destruktiv", "reell vs virtuell bilde") are
constant and currently hand-built as fragile Markdown tables that wrap badly on
mobile.
**What.** `<Compare>` with 2–3 labelled columns; responsive (stacks on mobile),
KaTeX-aware cells, optional row labels. One styled, accessible primitive instead
of bespoke tables.

### 1.5 `<Hint>` ladder — progressive disclosure for problems — `minor`, **S** — ✅ Done
**Why.** `<SelfCheck>` reveals one answer; real problem-solving wants *graduated*
hints (nudge → method → full solution) so students self-scaffold.
**Done.** `<Hints>` wrapping `<Hint>` children, each a native `<details>` (no JS).
Auto-labels "Hint 1", "Hint 2", … from a counter reset per ladder; `<Hint solution>`
is the green "Løsning" closer (tinted like `<Answer>`, left out of the numbering),
and `label` overrides for a custom rung. Verified both themes.

### 1.6 `<Statement>` — named results (law/theorem/definition) — `minor`, **M**
**Why.** Physics/math guides reference named results ("Snells lov", "Huygens'
prinsipp") repeatedly; today they're bold prose with no consistent treatment and
no anchor to link to.
**What.** `<Statement kind="law|theorem|definition|principle" name=…>` → a labeled
boxed result with a stable `id` (anchor for deep-links and future cross-refs, see
2.4). Could later auto-collect into a glossary (2.3).

---

## P1 — UX & interaction upgrades

Mostly `patch`/`minor` polish on existing islands. High perceived-quality return.

### 1.7 Keyboard control for islands — `patch` (a11y), **M**
**Why.** Core interactions are mouse-only.
**What.**
- **Flashcards**: `Space`/`Enter` flip, `←/→` navigate, `1`/`2` rate. (Currently
  click-only — `Flashcards.astro` has no `keydown`.)
- **Search**: `↑/↓` to move through results and `Enter` to open (today results are
  click-only; only open/close is keyboarded).
- **Quiz**: options are `<button>`s (already focusable) — verify arrow/Enter flow
  and `aria-live` announce the result.

### 1.8 Prev/next module via arrow keys — `patch`, **S**
**Why.** Multi-page guide; readers expect `←/→` to page between modules. The
`.page-actions` links already exist (`[slug].astro:124`); just wire global
keyboard (guarded against typing in inputs/search-open) with an a11y hint.

### 1.9 In-page "På denne siden" mini-TOC for long modules — `minor`, **M**
**Why.** DESIGN.md skipped a scroll-spy TOC because nav is page-to-page — correct
for *short* modules, but long modules (lots of `##`) have no within-page wayfinding.
**What.** Optional auto-generated TOC from a section's `h2`/`h3` (rehype-slug +
collected headings), shown only above a heading-count threshold, with scroll-spy
highlight and `prefers-reduced-motion`-safe smooth scroll. Anchor links on
headings (hover "#") for deep-linking/sharing.

### 1.10 Progress surfaced on the overview — `patch`, **S–M**
**Why.** `importance` (core/useful/extra) and per-module done state are computed
but barely visible. The overview tiles (`index.astro:89`) show num/title/week
only.
**What.** Show a done check + subtle "core/useful/extra" treatment on each tile;
add an "X av N fullført" ring to the hero and a **"Fortsett der du slapp"** link
to the first unread module (reads the same `sc:progress:<code>` key). All
client-side, progressive-enhancement.

### 1.11 Flashcard deck filtering — `minor`, **S–M**
**Why.** Decks render all cards; large decks want focus.
**What.** Filter by `section`/`tags` (already in the flashcards schema),
**shuffle**, and an "øv bare på de jeg ikke kan" mode using the existing
localStorage levels. No schema change — data already present.

---

## P2 — Schema & scalability

These let bigger/second courses (algdat) land without template edits.

### 2.1 Section grouping into "parts" — `minor`, **M**
**Why.** The module list is flat. A larger course wants chapters ("Del 1:
Geometrisk optikk"). Today the only grouping is the `Kom i gang / Verktøy /
Moduler / Lenker` chrome buckets.
**What.** Optional `part: string` on `sectionSchema`. Sidebar groups modules under
part headers (in `order`); overview groups tiles by part. Absent `part` → today's
flat behavior (backward-compatible → `minor`). Numbering in `lib/nav.ts` stays
global and gap-free.

### 2.2 "Edit this page" + freshness — `minor`, **S**
**Why.** Maintainability + trust. No way to jump from a rendered page to its MDX,
and no "last updated" signal.
**What.** Optional `course.repoUrl` (+ optional per-section `updated` date). Footer
gets an "Rediger denne siden" link built from `repoUrl` + section file path, and
an "Oppdatert {date}" line. Pure additive.

### 2.3 Glossary — schema + tool page — `minor`, **M**
**Why.** Study guides define terminology constantly; there's no glossary and no
reuse of definitions.
**What.** `course.glossary: [{ term, definition, section? }]` + a `Begreper`/
glossary tool page (mirrors `FormulaSheet` — searchable, grouped, KaTeX-aware) and
an inline `<Term>` that links into it. Reuses the proven FormulaSheet UI pattern.

### 2.4 Formula cross-references — `minor`, **S–M**
**Why.** Prose says "by the formula above" instead of linking. `formulas[]` entries
have no stable id.
**What.** Optional `id` on `formulaEntrySchema`; a `<FormulaRef id>` inline that
renders the formula's label and deep-links to its row in the sheet. Couples nicely
with `<Statement>` ids (1.6).

> Keep these **minor**: all optional, no `SCHEMA_VERSION` bump. The first item
> that *requires* restructuring existing content is the next `major`.

---

## P2 — Performance & infrastructure

### 2.5 Self-host & subset fonts — `patch`, **M**
**Why.** Fonts load from the Google CDN via a render-blocking `<link>`
(`CourseLayout.astro:80-85`) — a third-party dependency, a privacy footprint, and
a render/CLS cost. DESIGN.md targets Lighthouse ≥95.
**What.** Vendor Fraunces/Spectral/IBM Plex Mono into the package, subset to the
glyphs used, `font-display: swap`, `preload` the critical body weight, self-host
KaTeX fonts. Removes the external request entirely.

### 2.6 Visual regression snapshots — infra, **L**
**Why.** The polish bar is high and verification is manual screenshotting. A
versioned library should lock in pixels.
**What.** Playwright snapshots of the kitchen-sink fixture (0.2) per widget in
both themes; run in CI on PRs. Catches the class of scoped-CSS regressions we hit
before (the theme-toggle icon scope bug).

---

## P2 — Design-system consistency

### 2.7 Unify the "panel header" pattern — `patch`, **S–M**
**Why.** `Example`, `Simulation`, `FormulaSheet`, `CodeBlock` each implement their
own header bar (badge/dot/title) with slightly different spacing. Small drifts
accumulate.
**What.** Extract one shared panel-header treatment (tokens or a tiny internal
component) and route the four through it. Pure refactor; screenshot-compare to
prove no visual change.

### 2.8 `importance` as a real visual system — `patch`, **S**
**Why.** `core/useful/extra` exists in the schema and `--core/--useful/--extra`
tokens exist, but the distinction is nearly invisible in nav/tiles/header.
**What.** A consistent, AA-safe importance treatment across sidebar, overview
tiles and module header (badge or accent rule, never color-alone). Decide the one
canonical expression and apply it everywhere.

---

## P3 — Speculative (only if a course needs it)

- **`<Tabs>`** — alternative explanations / approaches / languages. *(minor, M)*
- **`<Embed>`** — privacy-friendly lecture-video facade with aspect-ratio box.
  *(minor, M)*
- **Preact escalation** for Quiz/Flashcards *only if* state grows (DESIGN.md
  §10). Not needed at current complexity.
- **Keystatic** content editing (DESIGN.md non-goal v1) — revisit if non-technical
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
5. **Ongoing:** visual-regression CI (2.6) and design-system unification
   (2.7–2.8) as capacity allows.

**Status:** Releases N and N+1 are **complete**.

- **N (P0 foundations):** dev fixture, tests, heading fix, print, docs — all
  shipped and verified against the demo.
- **N+1 (authoring power):** `<Figure>` (1.1), `<Steps>` (1.2),
  `<KeyTakeaways>` (1.3), `<Hint>` (1.5) — all additive `minor`s, verified in both
  themes against the demo (`/mer`). Still open in P1 widgets: `<Compare>` (1.4),
  `<Statement>` (1.6).

**Do next:** Release N+2 (UX) — keyboard control for islands (1.7), arrow-key
paging (1.8), overview progress (1.10), in-page TOC (1.9). Or mop up the two
remaining P1 widgets first (`<Compare>`, `<Statement>`).

## SemVer ledger (at a glance)

✅ = shipped.

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
| 1.4 `<Compare>` | minor | M |
| ✅ 1.5 `<Hint>` | minor | S |
| 1.6 `<Statement>` | minor | M |
| 1.7 Island keyboard control | patch | M |
| 1.8 Arrow-key paging | patch | S |
| 1.9 In-page TOC | minor | M |
| 1.10 Overview progress | patch | S–M |
| 1.11 Flashcard filtering | minor | S–M |
| 2.1 Section "parts" | minor | M |
| 2.2 Edit-this-page | minor | S |
| 2.3 Glossary | minor | M |
| 2.4 Formula cross-refs | minor | S–M |
| 2.5 Self-host fonts | patch | M |
| 2.6 Visual regression CI | infra | L |
| 2.7 Unify panel header | patch | S–M |
| 2.8 `importance` visual system | patch | S |

> No item here requires a **major** bump. The first change that forces existing
> courses to edit content (e.g. making `part` required, or restructuring
> `formulas`) is the trigger for v2 + `SCHEMA_VERSION` 2 + a `MIGRATIONS.md` entry.
