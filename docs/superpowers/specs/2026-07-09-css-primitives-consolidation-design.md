# CSS primitives consolidation — design

**Date:** 2026-07-09 · **Branch:** `design-polish` · **Status:** proposed

## Problem

The site's visual vocabulary was settled and documented in the design-polish
audit (see the `component-design-vocabulary` memory), but the CSS *implementing*
that vocabulary was hand-copied into each component's scoped `<style>`. The same
recipes are re-typed across ~20 files with small, unintended drifts. Concretely:

- **Tactile press** (`:active { transform: translateY(1px) }`) appears in **~10
  places**, each with the same "Shared tactile press (matches the shell
  buttons/tiles)" comment.
- The **copy button** exists twice as near-identical ~40-line twins: `.code-copy`
  (base.css) and `.fs-copy` (FormulaSheet).
- The **disclosure summary idiom** (Solution / Hint / Derivation) is re-implemented
  three times.
- **Icon buttons**, **chips/pills**, **mono kickers**, **floating cards**, and the
  **tile-lift** each recur with cosmetic variation.

## Goal

Extract the shared vocabulary into one documented layer of global class
"primitives" (a sibling of the `tokens.css` contract). Each component applies a
primitive class and keeps only genuinely-local overrides. Consolidate **and**
unify the small drifts, choosing one canonical value per drift (see the drift
table — the sign-off surface). Target: byte-identical rendering except the handful
of approved drifts, all of which are visually inert (`--card` == `--bg-elevated`,
`display:grid` vs `inline-grid` around a single centred glyph, etc.).

## Approach

**A global primitives layer.** A new `src/styles/primitives.css`, imported in
`CourseLayout.astro` **after `base.css`, before `shell.css`**, holding documented
global classes. Components apply the classes in markup and keep local scoped
overrides for size, fill, positioning, and container padding.

Rejected alternatives: shared Astro sub-components (the copy button is injected
onto every `<pre>` by a layout `<template>`, so a component can't own that path,
and disclosures resist a one-size component); SCSS/PostCSS mixins (adds a build
dependency and a second styling paradigm to a deliberately vanilla-CSS repo).

**Why global classes layer correctly with Astro scoping.** Astro hashes a
component's scoped selectors to `.foo[data-astro-cid-xxx]` (specificity 0-2-0). A
global primitive class is 0-1-0. So a component's *remaining* scoped rule always
wins over the primitive base — local overrides (e.g. `.fs-copy { margin-left:
auto }`) keep working without `!important`. Where a component fully delegates to a
primitive, its scoped rule is deleted, so there is no conflict. `primitives.css`
is global, so descendant selectors like `.sc-copy .i-check` reach `<Icon>` child
SVGs without `:global()` (exactly as `base.css`'s `.code-copy .i-check` does today).

## The primitive set

Naming: `sc-` prefix (study-companion), matching the existing `sc:`-namespaced
conventions (`@keyframes sc-target-flash`, the `sc:theme:*` storage keys, the
`sc:themechange` event).

| Class | What it is | Replaces / call sites |
|---|---|---|
| `.sc-press` | `:active { transform: translateY(1px) }` | ~10 copies + the shell.css central list. Applied to every pressable **except** the flashcard flip card, disclosure `<summary>`s, and glyph-nudge elements (they own a transform). |
| `.sc-icon-btn` | Square icon control: `inline-grid` + `place-items:center`, `1px --border`, `--radius-sm`, `--bg-elevated` fill, `--muted`, transition. Neutral chrome hover (`--card-hover` bg, `--border-strong`, `--fg`). | `theme-toggle`, `search-trigger`. Size set by caller. |
| `.sc-copy` | An icon control with an **accent** hover and copy→check icon-swap (`data-copied` → `--tip`). 32px. | `.code-copy` (base.css) + `.fs-copy` (FormulaSheet). Positioning/visibility stays local. |
| `.sc-summary` / `.sc-chev` | Disclosure summary idiom: flex, mono `--text-sm` accent, marker-hide, `color-mix(--fg 6%)` ink hover, `[open]` `--border` bottom divider; `.sc-chev` rotates 90° when open. | Solution, Hint, Derivation summaries. `.sc-chev` also shared by SelfCheck. Container radius/padding stays local. |
| `.sc-chip` | Pill frame: `1px --border-strong`, `--radius-pill`, mono, `--muted`, transition. | `fc-chip`, `fs-chip`. Size / padding / fill / display local. |
| `.sc-kicker` | Mono uppercase label recipe: `--font-mono`, `text-transform:uppercase`, `--tracking`, `--weight-semibold`. | `PanelHeader.panel-kicker` + re-impls in Answer, Statement, ExamSummary, Flashcards, MemorizeBadge. Size + tone colour set by caller. |
| `.sc-panel` | Floating content card: `--bg-elevated`, `--shadow-sm`, `--radius`. | Example, CompareCol, Simulation, Stepper, Flashcards, Quiz, SelfCheck, Solution/Hint (`--radius-sm` variant), Derivation. Padding/overflow local. **`base.css` still owns the nested-alternation** (`:is()` recess rules) — `.sc-panel` only sets the resting float. |
| `.sc-tile` | Interactive lift surface: `--radius`, `--bg-elevated`, `--shadow-sm` at rest → `--shadow` on hover (bg → `--card`), transition. | `module-tile`, `page-link`. Layout/content stays local. |

## Drift table (sign-off surface)

Rule applied: **share the recipe; keep contextual values (size, fill, positioning,
container padding) as caller overrides or named variants; conform only accidental
differences.** Every conform below is visually inert unless noted.

| ID | Drift | Decision |
|---|---|---|
| IB-1 | Icon-button size: `theme-toggle`/`search-trigger` = `--control-h` (38px); copy = 32px | **Keep both** — topbar chrome (38, matches control row) vs. in-content copy (32, quieter). `.sc-icon-btn` sets no size; callers do. |
| IB-2 | Icon-button hover: chrome = neutral (`--card-hover`/`--border-strong`/`--fg`); copy = accent (`--accent`) | **Keep both** as the two variants (`.sc-icon-btn` neutral default, `.sc-copy` accent). Semantically distinct. |
| IB-3 | `display`: `theme-toggle` `inline-grid`; copy buttons `grid` | **Conform** to `inline-grid` + `place-items:center` (single centred glyph — inert). |
| IB-4 | `search-esc` (a keycap: `--radius-xs`, `--card`, small) | **Exclude** from `.sc-icon-btn` — it reads as a `<kbd>`, not an icon button. Gets `.sc-press` only. |
| CP-1 | `.code-copy` vs `.fs-copy` box (32px, border, radius, icon-swap, `data-copied`) | **Merge** into `.sc-copy`. Identical today. |
| CP-2 | Copy positioning: `.code-copy` absolute + `pre:hover` opacity reveal + `@media(hover:none)` always-on; `.fs-copy` static, `margin-left:auto`, always visible | **Keep local** — the `<pre>` template keeps a slim `.code-copy` (position + opacity only); FormulaSheet keeps `.fs-copy` (flex placement only). Both **add** `.sc-copy`. |
| DS-1 | Disclosure container radius: Solution/Hint `--radius-sm`; Derivation `--radius` | **Keep** — radius tracks block scale (small nested reveal vs. standalone block). |
| DS-2 | Summary padding: Solution/Hint `--space-2 --space-3`; Derivation `--space-3 --space-4` | **Keep** — tracks the same scale difference; stays local. |
| DS-3 | Derivation targets a bare `summary` selector (unclassed) | **Conform** — use `.sc-summary` class like the others. |
| DS-4 | SelfCheck disclosure: inline reveal, underline hover, no `[open]` divider (body `border-top` instead) | **Keep** as a distinct "inline reveal" variant (it sits under a question, not as a panel bar). Shares **`.sc-chev`** only, not `.sc-summary`. |
| DS-5 | Hint "Løsning" rung: green-tinted (`--tip` summary, `--answer-bg`) | **Keep** as a local modifier layered over `.sc-summary`. |
| PC-1 | Card fill: Quiz/SelfCheck `--card`; everyone else `--bg-elevated` | **Conform** to `--bg-elevated`. `--card` == `--bg-elevated` in both themes (`#f2f0e5` / `#1c1b1a`) — zero visual change; removes the two-names-one-colour ambiguity for float cards. |
| PC-2 | Card radius `--radius` vs Solution/Hint `--radius-sm` | **Keep** — Solution/Hint stay `--radius-sm` (small reveals) via local override. |
| PC-3 | Technical frames (`FormulaSheet` list, `Glossary` list) use `--card` + `--border`, no shadow | **Exclude** from `.sc-panel` — per the vocabulary contract these keep their `--border` (the line IS the point); not floating cards. |
| PC-4 | `Figure` frame uses `--canvas-bg` | **Exclude** — figure frame, different token/role. |
| TL-1 | `module-tile` / `page-link` lift (shadow-sm rest → shadow hover) | **Merge** into `.sc-tile`. |
| TL-2 | `nav-link`: flat at rest (no resting shadow) → `--shadow` on hover; `1px transparent` border; `--accent-soft` active | **Keep local** (intentional: a scrolling rail — resting shadows on every row read noisy). Adopts `.sc-press`; does **not** take `.sc-tile`. |
| CH-1 | Chip size/fill: `fc-chip` (`3px --space-3`, `--text-xs`, `--bg-elevated`); `fs-chip` (`0.4em 0.95em`, `--text-sm`, `--card`, `inline-flex`+gap) | Share `.sc-chip` frame; **keep** size/padding/display local. `fs-chip` fill `--card` → `--bg-elevated` (**conform**, inert). |
| KK-1 | Kicker size: PanelHeader/Statement `--text-sm`; Answer/ExamSummary/Flashcards/MemorizeBadge `--text-xs` | Share `.sc-kicker` type recipe; **keep** each caller's size + tone colour. |
| PR-1 | Tactile press hand-typed ×10 + shell.css selector list | **Merge** into `.sc-press` utility class, applied in markup (component templates + the shell HTML in CourseLayout/index/[slug]). |

## Migration (files touched)

- **New:** `src/styles/primitives.css`; import in `CourseLayout.astro` after `base.css`.
- **base.css:** slim `.code-copy` to position + opacity only (box moves to `.sc-copy`).
- **CourseLayout.astro:** `<template id="code-copy-tpl">` class `code-copy` → `code-copy sc-copy`; add `.sc-press` to shell pressables (tiles/pager/done-btn/hero-continue/menu-toggle) — or keep their `:active` list if cleaner; decided in the plan.
- **shell.css:** replace the `module-tile`/`page-link` lift with `.sc-tile` in markup; remove the central press list in favour of `.sc-press`.
- **Components:** ThemeToggle, SearchPalette, FormulaSheet, Solution, Hint, Derivation, SelfCheck, Quiz, Flashcards, Stepper, Simulation, Example, CompareCol, Answer, Statement, ExamSummary, PanelHeader, MemorizeBadge — apply the relevant primitive class(es) and delete the now-redundant scoped rules, keeping only local overrides per the drift table.

## Non-goals

- No redesign — the target look is the current look. No new tokens.
- No author-facing API change (primitives are internal chrome; MDX widgets unchanged).
- No schema/version bump (CSS-only; `SCHEMA_VERSION` untouched). A patch release
  tag + course-pin bump happens per the normal release rule once merged, if desired.
- Not touching FROZEN optics.

## Verification

- `pnpm typecheck` + `pnpm build` (self-hosted demo, exercises every widget in
  both themes) must pass clean.
- `pnpm test:visual:update` to regenerate baselines, then **eyeball a regenerated
  shot per route × theme** — diffs must be nil except the approved inert drifts.
  (Kill any stale `:4321` preview first — see the `visual-baseline-stale-preview-server`
  note.)
- Spot-check the two themes for: copy button hover/copied states, all disclosures
  open/closed, tiles/pager/nav hover + press, chips, kickers.

## Risks

- **Specificity regressions** if a scoped override is deleted but still needed —
  caught by the visual pass.
- **`.sc-press` reaching an excluded element** (flip card / summary / glyph-nudge)
  and double-transforming — mitigated by applying the class deliberately, not via
  a broad selector.
- **Icon-swap scope** — verify `.sc-copy .i-copy/.i-check` toggles correctly from
  the global file for both the injected `<pre>` button and FormulaSheet.
