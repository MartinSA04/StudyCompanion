# Paper + Marginalia Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove 1px borders from every interactive control: stateful controls become borderless paper fills (nested-aware), navigational/utility controls become bare marginalia with an ink-wash hover.

**Architecture:** All control surfaces live in the `.sc-*` primitives layer (`src/styles/primitives.css`) plus a handful of component-local recipes. Task 1 rewrites the primitives (which instantly restyles most callers); later tasks migrate the component-local recipes and prune now-dead border declarations. Spec: `docs/superpowers/specs/2026-07-12-paper-marginalia-controls-design.md`.

**Already conforming — no code change (do not hunt for these):** quiz options (`.quiz-option` is borderless `--card-nested` fill with an accent-wash hover; only its comment changes, Task 6) and the search-palette input (frameless inside the dialog; the `.search-box` border-bottom is a structural divider and stays).

**Tech Stack:** Astro 6 components with scoped `<style>`, plain CSS custom properties, Playwright visual snapshots (`pnpm test:visual`).

## Global Constraints

- **The rule:** state sits on paper (`background: var(--control-fill, var(--bg-elevated))`, hover darkens one step); navigation sits in the margin (transparent rest, hover `background: var(--wash)`). Hover text is `var(--accent-ink)` in both families.
- **Borders never mark interactivity.** Two frames survive by exception: the `.sc-kbd` keycap and the `.quiz-mark` radio ring (form glyphs, not control frames). Structural hairlines (dividers, tables, `.sim-canvas` frame, dashed `.fc-empty`) are untouched.
- **Unchanged states:** press dip (`.sc-press`), focus (`2px solid var(--accent)` offset 2px), chip selected (solid accent fill), done (accent-soft fill), completion colors, all motion tokens.
- **No markup changes beyond class composition.** No schema change, no MIGRATIONS entry. JS hooks are `data-*` attributes — verified safe to retouch classes.
- **Transition shorthand discipline:** primitives.css and `.sc-press` are equal specificity; every rule that sets `transition` on a pressable element must repeat `transform var(--dur-fast) var(--ease)` in its list (existing house pattern — keep it).
- **Effective hit areas stay ≥38px** via invisible `::after` overhangs; border removal shrinks visual boxes by 2px, so overhangs grow to compensate (exact insets given per task).
- **Verification model:** CSS-only change; the repo's test harness for visual language is the Playwright snapshot suite. Intermediate tasks gate on `pnpm build` (runs the contrast guardrail); snapshots regenerate ONCE in Task 7 with a mandatory human-readable diff review — every changed pixel region must be a control surface. Do not run `pnpm test:visual` mid-plan; it is expected red until Task 7.
- Run all commands from `/workspaces/study_companion`; node lives at `~/.local/share/mise/installs/node/22/bin` if `node`/`pnpm` are not on PATH (use `mise exec -- pnpm …`).

---

### Task 1: Tokens + primitives — the two new recipes

**Files:**

- Modify: `src/styles/tokens.css` (add `--wash` to `:root`)
- Modify: `src/styles/primitives.css` (`.sc-icon-btn`, `.sc-copy`, `.sc-pill`, `.sc-chip`, `.sc-summary`; add `.sc-btn`, `.sc-field`)

**Interfaces:**

- Produces: `--wash` token; marginalia recipes on `.sc-icon-btn`/`.sc-copy`/`.sc-pill`; paper recipe on `.sc-chip`; new `.sc-btn` (paper labelled button — surface/shape/type only, size + text color stay the caller's) and `.sc-field` (paper field wrapper with `:focus-within` accent ring). `--control-fill` read with fallback `var(--bg-elevated)` by `.sc-chip`/`.sc-btn`/`.sc-field`; panels that host paper controls may set it to `var(--card-nested)` (Task 4 uses this for sim controls).

- [ ] **Step 1: Add the `--wash` token**

In `src/styles/tokens.css`, directly under the `--selection` line in `:root`, add:

```css
  /* Faint ink wash — the marginalia hover fill (disclosure summaries, icon
     buttons, copy buttons, bare pills). Derived from --fg, so it resolves per
     theme; no dark-block override needed. */
  --wash: color-mix(in srgb, var(--fg) 6%, transparent);
```

(Only `:root` — the dark block inherits the `--fg`-derived mix.)

- [ ] **Step 2: Rewrite the icon/copy shared box to marginalia**

In `src/styles/primitives.css`, replace the `.sc-icon-btn, .sc-copy` block and its hover (keep the intro comment position, rewrite its text):

```css
/* --- Square icon control + copy button (one shared marginalia box) ---
   The theme toggle, menu/close buttons and the copy buttons are navigational/
   utility controls: bare glyph at rest, ink wash + accent-ink on hover (the
   marginalia recipe — state sits on paper, navigation sits in the margin).
   Size is the caller's (--control-h topbar chrome, 32px copy). */
.sc-icon-btn,
.sc-copy {
  display: inline-grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
}
.sc-icon-btn {
  /* Carries the SAME transform sub-transition as .sc-press (below): this rule
     and .sc-press are equal specificity, so whichever is later in the file
     wins the whole `transition` shorthand outright — matching the value here
     keeps the press dip eased either way. */
  transition:
    color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}
.sc-icon-btn:hover,
.sc-copy:hover {
  color: var(--accent-ink);
  background: var(--wash);
}
```

In the `.sc-copy[data-copied="true"]` block, delete the `border-color: var(--tip);` line (keep `color: var(--tip);`). Everything else in the copy section (sizes, `::after` overhang, icon cross-fade) is unchanged.

- [ ] **Step 3: Rewrite `.sc-pill` to marginalia**

Replace the `.sc-pill` block + hover (rewrite the leading comment too):

```css
/* --- Labelled marginalia pill (search trigger, hero "continue", 404 links) ---
   The LABELLED form of the marginalia recipe: bare mono text at rest, ink wash
   + accent-ink on hover. Callers add their own size/padding. Stateful labelled
   controls (done button, flashcard rating) use .sc-btn instead. */
.sc-pill {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  /* Same transform sub-transition as .sc-press (equal-specificity, later rule
     wins the whole shorthand) — see the comment on .sc-icon-btn. */
  transition:
    color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}
.sc-pill:hover {
  background: var(--wash);
  color: var(--accent-ink);
}
```

- [ ] **Step 4: Rewrite `.sc-chip` to paper**

In the `.sc-chip` block: replace `border: 1px solid var(--border-strong);` with `border: 0;`, replace `background: var(--bg-elevated);` with `background: var(--control-fill, var(--bg-elevated));`, and in its `transition` list drop the `border-color` line. Rewrite the section comment:

```css
/* --- Pill chip (filter toggles, formula tags) ---
   A COMPLETE paper chip: borderless fill one paper step off its ground
   (--control-fill lets a hosting panel step it to --card-nested), compact mono
   type, fill-darken + accent-ink hover, solid accent selected fill. Selected is
   either an `.active` class or `aria-pressed="true"`. */
```

Replace the hover block:

```css
.sc-chip:hover {
  color: var(--accent-ink);
  background: var(--card-hover);
}
```

The `.sc-chip.active, .sc-chip[aria-pressed="true"]` block keeps `background`/`color` but delete its `border-color: var(--accent);` line. Update the hit-area pseudo: the chip loses 2px of border height (~29px visual), so change `inset: -4px -2px;` to `inset: -5px -2px;` and update the comment's arithmetic to `(~29 + 2*5 = 39px)`.

- [ ] **Step 5: Add `.sc-btn` and `.sc-field`**

Insert after the `.sc-chip` section:

```css
/* --- Paper labelled button (done button, flashcard rating) ---
   Stateful labelled controls keep a surface: borderless paper fill (nested-
   aware via --control-fill), mono medium type, fill-darken + accent-ink hover.
   Size, padding and resting text colour stay the caller's. */
.sc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--control-fill, var(--bg-elevated));
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  /* Same transform sub-transition as .sc-press — see .sc-icon-btn. */
  transition:
    color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}
.sc-btn:hover {
  background: var(--card-hover);
  color: var(--accent-ink);
}

/* --- Paper search field (formula sheet, glossary) ---
   A field is stateful (you type into it): paper fill, no frame. Focus is the
   site's 2px accent ring on the wrapper — :focus-within, because a field is
   "active" for pointer and keyboard alike (the accent border it replaces
   answered both, too). */
.sc-field {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--control-fill, var(--bg-elevated));
  border-radius: var(--radius);
  padding: 9px 14px;
  color: var(--muted);
}
.sc-field:focus-within {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  color: var(--accent-ink);
}
```

- [ ] **Step 6: `.sc-summary` hover uses the token**

Replace `background: color-mix(in srgb, var(--fg) 6%, transparent);` in `.sc-summary:hover` with `background: var(--wash);` and shorten its preceding comment's last sentence to “…a faint ink overlay (--wash) darkens it on any surface.”

Also update the file-header comment paragraph that says every bordered interactive control lights up in accent: reword to the new vocabulary (paper = fill-darken, marginalia = ink wash; accent-ink text is the constant).

- [ ] **Step 7: Build**

Run: `pnpm build`
Expected: exits 0 (contrast guardrail included). The demo site now shows borderless chips/pills/icon-buttons sitewide; some callers still carry dead `border-color` transitions — pruned in Tasks 2–5.

- [ ] **Step 8: Commit**

```bash
git add src/styles/tokens.css src/styles/primitives.css
git commit -m "feat: paper + marginalia control primitives (borders retired)"
```

---

### Task 2: Flashcards — rating to paper, arrows to marginalia

**Files:**

- Modify: `src/components/Flashcards.astro` (markup lines ~150–170; styles `.fc-reset`, `.fc-btn`, `.fc-nav`, `.fc-btn:hover`)

**Interfaces:**

- Consumes: `.sc-btn`, `.sc-icon-btn`, `--wash` from Task 1. JS unaffected (hooks are `data-fc-*`).

- [ ] **Step 1: Recompose the deck buttons' classes**

In the controls markup: the two nav buttons change `class="fc-btn fc-nav sc-press"` → `class="fc-nav sc-press sc-icon-btn"` (both the `data-fc-prev` and `data-fc-next` ones). The two rating buttons change `class="fc-btn fc-review sc-press"` → `class="fc-btn fc-review sc-press sc-btn"` and `class="fc-btn fc-known sc-press"` → `class="fc-btn fc-known sc-press sc-btn"`.

- [ ] **Step 2: Prune the local frame CSS**

Replace the `.fc-btn`, `.fc-nav` and `.fc-btn:hover` blocks (and the “All deck control buttons light up…” comment) with:

```css
  /* Frame, type and fill-darken hover come from the shared .sc-btn (rating) /
     .sc-icon-btn (nav arrows); only sizing is local. Rating labels keep the
     page ink — they are the deck's primary actions. */
  .fc-btn {
    min-height: var(--control-h);
    padding: var(--space-2) var(--space-4);
    color: var(--fg);
  }
  .fc-nav {
    min-height: var(--control-h);
    padding: var(--space-2) var(--space-4);
  }
```

(Old `.fc-btn` carried `border`, `background`, font styles and a `transition` — all now from `.sc-btn`. Old `.fc-nav` display/color come from `.sc-icon-btn`. `.sc-btn:hover`'s `color: var(--accent-ink)` (0-2-0) still beats the local `color: var(--fg)` (0-1-0).)

- [ ] **Step 3: Align `.fc-reset` to the marginalia recipe**

Replace the `.fc-reset` + `.fc-reset:hover` blocks:

```css
  /* Marginalia: bare mono text; hover paints the ink wash. Padding is carved
     from negative margin so the wash has a shape without moving the label. */
  .fc-reset {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--muted);
    background: none;
    border: 0;
    padding: 0.2em 0.5em;
    margin: -0.2em -0.5em;
    border-radius: var(--radius-xs);
    transition:
      color var(--dur-fast) var(--ease),
      background-color var(--dur-fast) var(--ease),
      transform var(--dur-fast) var(--ease);
  }
  .fc-reset:hover {
    color: var(--accent-ink);
    background: var(--wash);
  }
```

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/Flashcards.astro
git commit -m "feat: flashcard rating on paper, deck arrows in the margin"
```

---

### Task 3: Formula sheet + glossary fields; formula copy transition

**Files:**

- Modify: `src/components/FormulaSheet.astro` (`.fs-search` markup + styles, `.fs-copy` transition)
- Modify: `src/components/Glossary.astro` (`.gloss-search` markup + styles)

**Interfaces:**

- Consumes: `.sc-field` from Task 1.

- [ ] **Step 1: FormulaSheet search → `.sc-field`**

Markup: the search wrapper `<div class="fs-search">` (or `<label class="fs-search">` — match whatever element carries the class) becomes `class="fs-search sc-field"`. Styles: replace the `.fs-search` + `.fs-search:focus-within` blocks with only the layout that `.sc-field` doesn't own:

```css
  /* Fill, frame-less field + focus ring come from the shared .sc-field. */
  .fs-search {
    flex: 1;
    min-width: 220px;
  }
```

(Deleted lines: display/align-items/gap/background/border/border-radius/padding/color/transition and the whole `:focus-within` block. Note the old fill was `var(--card)` — identical value to `--bg-elevated`, so no visual delta.) Keep all `.fs-search-input` rules.

- [ ] **Step 2: `.fs-copy` transition swap**

In `.fs-copy`'s `transition` list, replace the `border-color var(--dur-fast) var(--ease),` line with `background-color var(--dur-fast) var(--ease),` and update its comment to “Box, wash hover and icon-swap come from the shared .sc-copy / .sc-press primitives…”.

- [ ] **Step 3: Glossary search → `.sc-field`**

Markup: the wrapper carrying `gloss-search` gains `sc-field`. Styles: replace `.gloss-search` + `.gloss-search:focus-within` with:

```css
  /* Fill, frame-less field + focus ring come from the shared .sc-field. */
```

(delete both blocks entirely — Glossary has no extra layout of its own; keep the `.gloss-search-input` rules).

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/FormulaSheet.astro src/components/Glossary.astro
git commit -m "feat: search fields become borderless paper (.sc-field)"
```

---

### Task 4: Shell + done button + search Esc + simulation buttons

**Files:**

- Modify: `src/pages/[slug].astro` (done-btn class)
- Modify: `src/styles/shell.css` (`.done-btn`, `.done-btn.done`, comments)
- Modify: `src/components/SearchPalette.astro` (`.search-esc` hover, comments)
- Modify: `src/components/Simulation.astro` (`.sim-btn`, `--control-fill`)
- Modify: `src/pages/404.astro` (comment only)

**Interfaces:**

- Consumes: `.sc-btn`, `--wash`, `--control-fill` contract from Task 1.

- [ ] **Step 1: Done button becomes paper**

`src/pages/[slug].astro`: change `class="done-btn sc-pill sc-press"` → `class="done-btn sc-btn sc-press"`.

`src/styles/shell.css` `.done-btn`: delete the whole local `transition:` declaration (`.sc-btn` owns it, same transform sub-transition) and add `color: var(--muted);` (previously inherited from `.sc-pill`). Update the preceding comment to “Surface + fill-darken hover from the shared .sc-btn; local: size, muted resting label, and the --accent-soft "done" state below.” In `.done-btn.done`, delete the `border-color: transparent;` line.

- [ ] **Step 2: Search Esc keycap hover**

`src/components/SearchPalette.astro` `.search-esc`: in its `transition` list replace `border-color …` with `background-color var(--dur-fast) var(--ease),`; replace the hover block:

```css
  .search-esc:hover {
    color: var(--accent-ink);
    background: var(--wash);
  }
```

Update its comment: the keycap FRAME stays (a keycap is a bordered glyph, not a control — the sanctioned exception); only the hover becomes the ink wash. Also refresh the `.search-trigger` comment's first line to “Marginalia surface + wash hover come from the shared .sc-pill primitive; only the control height + inline padding are local.”

- [ ] **Step 3: Simulation buttons become paper (nested)**

`src/components/Simulation.astro`: on `.sim-controls`, add the host contract:

```css
  .sim-controls {
    /* Paper controls hosted on this panel step to the nested fill. */
    --control-fill: var(--card-nested);
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4) var(--space-6);
    align-items: flex-end;
    padding: var(--space-4);
  }
```

Replace `.sim-btn`'s frame + hover:

```css
  .sim-controls :global(.sim-btn) {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    padding: 0.3em 0.7em;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--control-fill, var(--bg-elevated));
    color: var(--muted);
    transition:
      background-color var(--dur-fast) var(--ease),
      color var(--dur-fast) var(--ease);
  }
  /* --card-hover equals the resting nested fill, so hover is an ink wash over
     it (same construction as the quiz options' accent wash). */
  .sim-controls :global(.sim-btn:hover:not(:disabled)) {
    background: color-mix(in srgb, var(--fg) 6%, var(--card-nested));
    color: var(--accent-ink);
  }
```

(The sim-btn press transition further down keeps its own `transform` handling — leave it.)

- [ ] **Step 4: Comment sweep**

Update the stale “Box/Frame + accent hover” comments to the new wording (“wash hover” for marginalia callers): `shell.css` above `.menu-toggle`, above `.hero-continue`, above `.sidebar-close`; `src/pages/404.astro` above `.nf-home`. No declaration changes in these blocks.

- [ ] **Step 5: Build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/[slug].astro src/pages/404.astro src/styles/shell.css src/components/SearchPalette.astro src/components/Simulation.astro
git commit -m "feat: done/sim buttons on paper; Esc + shell chrome in the margin"
```

---

### Task 5: Code-block copy button — marginalia on the fixed slab

**Files:**

- Modify: `src/styles/base.css` (`.code-copy` block + hover + copied state)

**Interfaces:**

- Consumes: `.sc-copy` marginalia recipe from Task 1. The slab is the one fixed near-black surface (both themes), so every color here stays a calibrated LITERAL, and `!important` still guards against primitives.css loading later.

- [ ] **Step 1: Rewrite the calibrated block**

Replace the `.code-copy` declarations `background: #282726 !important;` and `border-color: #878580 !important;` (and their comments) with nothing — the resting box is now the primitive's transparent. Keep `position/top/right`, keep `color: #878580 !important;` (rewrite its comment: the GLYPH is the whole control now; base-500 is the calibrated resting tone on the slab, 4.7:1 on #1c1b1a), keep `opacity: 0;` and the `!important` transition — but inside that transition list replace `border-color var(--dur-fast) var(--ease),` with `background-color var(--dur-fast) var(--ease),`.

Replace the hover block:

```css
/* The shared wash hover derives from the themed --fg — in light mode that is
   the dark ink, invisible on this fixed dark slab. Use the slab's own warm
   ink literal for the wash, and lighten the accent toward white for the glyph
   (≥6:1 across the Flexoki accent set in both page themes). */
.code-copy:hover {
  color: color-mix(in srgb, var(--accent) 55%, white) !important;
  background: color-mix(in srgb, #cecdc3 12%, transparent) !important;
}
```

In `.code-copy[data-copied="true"]`, delete the `border-color: #cdd597 !important;` line (keep the color line and its comment).

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/styles/base.css
git commit -m "feat: code copy button as bare marginalia glyph on the slab"
```

---

### Task 6: DESIGN.md + Quiz comment — document the new contract

**Files:**

- Modify: `DESIGN.md` (frontmatter `components.icon-button`; §1 hover phrasing; §2 Named Rules + the Line/Line Strong bullet; §5 Buttons/Chips/Inputs; §6 Do's & Don'ts)
- Modify: `src/components/Quiz.astro` (one comment)

- [ ] **Step 1: Frontmatter**

`components.icon-button`: delete the `backgroundColor` line (keep textColor/rounded/size).

- [ ] **Step 2: §1 Overview**

In the north-star paragraph, replace “(accent on hover, a 1px dip on press, a 1px lift on hover)” with “(a surface answer on hover — paper fills darken a step, marginalia takes an ink wash — text lighting to accent-ink, a 1px dip on press, a 1px lift on hover)”.

- [ ] **Step 3: §2 Colors**

In the Neutral list, replace the sentence “**Line** … for panel hairlines; **Line Strong** … for control borders. Panels=line, controls=line-strong is a contract.” with “**Line** (#dad8ce) / **Line Strong** (#cecdc3): structural hairlines only (dividers, table rules, keycaps, the quiz radio ring); no interactive control carries a border.”

Replace the **Two-Border Rule** entry under Named Rules with:

```markdown
**The Structural-Border Rule.** Borders never mark interactivity. Hairlines
are for structure (dividers, tables, canvas frames) and for two sanctioned
form glyphs: the keycap (--border) and the quiz radio ring (--border-strong).
An interactive control is surface-or-nothing.

**The Paper/Marginalia Rule.** State sits on paper; navigation sits in the
margin. A control you toggle, select, complete or type into keeps a
borderless paper fill (var(--control-fill, var(--bg-elevated)); hosting
panels set --control-fill to the nested tone). A control that acts instantly
or navigates is bare mono type/glyph with an ink-wash hover (--wash). Hover
text is --accent-ink in both families.
```

- [ ] **Step 4: §5 Components**

Replace the **Buttons** subsection body with:

```markdown
- **Shape:** small radius (6px); square icon buttons at 38px (--control-h).
- **Paper (stateful — .sc-btn, .sc-chip, .sc-field):** borderless panel fill
  one paper step off the ground, mono label; hover darkens the fill one step
  (--card-hover; a 6% ink wash over nested fills) and lights text to
  --accent-ink.
- **Marginalia (navigational — .sc-pill, .sc-icon-btn, .sc-copy):** bare mono
  label / bare glyph in dim ink; hover paints --wash and lights text to
  --accent-ink.
- **Focus:** 2px accent outline offset 2px. Press dips 1px (.sc-press).
```

In **Chips (.sc-chip)**, replace “pill radius, --border-strong frame, panel fill, mono xs text” with “pill radius, borderless paper fill, mono xs text” and “hover lights accent border+text” with “hover darkens the fill + accent-ink text”.

In **Inputs / Fields**, replace the first bullet with “quiz options and search fields are paper: borderless fills one step off their ground (quiz options recess to --card-nested; search fields are .sc-field on the page ground). The quiz radio ring keeps the one sanctioned --border-strong form glyph.”

- [ ] **Step 5: §6 Do's & Don'ts**

Do-bullet “full state set”: replace “hover (accent light-up)” with “hover (surface answer + accent-ink text)”. Replace the Don't-bullet “**Don't** mix border roles: …(The Two-Border Rule)” with “**Don't** put a border on an interactive control; borders are structural only (The Structural-Border Rule).”

- [ ] **Step 6: Quiz comment**

`src/components/Quiz.astro`: in the comment above `.quiz-option`, replace “(the sanctioned --border-strong control ring)” with “(the sanctioned --border-strong form glyph — see the Structural-Border Rule)”.

- [ ] **Step 7: Lint + commit**

Run: `pnpm lint:md` — expected: exits 0 (fix any flagged wrapping).

```bash
git add DESIGN.md src/components/Quiz.astro
git commit -m "docs: retire the Two-Border Rule for paper + marginalia"
```

---

### Task 7: Verification sweep + visual snapshots

**Files:**

- Modify: `visual/kitchen-sink.spec.ts-snapshots/*.png` (regenerated)

- [ ] **Step 1: Full checks**

Run: `pnpm build && pnpm test && pnpm typecheck && pnpm lint`
Expected: all exit 0. (`lint` covers the edited .astro files; run `pnpm lint:fix` if prettier complains, then re-check.)

- [ ] **Step 2: Regenerate snapshots**

Run: `pnpm test:visual:update`
Expected: exits 0 with all snapshots rewritten.

- [ ] **Step 3: Review every snapshot diff (mandatory gate)**

Run `git status visual/` to list changed PNGs, then open at least these six and confirm each visible change is a control surface (borders gone, fills/washes as specced) and NOTHING else moved (layout, type, panels unchanged): `overview-light`, `overview-dark`, `tool-flashcards-light`, `tool-flashcards-dark`, `tool-formelsamling-light`, `tool-formelsamling-dark`. Check specifically: topbar search + theme now bare; chips filled not outlined; Øv/Kan filled, arrows bare; formula copy bare glyph; search field filled. If anything non-control moved, STOP and fix before committing.

- [ ] **Step 4: Hit-area + contrast spot checks**

In the built site (`pnpm preview`), verify with devtools-style measurement (Playwright `boundingBox` on `.sc-chip::after` equivalents is acceptable): chip effective target ≥38px tall; `.sc-copy` effective 38px. Confirm `--muted` labels sit on `--bg-elevated` fills (7.1:1 light — passes) and the code-copy glyph on the slab is unchanged (#878580).

- [ ] **Step 5: Commit**

```bash
git add visual/
git commit -m "test: regenerate visual snapshots for paper + marginalia controls"
```

Release note (not a task): version bump + course-pin updates happen at branch release per CLAUDE.md; optics stays FROZEN.
