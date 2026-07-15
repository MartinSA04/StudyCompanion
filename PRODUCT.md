# Product

## Register

product

## Users

NTNU students (first and foremost the author) working through physics and CS
courses: TFY4195 optics, TDT4120 algorithms, TFY4345 classical mechanics,
TFE4146 semiconductors, TFY4220 solid state physics, FY2045 quantum mechanics.
Context: long reading sessions at a desk (laptop or external monitor), often at
night before an exam; shorter lookup visits to the formula sheet, glossary, or
a specific statement anchor. Content is in Norwegian; math is everywhere
(server-rendered KaTeX). The job to be done is comprehension and exam
readiness: read a module end-to-end, self-test (quiz, flashcards, self-check),
and jump back to formulas fast.

## Product Purpose

study-companion is a versioned Astro integration + component library that owns
all design, schema, and page wiring for course study guides. Course repos are
thin data (YAML + MDX) pinning a framework tag. Success looks like: a new
course reaches published, polished quality with zero design work in the course
repo, and reading a module feels like a beautifully typeset textbook, not a
docs site.

## Brand Personality

Calm, precise, print-like. Quiet editorial confidence: a beautifully typeset
book you trust, with small, exact interactive affordances where they earn
their place. The interface should recede behind the content; math and figures
are the loudest things on the page.

## Anti-references

- Generic docs-site chrome (Starlight/Docusaurus look): evaluated and
  rejected; this is an editorial reading surface, not a docs theme.
- One-page scroll guides: the framework is deliberately multi-page
  (one module per view) with an editorial folio structure.
- SaaS/AI-slop tells and playful/bouncy motion — gradient text,
  glassmorphism, hero metrics, icon-card grids, confetti, and the rest are
  enumerated and enforced as the design system's "Don't" list (`DESIGN.md` §6).

## Design Principles

1. **Content is the interface.** Chrome recedes; typography, math, and figures
   carry the hierarchy. No decoration that doesn't aid comprehension.
2. **One vocabulary, everywhere.** Admonition is the reference component:
   panels and structure use hairlines (--border), interactive controls are
   surface-or-nothing bar the two sanctioned form glyphs (the keycap on
   --border, the quiz radio ring on --border-strong), completion is always
   accent, disclosures share the Solution/Hint idiom, tables use the editorial
   divider style. New widgets must speak this language.
3. **Explicit over derived.** Courses set explicit per-theme values (accent +
   accentDark); no algorithmic color derivation or per-course logic in the
   framework.
4. **Data-driven, course-agnostic.** Everything renders off the schema; polish
   ships to every course at once via the version pin.
5. **Library-grade polish.** The bar is a published component library:
   screenshot-compare in both themes, no unfinished states, no "good enough".

## Accessibility & Inclusion

WCAG AA enforced: 4.5:1 minimum text contrast in both themes (accent text via
the AA-safe --accent-ink pattern), full keyboard operability for every
interactive widget, visible focus indicators, prefers-reduced-motion honored
for all non-essential animation. Norwegian content; KaTeX output must remain
searchable/skippable for assistive tech (aria-hidden mathml handling per KaTeX
defaults).
