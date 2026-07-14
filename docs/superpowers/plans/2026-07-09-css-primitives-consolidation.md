# CSS Primitives Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the site's repeated scoped-CSS vocabulary (tactile press, copy button, disclosure summary, icon button, chip, kicker, floating card, tile-lift) into one documented global primitives layer, and conform the accidental drifts, with byte-identical rendering except a handful of visually-inert conforms.

**Architecture:** A new `src/styles/primitives.css` holds global class "primitives" (`.sc-*`), imported after `base.css` and before `shell.css`. Each component/template applies the relevant primitive class and deletes the now-redundant scoped declarations, keeping only genuinely-local overrides (size, positioning, container padding, tone colour). Astro hashes a component's scoped selectors to specificity 0-2-0, so any remaining scoped override beats the 0-1-0 primitive base without `!important`.

**Tech Stack:** Astro 6 components with scoped `<style>`; vanilla CSS + design tokens (`tokens.css`); no preprocessor, no new dependency.

## Global Constraints

- **Do NOT commit or push.** The repo owner verifies everything locally. Each task ends with a **build verification**, not a git commit. (Overrides the writing-plans default of committing per task.)
- **Do NOT start/stop the user's dev server.** Verify with `pnpm build` (one-shot). If a task needs the visual harness, that is the final task only.
- **Verification gate per task:** `pnpm build` must complete cleanly (it builds the self-hosted demo course under `demo/`, exercising every widget in both themes and validating cross-refs). If the local `pnpm` store is mismatched and blocks install/build, report it and stop — do not skip verification silently.
- **Preserve every component container class** (`.example`, `.quiz`, `.solution`, `.hint`, `.derivation`, `.simulation`, `.stepper`, `.compare-col`, `.formula`, `.figure-frame`). The nested-card alternation rules in `base.css` match those exact class names with `!important` — adding a `.sc-panel` alongside is additive; removing the container class would break nesting.
- **Naming:** `sc-` prefix, matching the existing `sc:`-namespaced conventions (`@keyframes sc-target-flash`, `sc:theme:*`, `sc:themechange`).
- **`--card` == `--bg-elevated`** in both themes (`#f2f0e5` / `#1c1b1a`) — conforming a float card's fill from `--card` to `--bg-elevated` is a zero-pixel change.
- **Drift decisions are fixed by the spec** (`docs/superpowers/specs/2026-07-09-css-primitives-consolidation-design.md`). Do not introduce new drifts.

---

### Task 1: Create the primitives layer and wire the import

**Files:**

- Create: `src/styles/primitives.css`
- Modify: `src/layouts/CourseLayout.astro:16` (add import after `base.css`)

**Interfaces:**

- Produces: global classes `.sc-press`, `.sc-icon-btn`, `.sc-copy`, `.sc-summary`, `.sc-chev`, `.sc-chip`, `.sc-kicker`, `.sc-panel`, `.sc-tile` — consumed by every later task.

- [ ] **Step 1: Create `src/styles/primitives.css`**

```css
/*
 * Shared component primitives — the visual vocabulary from the design-polish
 * audit, extracted from per-component scoped <style> into ONE documented layer.
 * A sibling of the tokens.css contract: a component applies a class below and
 * keeps only its own local overrides. Astro hashes a component's scoped
 * selectors to 0-2-0, so a scoped override always beats these 0-1-0 globals —
 * local tweaks keep working without !important. Loaded after base.css so it can
 * rely on the token + element base, and before shell.css.
 */

/* --- Tactile press ---
   Every clickable dips 1px on press. Deliberately excludes the flashcard flip
   card, disclosure <summary>s and glyph-nudge elements — they own a transform. */
.sc-press:active {
  transform: translateY(1px);
}

/* --- Square icon control (theme toggle, search trigger) ---
   Box + neutral chrome hover. Size is the caller's (--control-h for topbar
   chrome). The copy button is a separate, accent-hover variant below. */
.sc-icon-btn {
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  color: var(--muted);
  transition:
    color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease);
}
.sc-icon-btn:hover {
  color: var(--fg);
  background: var(--card-hover);
  border-color: var(--border-strong);
}

/* --- Copy control (code blocks + formula sheet) ---
   A 32px icon control whose hover reads "actionable" (accent, not neutral) and
   which swaps a copy glyph for a check once copied. NO transition here: the
   <pre> copy button also animates opacity on reveal, and an equal-specificity
   transition would clobber it — so each caller keeps its own transition.
   Positioning/visibility is the caller's (absolute+opacity over a <pre>, or
   static in a row). Icons come from <Icon> children; this file is global, so no
   :global() is needed to reach .i-copy / .i-check. */
.sc-copy {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  color: var(--muted);
}
.sc-copy svg {
  display: block;
}
.sc-copy:hover {
  color: var(--accent);
  border-color: var(--accent);
}
.sc-copy .i-check {
  display: none;
}
.sc-copy[data-copied="true"] {
  color: var(--tip);
  border-color: var(--tip);
}
.sc-copy[data-copied="true"] .i-copy {
  display: none;
}
.sc-copy[data-copied="true"] .i-check {
  display: block;
}

/* --- Disclosure summary idiom (Solution / Hint / Derivation) ---
   Apply .sc-summary to the <summary> and wrap the chevron glyph in .sc-chev.
   The container (radius / padding / margin) stays the component's. */
.sc-summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--accent);
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: background-color var(--dur-fast) var(--ease);
}
.sc-summary::-webkit-details-marker {
  display: none;
}
/* The panel sits on --card-nested (== --card-hover), so a neutral fill hover is
   invisible; a faint ink overlay darkens it on any surface. */
.sc-summary:hover {
  background: color-mix(in srgb, var(--fg) 6%, transparent);
}
details[open] > .sc-summary {
  border-bottom: 1px solid var(--border);
}
.sc-chev {
  display: inline-flex;
  transition: transform var(--dur-fast) var(--ease);
}
details[open] > summary .sc-chev {
  transform: rotate(90deg);
}

/* --- Pill chip frame (filter toggles, formula tags) ---
   Frame + type only; size / padding / fill / display / hover stay the caller's. */
.sc-chip {
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  color: var(--muted);
  transition:
    color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease);
}

/* --- Mono uppercase kicker / label ---
   The type recipe only; size + tone colour stay the caller's. */
.sc-kicker {
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: var(--tracking);
  font-weight: var(--weight-semibold);
}

/* --- Floating content card ---
   Fill + soft shadow at rest. base.css owns the nested-alternation (a card
   nested in another recesses to --card-nested with no shadow, via !important
   rules that match the component container classes), so KEEP those classes and
   only add .sc-panel alongside. Radius/padding stay the caller's where they
   legitimately differ (e.g. Solution/Hint keep --radius-sm). */
.sc-panel {
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius);
}

/* --- Interactive tile-lift (overview tiles, prev/next pager) ---
   Borderless, soft shadow at rest, lifting to the full shadow on hover. Layout
   stays the caller's. (nav-link is deliberately NOT this — flat at rest; see
   shell.css.) */
.sc-tile {
  border-radius: var(--radius);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease);
}
.sc-tile:hover {
  box-shadow: var(--shadow);
  background: var(--card);
}
```

- [ ] **Step 2: Add the import in `CourseLayout.astro`**

Find (around line 15-16):

```js
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/shell.css";
```

Replace with:

```js
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/primitives.css";
import "../styles/shell.css";
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: build completes cleanly. Nothing yet applies the new classes, so rendering is unchanged — this only proves the file parses and imports.

---

### Task 2: `.sc-press` — unify the tactile press

Replace the ~10 scattered `:active { transform: translateY(1px) }` blocks (and the shell.css central list) with the `.sc-press` class in markup.

**Files (add `sc-press` to the class list of each element, then delete the noted rule):**

- Modify `src/components/ThemeToggle.astro`: button `class="theme-toggle"` → `class="theme-toggle sc-press"`; delete the `.theme-toggle:active { transform: translateY(1px); }` rule + its comment.
- Modify `src/components/Flashcards.astro`: add `sc-press` to the `.fc-reset`, `.fc-chip`, and `.fc-btn` (nav/review/known) buttons; delete the `.fc-reset:active, .fc-chip:active, .fc-btn:active { transform: translateY(1px); }` block + comment.
- Modify `src/components/FormulaSheet.astro`: add `sc-press` to the `.fs-chip` and `.fs-copy` elements; delete the `.fs-chip:active, .fs-copy:active { transform: translateY(1px); }` block + comment.
- Modify `src/components/SearchPalette.astro`: add `sc-press` to `.search-trigger` and `.search-esc`; delete both `:active` transform rules + comments.
- Modify `src/components/Stepper.astro`: add `sc-press` to `.stepper-btn` and `.stepper-ghost` buttons; delete the `.stepper-btn:active, .stepper-ghost:active { transform: translateY(1px); }` block + comment (leave the play-glyph's own inner transform untouched).
- Modify `src/components/Simulation.astro`: add `sc-press` to its control button(s) that carry the `:active` transform; delete that `:active` block + comment.
- Modify `src/styles/base.css`: the `<pre>` copy button — see Task 3 (it gets `sc-press` via the template). Delete the `.code-copy:active { transform: translateY(1px); }` rule + the `/* Shared tactile press ... */` comment here.
- Modify `src/layouts/CourseLayout.astro`: add `sc-press` to the `.menu-toggle` button and the `<template id="code-copy-tpl">` button (the latter also handled in Task 3).
- Modify `src/pages/index.astro`: add `sc-press` to each `.module-tile` anchor and the `.hero-continue` link.
- Modify `src/pages/[slug].astro`: add `sc-press` to each `.page-link` anchor and the `.done-btn` button.
- Modify `src/styles/shell.css`: delete the central press list `.module-tile:active, .page-link:active, .done-btn:active, .hero-continue:active, .menu-toggle:active { transform: translateY(1px); }` + its comment (now provided by the class).

**Exception (do NOT convert):** `Quiz.astro` `.quiz-option` keeps its local `:active:not([disabled]) { transform: translateY(1px); }` — the `:not([disabled])` guard is intentional (a graded option must not press). Leave it as-is.

- [ ] **Step 1: Apply the class additions and rule deletions above.**

- [ ] **Step 2: Grep to confirm no stray press blocks remain**

Run: `grep -rn "translateY(1px)" src/`
Expected: matches only in `src/styles/primitives.css` (`.sc-press`) and `src/components/Quiz.astro` (the guarded exception). No other file.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: clean build; press behaviour visually identical (tap any button/tile — 1px dip).

---

### Task 3: `.sc-copy` — merge the two copy buttons

**Files:**

- Modify: `src/styles/base.css` (slim `.code-copy` to position + opacity only)
- Modify: `src/layouts/CourseLayout.astro` (the `<template id="code-copy-tpl">` button class)
- Modify: `src/components/FormulaSheet.astro` (`.fs-copy`)

- [ ] **Step 1: Point the injected `<pre>` copy button at the primitive**

In `CourseLayout.astro`, the copy button template (around line 360-365) has `class="code-copy"`. Change it to:

```html
class="code-copy sc-copy sc-press"
```

- [ ] **Step 2: Slim `.code-copy` in `base.css` to only its local concerns**

Replace the entire `.code-copy` block group in `base.css` (the rule + `.code-copy svg`, the `pre:hover`/`focus-visible` reveal, the `@media (hover: none)`, the `:active`, the `.i-check`/`data-copied` icon-swap rules — everything from `.code-copy {` down to the last `data-copied` rule) with just:

```css
/* Copy button injected by the layout's enhancement script onto every <pre>.
   Box, hover and icon-swap come from the shared .sc-copy primitive; the press
   from .sc-press. base.css owns only what is code-block-specific: it floats over
   the code and fades in on hover. */
.code-copy {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}
pre:hover .code-copy,
.code-copy:focus-visible {
  opacity: 1;
}
/* Touch devices have no hover, so keep the control reachable there. */
@media (hover: none) {
  .code-copy {
    opacity: 1;
  }
}
```

Note: the `:active` press and icon-swap were removed here — they now come from `sc-press` + `sc-copy` on the element. Do not leave a duplicate `.code-copy .i-check` rule behind.

- [ ] **Step 3: Reduce `.fs-copy` in `FormulaSheet.astro` to its placement only**

The `<button class="fs-copy">` gains the shared classes → `class="fs-copy sc-copy sc-press"`. Then replace the `.fs-copy` scoped rule and all its followers (`.fs-copy:hover`, the `.fs-chip:active, .fs-copy:active` press [already removed in Task 2], the `.fs-copy :global(.i-check)` / `data-copied` icon-swap rules) with only the row-placement bits:

```css
/* Box, hover, icon-swap and press come from .sc-copy / .sc-press; the sheet
   only positions the button at the row's trailing edge. */
.fs-copy {
  flex: none;
  margin-left: auto;
}
```

- [ ] **Step 4: Confirm no orphaned copy CSS remains**

Run: `grep -rn "i-copy\|i-check\|data-copied" src/`
Expected: matches only in `src/styles/primitives.css` (the `.sc-copy` swap). No `.code-copy`/`.fs-copy`-scoped icon rules remain.

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: clean build. In `pnpm preview`, both copy buttons show the copy glyph, swap to a check on click (turning `--tip` green), accent-hover, and fade-in over `<pre>` on hover.

---

### Task 4: `.sc-summary` / `.sc-chev` — unify the disclosure idiom

**Files:**

- Modify: `src/components/Solution.astro`
- Modify: `src/components/Hint.astro`
- Modify: `src/components/Derivation.astro`
- Modify: `src/components/SelfCheck.astro` (chevron only)

- [ ] **Step 1: Solution.astro**

Markup: `<summary>` → `<summary class="sc-summary">`; the chevron span `class="solution-chev"` → `class="solution-chev sc-chev"`.

Delete these scoped rules (now provided by the primitive): `.solution > summary`, `.solution > summary:hover`, `.solution > summary::-webkit-details-marker`, `.solution[open] > summary`, `.solution-chev`, `.solution[open] .solution-chev`. Keep `.solution` (container), `.solution-body`, and `.solution-body > :global(:last-child)`. The container still sets `margin-top`, `background`, `box-shadow`, `overflow` — those move to `.sc-panel` in Task 8; leave them for now.

- [ ] **Step 2: Hint.astro**

Markup: `<summary>` → `<summary class="sc-summary">`; chevron span `class="hint-chev"` → `class="hint-chev sc-chev"`.

Delete: `.hint > summary`, `.hint > summary:hover`, `.hint > summary::-webkit-details-marker`, `.hint[open] > summary`, `.hint-chev`, `.hint[open] .hint-chev`. **Keep** the solution-rung overrides: `.hint-solution > summary { color: var(--tip); }`, `.hint-solution[open] { background: var(--answer-bg); }`, `.hint-solution[open] > summary { border-bottom-color: var(--border); }` — these are scoped (higher specificity) so they still layer over `.sc-summary`. Keep `.hint`, `.hint-num`, `.hint-auto::before`, `.hint-body`.

- [ ] **Step 3: Derivation.astro**

Markup: `<summary>` → `<summary class="sc-summary">`; chevron span `class="derivation-chevron"` → `class="derivation-chevron sc-chev"`.

Delete the **bare** `summary`, `summary::-webkit-details-marker`, `summary:hover` rules (this conforms drift DS-3 — the unclassed selector), plus `.derivation[open] > summary`, `.derivation-chevron`, `.derivation[open] .derivation-chevron`. Keep `.derivation` (container), `.derivation-body`, `.derivation-body :global(> :last-child)`.

- [ ] **Step 4: SelfCheck.astro — chevron only (keep its inline reveal)**

Per drift DS-4, SelfCheck's `<summary>` stays local (inline, underline hover, no divider). Only share the chevron: chevron span `class="selfcheck-chev"` → `class="selfcheck-chev sc-chev"`, and delete the scoped `.selfcheck-chev { display:inline-flex; transition:transform … }` and `.selfcheck-a[open] .selfcheck-chev { transform: rotate(90deg); }` rules — both are now provided by `.sc-chev` + `details[open] > summary .sc-chev`. Leave the `summary`, `summary:hover` (underline), `summary::-webkit-details-marker` rules in place.

- [ ] **Step 5: Verify build + grep**

Run: `grep -rn "webkit-details-marker" src/components/`
Expected: only `SelfCheck.astro` (its local summary) — the three panel disclosures now rely on `.sc-summary`.

Run: `pnpm build`
Expected: clean. In preview, open/close each disclosure: chevron rotates 90°, `[open]` shows the divider (Solution/Hint/Derivation), Hint's "Løsning" rung stays green-tinted, SelfCheck reveal still underlines on hover with no summary divider.

---

### Task 5: `.sc-icon-btn` — unify the square chrome controls

**Files:**

- Modify: `src/components/ThemeToggle.astro`
- Modify: `src/components/SearchPalette.astro`

- [ ] **Step 1: ThemeToggle.astro**

Markup: `class="theme-toggle sc-press"` → `class="theme-toggle sc-icon-btn sc-press"`.

In the scoped style, delete from `.theme-toggle` the declarations now owned by `.sc-icon-btn`: `display`, `place-items`, `border`, `border-radius`, `background`, `color`, `transition`. **Keep** the size (`width: var(--control-h); height: var(--control-h);`). Delete the `.theme-toggle:hover` rule entirely (identical to `.sc-icon-btn:hover`: color `--fg`, bg `--card-hover`, border `--border-strong`). Keep all the `:global(.icon…)` show/hide rules.

Resulting `.theme-toggle` scoped rule:

```css
.theme-toggle {
  width: var(--control-h);
  height: var(--control-h);
}
```

- [ ] **Step 2: SearchPalette.astro — the `.search-trigger` only**

Markup: `.search-trigger` element `class="search-trigger sc-press"` → `class="search-trigger sc-icon-btn sc-press"`.

Delete from `.search-trigger` the declarations owned by `.sc-icon-btn` (`display`, `place-items`/`align-items`, `border`, `border-radius`, `background`, `color`, `transition`) and delete `.search-trigger:hover` if it matches the neutral chrome hover (color `--fg`, bg `--card-hover`, border `--border-strong`). **Keep** any trigger-specific declarations: `width`/`height` (`var(--control-h)`), and — if the trigger is a wider labelled control rather than a square — keep its `gap`, `padding`, and inner label/kbd styles. If the trigger's hover differs from the neutral chrome hover, keep its local `:hover` instead of deleting it (do not change its appearance).

> Note: `.search-esc` is NOT converted (drift IB-4 — it's a keycap on `--radius-xs`/`--card`, not an icon button). It keeps `sc-press` from Task 2 and its own styling.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: clean. Theme toggle and search trigger look and hover identically to before (neutral shift to `--fg`/`--card-hover`/`--border-strong`).

---

### Task 6: `.sc-kicker` — unify the mono uppercase label recipe

Apply `.sc-kicker` (font-family mono, uppercase, `--tracking`, semibold) and delete those four declarations from each caller, keeping size, tone colour, and any layout.

**Files & exact edits:**

- Modify `src/components/PanelHeader.astro`: `<span class="panel-kicker">` → `class="panel-kicker sc-kicker"`; delete from `.panel-kicker` the `font-family`, `text-transform`, `letter-spacing`, `font-weight`. Keep `display:inline-flex`, `align-items`, `gap:6px`, `flex:none`, `align-self:center`, `font-size:var(--text-sm)`, `color:var(--accent)`.
- Modify `src/components/Answer.astro`: `<span class="answer-label">` → `class="answer-label sc-kicker"`; delete `font-family`, `text-transform`, `letter-spacing`, `font-weight` from `.answer-label`. Keep `flex:none`, `font-size:var(--text-xs)`, `color:var(--tip)`.
- Modify `src/components/Statement.astro`: `<span class="statement-badge">` → `class="statement-badge sc-kicker"`; delete `font-family`, `text-transform`, `letter-spacing`, `font-weight` from `.statement-badge`. Keep `display:inline-flex`, `align-items`, `gap:6px`, `flex:none`, `align-self:center`, `font-size:var(--text-sm)`, `color:var(--accent)`.
- Modify `src/components/MemorizeBadge.astro`: `<span class="memorize-badge …">` → add `sc-kicker`; delete `font-family`, `text-transform`, `letter-spacing`, `font-weight` from `.memorize-badge`. Keep `flex:none`, `display:inline-flex`, `align-items`, `font-size:var(--text-xs)`, `color:var(--warning)`, `background:var(--warning-bg)`, `border-radius:var(--radius-xs)`, `padding`, `white-space`.
- Modify `src/components/ExamSummary.astro`: for each mono-uppercase label element (e.g. `.exam-when-label`, `.exam-fact dt`), add `sc-kicker` to the element's class and delete the four recipe declarations; keep its `font-size` and `color`. (Open the file; apply to every element that currently sets `text-transform: uppercase` + `font-family: var(--font-mono)`.)
- Modify `src/components/Flashcards.astro`: the `.fc-section` label (mono uppercase `--text-xs`) — add `sc-kicker`, delete the four recipe declarations, keep `font-size`/`color`.

- [ ] **Step 1: Apply the edits above.**

- [ ] **Step 2: Confirm the recipe is centralised**

Run: `grep -rln "text-transform: uppercase" src/components/`
Expected: any remaining hits are elements that legitimately still declare `text-transform` for a non-kicker reason; the mono kickers above no longer set the recipe locally. (Spot-check that each converted element now carries `sc-kicker`.)

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: clean. Kickers/badges render at the same size, colour, spacing, and weight as before (uppercase mono).

---

### Task 7: `.sc-chip` — unify the pill chip frame

**Files:**

- Modify: `src/components/Flashcards.astro` (`.fc-chip`)
- Modify: `src/components/FormulaSheet.astro` (`.fs-chip`)

- [ ] **Step 1: Flashcards.astro**

`.fc-chip` element(s) `class="fc-chip sc-press"` → `class="fc-chip sc-press sc-chip"`. Delete from `.fc-chip` the declarations owned by `.sc-chip`: `border`, `border-radius`, `font-family`, `color`, and the `transition` (the primitive's transition covers color/background/border). **Keep** `padding: 3px var(--space-3)`, `font-size: var(--text-xs)`, `background: var(--bg-elevated)`, and any `.fc-chip:hover` / active-state rules.

- [ ] **Step 2: FormulaSheet.astro**

`.fs-chip` element(s) `class="fs-chip sc-press"` → `class="fs-chip sc-press sc-chip"`. Delete from `.fs-chip` the `border`, `border-radius`, `font-family`, `color`. **Keep** `display:inline-flex`, `align-items`, `gap:0.4em`, `font-size:var(--text-sm)`, `padding:0.4em 0.95em`. Change `background: var(--card)` → `background: var(--bg-elevated)` (drift CH-1 conform — identical colour, one token for float surfaces). Keep any `.fs-chip:hover`/selected-state rules.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: clean. Chips render at their existing sizes; borders/radius/type unchanged; hover/selected states intact.

---

### Task 8: `.sc-panel` — unify the floating-card recipe

Apply `.sc-panel` to the floating content cards and delete the redundant `background` / `box-shadow` / `border-radius` declarations, keeping padding, overflow, margins, and (for small reveals) the `--radius-sm` override.

**Files & edits (add `sc-panel` to the container element's class; the container class stays for the nesting rules):**

- `src/components/Example.astro` (`.example`): delete `background: var(--bg-elevated)`, `box-shadow: var(--shadow-sm)`, `border-radius: var(--radius)`. Keep padding/overflow/margins.
- `src/components/CompareCol.astro` (`.compare-col`): same three deletions; keep the rest.
- `src/components/Simulation.astro` (`.simulation`): same three deletions; keep the rest (incl. `overflow: hidden`).
- `src/components/Stepper.astro` (`.stepper`): same three deletions; keep the rest.
- `src/components/Flashcards.astro` (the deck card that has `border-radius: var(--radius); background: var(--bg-elevated)` + `--shadow-sm`): delete those three; keep padding/min-height.
- `src/components/Quiz.astro` (`.quiz`): delete `border-radius: var(--radius)` and `box-shadow: var(--shadow-sm)`; change `background: var(--card)` → remove it (now from `.sc-panel` = `--bg-elevated`). Drift PC-1 conform (identical colour). Keep `padding: var(--space-4)`.
- `src/components/SelfCheck.astro` (`.selfcheck`): delete `border-radius`, `box-shadow`; remove `background: var(--card)` (→ `.sc-panel`'s `--bg-elevated`). Keep `padding`, `margin-block`.
- `src/components/Solution.astro` (`.solution`): delete `background: var(--bg-elevated)` and `box-shadow: var(--shadow-sm)`. **Keep** `border-radius: var(--radius-sm)` as a local override (drift PC-2), plus `margin-top`, `overflow: hidden`.
- `src/components/Hint.astro` (`.hint`): delete `background`, `box-shadow`. **Keep** `border-radius: var(--radius-sm)`, `overflow: hidden`.
- `src/components/Derivation.astro` (`.derivation`): delete `background`, `box-shadow`, `border-radius` (it uses `--radius`, matches `.sc-panel` default). Keep `margin-block`, `overflow: hidden`.

**Do NOT convert (drift PC-3/PC-4 exclusions):** FormulaSheet list frame, Glossary list frame (technical frames, keep `--border`), Figure frame (`--canvas-bg`). Leave them untouched.

- [ ] **Step 1: Apply the edits above.**

- [ ] **Step 2: Verify nesting still works**

Run: `pnpm build`
Expected: clean. In preview, check a nested case (`<Example>` → `<Solution>` → `<Formula>`): top-level card floats (`--shadow-sm`); nested cards recess to `--card-nested` with no shadow; a formula two-deep alternates back to `--bg-elevated`. The `base.css` `!important` rules still fire because each container class is preserved.

---

### Task 9: `.sc-tile` — unify the tile-lift

**Files:**

- Modify: `src/styles/shell.css` (`.module-tile`, `.page-link`)
- Modify: `src/pages/index.astro` (module-tile markup — add class)
- Modify: `src/pages/[slug].astro` (page-link markup — add class)

- [ ] **Step 1: Add `sc-tile` in markup**

In `index.astro`, each `.module-tile` anchor already gained `sc-press` (Task 2) → add `sc-tile`: `class="module-tile sc-press sc-tile …"`. In `[slug].astro`, each `.page-link` anchor → add `sc-tile` alongside `sc-press`.

- [ ] **Step 2: Slim the shell.css rules**

From `.module-tile` delete: `border-radius`, `background`, `box-shadow`, `transition` (now from `.sc-tile`). Keep `position`, `display:block`, `text-decoration`, `color`, `padding`. Delete `.module-tile:hover` (identical to `.sc-tile:hover`: `box-shadow: var(--shadow)`, `background: var(--card)`).

From `.page-link` delete: `border-radius`, `background`, `box-shadow`, `transition`. Keep `display:inline-flex`, `align-items`, `justify-content`, `gap`, `min-height`, `text-decoration`, `color`, `padding`, `font-family`, `font-size`, `cursor`. Delete `.page-link:hover` (identical to `.sc-tile:hover`).

> `nav-link` is intentionally left as-is (drift TL-2 — flat at rest); it already has `sc-press` from Task 2. Do not give it `sc-tile`.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: clean. Overview tiles and the prev/next pager rest on `--shadow-sm` and lift to `--shadow` (bg → `--card`) on hover, exactly as before.

---

### Task 10: Full verification + cleanup

**Files:**

- Review: all files touched; `src/styles/primitives.css`
- Regenerate: `visual/*-snapshots/`

- [ ] **Step 1: Dead-comment / dead-code sweep**

Run: `grep -rn "Shared tactile press" src/`
Expected: no matches (all such comments were removed with their rules; the concept now lives once in `primitives.css`).

Review each touched component for orphaned comments that describe deleted rules (per the `no-dead-code-in-comments` convention) and delete them.

- [ ] **Step 2: Typecheck + build**

Run: `pnpm typecheck`
Expected: passes (CSS/markup changes don't affect types).

Run: `pnpm build`
Expected: clean build, cross-refs validate.

- [ ] **Step 3: Regenerate + eyeball visual baselines**

First ensure no stale preview holds port 4321 (see the `visual-baseline-stale-preview-server` caveat): `pkill -f "astro preview" || true` (or free `:4321`).

Run: `pnpm test:visual:update`
Then inspect a regenerated screenshot per route × theme under `visual/*-snapshots/`. Diffs vs. the prior baseline must be **nil** — the only permitted changes are the inert conforms (all of which resolve to identical colours/positions). If any visible diff appears, stop and reconcile against the drift table before continuing.

- [ ] **Step 4: Manual two-theme spot-check (preview)**

Run: `pnpm preview` and verify in both themes: copy buttons (hover/copied), all disclosures (open/closed, Hint green rung, SelfCheck underline reveal), tiles + pager + nav hover/press, chips, kickers, theme toggle, search trigger. (Do not leave the preview server running afterward — this is a one-shot check.)

- [ ] **Step 5: Report for local verification**

Summarise the diff (files touched, lines removed vs. added, primitives added) and hand off to the user for their local verification. Do NOT commit.

---

## Self-Review

**Spec coverage:** Every primitive in the spec's primitive-set table maps to a task — `.sc-press` (T2), `.sc-copy` (T3), `.sc-summary`/`.sc-chev` (T4), `.sc-icon-btn` (T5), `.sc-kicker` (T6), `.sc-chip` (T7), `.sc-panel` (T8), `.sc-tile` (T9). Every drift-table row is realised: IB-1/IB-2 kept as variants (T5), IB-3 conform (T1 `.sc-copy`/`.sc-icon-btn` use `inline-grid`), IB-4 `search-esc` excluded (T5 note), CP-1/CP-2 (T3), DS-1/DS-2 kept (T4/T8), DS-3 conform (T4 Derivation), DS-4 SelfCheck kept (T4), DS-5 Hint rung kept (T4), PC-1 conform (T8 Quiz/SelfCheck), PC-2 kept (T8 Solution/Hint), PC-3/PC-4 excluded (T8 note), TL-1 (T9), TL-2 nav-link kept (T9 note), CH-1 (T7), KK-1 (T6), PR-1 (T2).

**Placeholder scan:** No TBD/TODO. The only "open the file and apply to every matching element" instructions (ExamSummary kickers in T6) name the exact predicate (elements with `text-transform: uppercase` + `font-family: var(--font-mono)`) and the exact four declarations to delete — deterministic, not a placeholder.

**Type/name consistency:** Class names are consistent across tasks (`sc-press`, `sc-icon-btn`, `sc-copy`, `sc-summary`, `sc-chev`, `sc-chip`, `sc-kicker`, `sc-panel`, `sc-tile`). The copy button carries `code-copy sc-copy sc-press` / `fs-copy sc-copy sc-press`; disclosures carry `sc-summary` + `sc-chev`; container classes are preserved for the base.css nesting rules.
