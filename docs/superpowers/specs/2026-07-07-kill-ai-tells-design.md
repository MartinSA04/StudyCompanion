# Stream A — Kill the two AI-ish tells

Date: 2026-07-07
Status: proposed (awaiting review)
Scope: framework-only design change, verified in the `demo/` course. No consumer-repo changes.

## Goal

The design system already reads as human-authored (editorial serif, mono kickers,
hairline rules, restrained palette). Two conventions are the only remaining
"documentation-template" tells. Replace them with treatments **native to the
system's own vocabulary** so nothing reads as borrowed.

## Decision 1 — Admonition family: mono kicker, no stripe

**Approved direction:** drop the 3px colored left-stripe; keep the full hairline
border + faint tint; express the semantic color through a **mono UPPERCASE kicker +
icon** (the same treatment `Example` and `Statement` already use via their kicker
badge). This makes the whole admonition family consistent with the panels that
already look right.

### Shared pattern (target)

```
┌────────────────────────────────────────┐
│ ★ TIPS                                  │   kicker: mono, uppercase, 0.03em,
│ Body copy, lists, math, links …         │   semibold, colored by the tone;
└────────────────────────────────────────┘   icon in the same color.
  full 1px border color-mix(tone 30–35%, --border)
  background: faint tone tint (existing --*-bg tokens)
  NO border-left stripe.
```

### Reduce duplication (recommended)

`Callout`, `LearningGoals`, `KeyTakeaways`, `ExamFocus` are ~90% identical
(`<aside>` + tinted box + colored heading + slotted body; differ only in tone,
icon, default title, aria-label). Following the same move that extracted
`PanelHeader` (ROADMAP 2.7), factor an internal `Admonition.astro` primitive:

```astro
<Admonition tone="tip" icon="star" title="Tips" ariaLabel="Tips">
  <slot />
</Admonition>
```

- `tone` maps to a `--tone` / `--tone-bg` pair (reuses existing `--tip`/`--tip-bg`,
  `--note`, `--warning`, `--cyan`/`--goals-bg`, `--violet` tokens).
- The four author-facing components become thin wrappers (their public MDX names
  and props are unchanged — `mdx-components.ts` stays identical).
- `KeyTakeaways` keeps its checklist-bullet styling on top of the primitive.
- Not author-facing; internal primitive like `PanelHeader`.

Fallback if a smaller diff is preferred: convert each component's `-title`/`-icon`
styles in place. Same visual result, more duplication.

### Components converted

| Component | Today | Change |
|---|---|---|
| `Callout` (note/tip/warning) | colored title-case heading + stripe | mono kicker, no stripe (via `Admonition`) |
| `LearningGoals` (cyan) | same | same |
| `KeyTakeaways` (violet) | same + checklist bullets | same, keep bullets |
| `ExamFocus` (warning) | same | same |
| `Statement` | mono badge **and** redundant stripe | drop the stripe only (badge stays) |
| `Answer` | mono label chip + `border-left: tip` | full 1px border + `--answer-bg` + radius, keep chip, no stripe |
| `Quiz` `.quiz-explain` | accent stripe, one-sided radius | full 1px border + `--accent-soft` + full radius |
| `ExamSummary` | full border + accent stripe | drop the stripe |
| `FormulaSheet` `.fs-source` intro | `1px solid --accent` + 4px stripe | soften to `color-mix(accent 30%, border)` + soft bg, no stripe |
| `.lede` (shell.css) | accent stripe + padding-left | stripe-free editorial lede (larger, muted intro); or leave if unused — see open question |

### Deliberately kept (functional / neutral, not the tell)

- `blockquote` (`base.css`) — neutral `--border-strong` gray rule, a centuries-old
  typographic convention, not a semantic alert.
- Sidebar importance markers (`shell.css` inset 2px `--core`/`--useful`/`--extra`)
  — shape-redundant with `ImportanceTag`; praised, subtle.
- `CodeBlock` active-line inset accent — live "current line" indicator synced to
  the stepper, functional.
- `.fs-row:target` / `Glossary` `:target` inset accent — transient deep-link flash.

## Decision 2 — Overview hero stat-row: remove entirely

Delete the `.hero-stats` block from `src/pages/index.astro` (markup) and the
`.hero-stats` / `.stat` rules from `shell.css`. The module count already lives in
the hero sentence ("N moduler med læringsmål …"); the progress line ("0 av N
moduler fullført") remains. Formula/flashcard/exam counts are still reachable via
the sidebar tools. Net: the hero loses its only KPI-card surface.

## Open questions (confirm before implementing)

1. **Formula-sheet "må pugges" row stripe** (`.fs-row[data-memorize]`, orange).
   The code comment calls it "the original's orange 'off the sheet' stripe" — a
   deliberate homage to the source guide, and it pairs with an existing "ikke på
   formelarket" chip. Recommendation: **keep it** (it's from the source, it marks a
   row not a box, and it's redundant-with-a-chip which is good). Or soften/remove
   for full consistency. Your call.
2. **`Admonition` primitive vs in-place edits** — recommend the primitive (kills
   duplication, guarantees consistency). Confirm.
3. **`.lede`** — convert to a stripe-free lede, or leave as-is?

## Verification

- Rebuild `demo/` and screenshot every route in **both themes**; compare against
  the pre-change screenshots (already captured).
- `pnpm typecheck`.
- `pnpm test` (unit) + `pnpm test:visual:update` to refresh baselines intentionally.
- Manual read: callouts still scannable, tones still distinguishable, no double
  borders or misaligned kickers.

## Non-goals

Stream B (motion) and Stream C (distribution) are separate specs.
No consumer-repo, schema, or version changes. No new tokens unless a tone lacks a
`--*-bg` pair (check during implementation).
