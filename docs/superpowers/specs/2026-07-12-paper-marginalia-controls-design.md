# Paper + marginalia controls — design

**Date:** 2026-07-12 · **Branch:** `design-polish` · **Status:** proposed

## Problem

The page expresses all depth and structure tonally: panels, tiles, sidebar
rows and disclosures are borderless fill-steps on the paper ("depth is tonal
paper layering, flat at rest"). Interactive controls are the one family that
still wears 1px outlines (`.sc-icon-btn`, `.sc-pill`, `.sc-chip`, `.sc-copy`,
`.fc-btn`, quiz options, search fields). Outlined boxes are form/docs-site
chrome — the vocabulary the rest of the surface deliberately rejects — and the
maintainer flagged exactly this: the bordered buttons and pills (search, theme
switch, "fortsett der du slapp", formula filters, flashcard filters/controls)
don't align with the rest of the page.

Direction was chosen against a live specimen page (both themes, exact tokens,
site woff2s) comparing four treatments; the approved result is a hybrid of the
"paper" and "marginalia" treatments.

## The rule

**State sits on paper; navigation sits in the margin.**

- A control you **toggle, select, or complete** — or type into — keeps a
  surface: borderless paper fill, one tone off its ground.
- A control that **acts instantly or navigates** loses its surface entirely:
  bare mono type / bare glyph, with an ink-wash hover.

Borders are hereby **structural only** (hairlines, dividers, table rules,
keycaps, the dashed empty-state placeholder). No interactive control carries a
border at rest in either theme.

## Treatment recipes

### Paper (stateful controls)

- **Rest:** `background: var(--control-fill, var(--bg-elevated))`; no border;
  existing radius, type, and sizing unchanged.
- **Nested-aware:** a panel that hosts controls sets
  `--control-fill: var(--card-nested)` on itself, so controls step off
  *whatever ground they sit on* — same alternation contract the cards follow.
- **Hover:** fill darkens one paper step (`--card-hover`; on nested grounds a
  6% ink wash over the nested fill) + text lights to `--accent-ink`.
- **Selected:** unchanged — solid `--accent` fill, `--accent-contrast` text
  (`.active` / `aria-pressed="true"`).
- **Done:** unchanged — `--accent-soft` fill, `--accent-ink` text.
- **Press / focus:** unchanged — 1px dip; 2px accent outline offset 2px.

### Marginalia (navigational / utility controls)

- **Rest:** transparent; bare mono label or bare glyph in `--muted`; radius
  retained (it shapes the hover wash).
- **Hover:** ink wash `color-mix(in srgb, var(--fg) 6%, transparent)` — the
  same wash the disclosure summaries use — + text/glyph lights to
  `--accent-ink`.
- **Press / focus:** unchanged.
- **Hit areas:** unchanged geometry. Where the visible glyph is smaller than
  the 38px `--control-h` norm, the existing invisible-overhang pseudos keep
  WCAG 2.5.8 satisfied; marginalia controls keep their full-size (now
  invisible) boxes as hit areas.

The page's dominant hover cue changes from "border + text light to accent" to
"surface responds (fill darkens / wash appears) + text lights to accent-ink".
Accent-ink text stays the constant across both families.

## Control inventory

| Control | Where | Treatment |
|---|---|---|
| Search trigger (`.search-trigger`) | topbar | marginalia |
| Theme toggle, menu toggle, sidebar close (`.sc-icon-btn`) | topbar / drawer | marginalia |
| Copy buttons (`.code-copy`, `.fs-copy` via `.sc-copy`) | code blocks, formula rows | marginalia |
| Deck nav arrows (`.fc-nav`) | flashcards | marginalia |
| "Fortsett der du slapp" (`.hero-continue`) | hero panel | marginalia |
| 404 pills (`.nf-home`) | 404 page | marginalia |
| Deck reset (`.fc-reset`) | flashcards | marginalia (align to recipe) |
| Esc keycap button (`.search-esc`) | search dialog | keycap (unchanged frame) + wash hover |
| Filter chips (`.sc-chip`: formula filters, flashcard filters, Kun ukjente, Bland) | formula sheet, flashcards | paper |
| Øv / Kan rating (`.fc-btn` minus `.fc-nav`) | flashcards | paper |
| "Merk som fullført" (`.done-btn`) | module pages | paper (done state accent-soft, as today) |
| Quiz options | quiz panel | paper, nested fill |
| Search fields (formula sheet, glossary, palette input) | tool pages / dialog | paper, nested-aware |
| Simulation selects/inputs | sim panels | paper, nested-aware |

**Explicitly unchanged:** the ⌘K keycap (`.sc-kbd` — a keycap is semantically a
bordered glyph, not a control), the dashed `fc-empty` placeholder (static),
ImportanceTag badges (static), structural hairlines/dividers/tables, `.sc-tile`
/ `.sc-lift` / `.sc-panel` / `.sc-summary` (already borderless), selection and
completion colors, all motion tokens and the press dip.

## Primitive & token changes

- `tokens.css`: add `--wash: color-mix(in srgb, var(--fg) 6%, transparent)`
  (theme-resolving); document the `--control-fill` contract next to the card
  alternation comment.
- `primitives.css`:
  - `.sc-icon-btn`, `.sc-copy`, `.sc-pill` → **marginalia** recipe (transparent
    rest, wash hover). These three currently share the bordered-control recipe;
    their callers are all navigational.
  - `.sc-chip` → **paper** recipe (drop `--border-strong` frame, keep size /
    radius / selected fill).
  - New `.sc-btn` → **paper** labelled button (adopted by `.done-btn`,
    `.fc-btn`; `.fc-nav` composes marginalia instead).
  - New `.sc-field` → **paper** input wrapper (adopted by formula-sheet search,
    glossary search, palette input).
  - `.sc-summary` hover refactors to `var(--wash)` (no visual change).
- `base.css`: `.code-copy` keeps its slab-calibrated colors but follows the
  marginalia shape (no border/fill at rest; wash hover tuned against the fixed
  near-black slab in both themes).
- The **Two-Border Rule** is retired. `--border-strong` keeps its structural
  uses (scrollbar thumbs, decorative strong hairlines); it no longer marks
  interactivity.

## DESIGN.md updates

- §2 Named Rules: replace **The Two-Border Rule** with **The Structural-Border
  Rule** (borders never mark interactivity; controls are surface-or-nothing)
  and add **The Paper/Marginalia Rule** (the state/navigation split).
- §5 Buttons / Chips / Inputs: rewrite recipes per above; document the new
  hover vocabulary.
- §6 Do's & Don'ts: "Do give every interactive element the full state set"
  updated to the new hover cue; add "Don't put a border on an interactive
  control".
- Frontmatter `components.icon-button` entry updated.

## Non-goals

- No markup/behavior changes beyond class composition; no schema change, no
  MIGRATIONS entry.
- No re-litigation of §7 adjudications (quiz one-shot, pager numbers, etc.).
- No changes to static badges, callouts, tables, or the print stylesheet.

## Verification

- `pnpm build` + kitchen-sink demo pass in both themes.
- Visual snapshots (`visual/kitchen-sink.spec.ts`) regenerate; every diff must
  be a control surface, nothing else.
- Contrast spot-checks: `--muted` on `--bg-elevated`/`--card-nested` fills
  (already AA per tokens.css contracts); selected/done states unchanged; the
  code-copy wash against the fixed slab.
- Hit-area audit: every marginalia control still measures ≥38px effective
  target (inspect the overhang pseudos).
- Release: minor version bump; update `course-template/` + non-frozen course
  pins per CLAUDE.md (optics stays frozen).

## Risks

- **Affordance loss on marginalia controls** — accepted deliberately
  (maintainer's quiet, trusting stance; mono type + glyph + placement carry
  clickability; hover/focus/press all still answer).
- **Dark-theme fill steps are subtle** (`#1c1b1a` on `#100f0f`): verified
  acceptable on the specimen page; the selected/accent states carry the
  strongest signals.
- **`--control-fill` inheritance** could leak into unintended descendants;
  mitigated by setting it only on panels that actually host controls and by
  the visual-snapshot gate.
