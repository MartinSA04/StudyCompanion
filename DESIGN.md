---
name: study-companion
description: Editorial study-guide framework — warm Flexoki paper, serif reading faces, mono marginalia
colors:
  accent-default: "#205ea6"
  paper: "#fffcf0"
  paper-panel: "#f2f0e5"
  paper-nested: "#e6e4d9"
  ink: "#100f0f"
  ink-dim: "#575653"
  ink-faint: "#6f6e69"
  line: "#dad8ce"
  line-strong: "#cecdc3"
  night: "#100f0f"
  night-panel: "#1c1b1a"
  night-nested: "#282726"
  night-ink: "#cecdc3"
  night-ink-dim: "#9f9d96"
  night-ink-faint: "#878580"
  night-line: "#403e3c"
  night-line-strong: "#575653"
typography:
  display:
    fontFamily: "Fraunces, Georgia, Times New Roman, serif"
    fontSize: "2.7rem"
    fontWeight: 600
    lineHeight: 1.18
  headline:
    fontFamily: "Fraunces, Georgia, Times New Roman, serif"
    fontSize: "1.95rem"
    fontWeight: 600
    lineHeight: 1.18
  title:
    fontFamily: "Fraunces, Georgia, Times New Roman, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.18
  body:
    fontFamily: "Spectral, Georgia, Times New Roman, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.02em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  space-1: "0.25rem"
  space-2: "0.5rem"
  space-3: "0.75rem"
  space-4: "1rem"
  space-5: "1.5rem"
  space-6: "2rem"
  space-7: "3rem"
  space-8: "4rem"
  gap-2: "8px"
  gap-4: "16px"
  gap-6: "24px"
  gap-7: "32px"
  gap-9: "48px"
  gap-11: "80px"
components:
  panel:
    backgroundColor: "{colors.paper-panel}"
    rounded: "{rounded.md}"
  tile:
    backgroundColor: "{colors.paper-panel}"
    rounded: "{rounded.md}"
  icon-button:
    backgroundColor: "{colors.paper-panel}"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.sm}"
    size: "38px"
  pill-button:
    backgroundColor: "{colors.paper-panel}"
    textColor: "{colors.ink-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
  chip:
    backgroundColor: "{colors.paper-panel}"
    textColor: "{colors.ink-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.35em 0.8em"
  chip-selected:
    backgroundColor: "{colors.accent-default}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
  keycap:
    backgroundColor: "{colors.paper-panel}"
    textColor: "{colors.ink-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
---

# Design System: study-companion

## 1. Overview

**Creative North Star: "The Typeset Textbook"**

A beautifully set course book whose margins happen to be alive. Print
typography carries the entire hierarchy: Fraunces display headings, Spectral
body at a generous 17px editorial measure, IBM Plex Mono for every piece of
interface marginalia (kickers, chips, keycaps, disclosure labels). The surface
is Flexoki warm paper in light mode and warm near-black in dark; every neutral
is tinted toward the ink, never pure #000/#fff. Interaction is quiet
marginalia, not app chrome: controls sit restrained at rest and answer every
touch (accent on hover, a 1px dip on press, a 1px lift on hover).

The system explicitly rejects generic docs-site chrome (the Starlight look),
SaaS/AI-slop tells (gradient text, glassmorphism, hero metrics, icon-card
grids), one-page scroll guides, and playful/bouncy motion. It is a product
surface judged at a best-tool bar: the design serves comprehension and exam
readiness; math and figures are the loudest things on the page.

**Key Characteristics:**

- Warm Flexoki paper/ink palette, per-course accent as the only brand variable
- Serif-first: display serif headings, serif body, mono UI labels; no sans in content
- Depth is tonal paper layering, not shadow stacking; flat at rest
- One interaction vocabulary sitewide (.sc-* primitives); completion is always accent
- Norwegian editorial content with server-rendered KaTeX math everywhere

## 2. Colors

Warm paper and ink from the Flexoki palette; one per-course accent; Flexoki
categorical hues for figures and semantic asides.

### Primary

- **Course Accent** (#205ea6 default; set per course as accent + accentDark):
  links, selection, focus rings, completion states, chip-selected fills,
  primary actions. As TEXT on tinted or elevated grounds it is always mixed
  75% toward the ink (--accent-ink) to stay AA; raw accent is reserved for
  fills, borders, rings, and icons.

### Neutral

- **Paper** (#fffcf0): the page ground (Flexoki paper).
- **Paper Panel** (#f2f0e5): panels, cards, insets (Flexoki base-50); panels
  step DOWN from the bright page, like print stock layered on a desk.
- **Paper Nested** (#e6e4d9): recessed fill for revealed/nested panels
  (base-100); nesting alternates fills rather than darkening forever.
- **Ink** (#100f0f), **Ink Dim** (#575653, 7.1:1), **Ink Faint** (#6f6e69,
  5.0:1): text ramp; faint is for nav numbers and captions only.
- **Line** (#dad8ce) for panel hairlines; **Line Strong** (#cecdc3) for
  control borders. Panels=line, controls=line-strong is a contract.
- Dark theme mirrors the ramp on Flexoki black (#100f0f ground, #1c1b1a
  panels, #cecdc3 ink); accents get per-course dark variants.

### Named Rules

**The Two-Border Rule.** Panels use --border; interactive controls use
--border-strong. A component that mixes them up is wrong.

**The Accent-Ink Rule.** Accent-colored TEXT always goes through --accent-ink
(accent mixed 75% toward the ink); raw --accent on text is forbidden except on
accent-filled surfaces via --accent-contrast.

**The Literal-Swatch Rule.** Aside/callout tones (note, tip, warning, goals,
wrong) are literal Flexoki -low/-high swatches, never color-mix tints of the
accent; a dark accent mixed onto paper reads muddy.

## 3. Typography

**Display Font:** Fraunces (with Georgia fallback)
**Body Font:** Spectral (with Georgia fallback)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace fallback)

**Character:** A warm book-serif pairing: Fraunces gives headings a wonky
old-style confidence, Spectral reads long-form at 17px/1.65 without fatigue,
and Plex Mono marks everything that is interface rather than content.
Spectral ships true italic faces (400/600) so blockquotes and emphasis never
render synthesized obliques; both serifs declare metric-adjusted Georgia
fallbacks ("Spectral Fallback"/"Fraunces Fallback", size-adjust + ascent
overrides) so the webfont swap does not reflow the column.

### Hierarchy

- **Display / h1** (600, 2.7rem, 1.18): module titles; folio-numbered.
- **Headline / h2** (600, 1.95rem, 1.18): section headings; text-wrap balance.
- **Title / h3** (600, 1.5rem, 1.18): subsections and panel headers.
- **Body** (400, 1rem = 17px, 1.65): all prose; content column capped at
  820px (~96ch measured — a deliberate carry-over of the original guide's
  wide measure, wider than the classic 65–75ch ideal). Content sizes are rem
  so the reading size scales; shell chrome is fixed px on purpose.
- **Label** (600 mono, 0.72–0.84rem, uppercase kickers at 0.02em; wide
  0.08em for part dividers): chips, kickers, keycaps, disclosure summaries,
  nav numbers.

### Named Rules

**The Mono-Marginalia Rule.** If text is interface (label, kicker, control,
badge, count), it is IBM Plex Mono. If it is content, it is a serif. No sans
ever appears in rendered content.

## 4. Elevation

Depth is tonal paper layering, flat at rest. The page is the brightest sheet;
panels step down one paper tone; nested panels alternate between base-100 and
base-50 so double-nesting reads as layers instead of a darkening pit. Shadows
are whispers (--shadow-sm at rest on floating cards) that grow one step on
hover; --shadow-lg is reserved for true overlays (search palette). Dark mode
inverts the logic: elevation lightens.

### Shadow Vocabulary

- **Whisper** (`0 1px 2px rgba(ink, 7%)`): resting shadow on floating tiles.
- **Hover** (`0 4px 12px 8% + 0 1px 3px 6%`): the .sc-lift hover response.
- **Overlay** (`0 24px 60px 22%`): search palette / modal layer only.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest; shadow growth is a
response to hover or overlay, never resting decoration.

## 5. Components

One vocabulary sitewide, extracted into `.sc-*` primitives (primitives.css).
Admonition is the reference component; new widgets must speak this language.
Feel: restrained at rest, tactile on touch.

### Buttons

- **Shape:** small radius (6px); square icon buttons at 38px (--control-h).
- **Resting:** panel fill (#f2f0e5), 1px neutral border, mono dim-ink label.
- **Hover / Focus:** border and text light to accent (--accent-ink for text);
  focus is a 2px accent outline offset 2px. Press dips 1px (.sc-press).
- **Labelled pill (.sc-pill):** same recipe in inline-flex labelled form
  (search trigger, done button, continue).

### Chips (.sc-chip)

- **Style:** pill radius, --border-strong frame, panel fill, mono xs text.
- **State:** hover lights accent border+text; selected fills solid accent
  with --accent-contrast text (aria-pressed="true").

### Cards / Containers (.sc-panel / .sc-tile)

- **Corner Style:** 8px (12px for large frames).
- **Background:** paper-panel; nested content alternates paper-nested/panel.
- **Shadow Strategy:** whisper at rest, hover grows shadow + 1px lift
  (.sc-lift); nested cards drop shadows entirely.
- **Border:** none on floating cards; hairline --border where structure
  needs a line instead of a fill step.
- **Internal Padding:** space-4 to space-5.

### Inputs / Fields

- **Style:** quiz options and search input follow the control recipe:
  panel fill, --border-strong, mono or body text per context.
- **Focus:** 2px accent outline, offset 2px, radius-sm.
- **Error / correct:** literal Flexoki red/green -low fills with -high text
  (--wrong/--wrong-bg, --tip/--answer-bg).

### Navigation

- Sticky topbar (74px, --topbar-h contract) + left course sidebar (288px,
  narrowed to 14rem in the 981–1199px band to protect the reading measure)
  + right "on this page" rail (200px, ≥1440px). Sidebar rows: mono numbers
  in ink-faint, accent completion states, hover-lift. Breakpoints: 1440px
  reveals the TOC rail, 980px collapses the sidebar (drawer), 640px is the
  mobile pass — the complete vocabulary; no other widths.

### Disclosures (signature)

- Solution / Hint / Derivation share one idiom (.sc-summary): mono accent-ink
  summary row, rotating chevron (90° in 120ms), hairline under the open
  summary, faint ink-overlay hover. Revealed bodies sit on the nested paper
  tone.

### Motion vocabulary

- One easing: cubic-bezier(0.32, 0.72, 0, 1); durations 120ms (state),
  200ms (surface), and a 1.8s one-shot (--dur-flash) for deep-link arrival
  flashes (sc-target-flash). prefers-reduced-motion zeroes all three tokens
  globally. The theme flip eases as one coordinated event: a transient
  html.theme-transitioning class carries the transition; nothing transitions
  theme colors at rest.

## 6. Do's and Don'ts

### Do:

- **Do** route every accent-colored text through --accent-ink; keep raw
  --accent for fills, borders, rings, icons.
- **Do** give every interactive element the full state set: rest, hover
  (accent light-up), focus-visible (2px accent outline), press (1px dip).
- **Do** use mono for anything that is interface, serif for anything that is
  content (The Mono-Marginalia Rule).
- **Do** express depth by stepping paper tones (panel → nested → panel);
  keep shadows for hover and overlays.
- **Do** keep completion/progress accent-colored everywhere; completion is
  the accent's semantic job.
- **Do** honor prefers-reduced-motion via the duration tokens; any new
  animation must collapse to 0ms with them.

### Don't:

- **Don't** ship generic docs-site chrome ("the Starlight look"); this is an
  editorial reading surface, not a docs theme.
- **Don't** use SaaS/AI-slop tells: gradient text, decorative glassmorphism
  (the topbar's functional scroll-legibility backdrop blur is the single
  sanctioned exception), hero-metric blocks, identical icon-card grids,
  side-stripe callout borders (border-left > 1px as color accent).
- **Don't** use pure #000/#fff anywhere; every neutral is a warm Flexoki tone.
- **Don't** mix border roles: panels never use --border-strong, controls
  never use --border (The Two-Border Rule).
- **Don't** tint asides by color-mixing the accent onto paper; asides use
  literal Flexoki swatches (The Literal-Swatch Rule).
- **Don't** add playful/bouncy motion, confetti, or gamification aesthetics;
  no orchestrated page-load choreography.
- **Don't** put per-course logic or derived colors in the framework; courses
  set explicit accent + accentDark (Explicit over Derived).
