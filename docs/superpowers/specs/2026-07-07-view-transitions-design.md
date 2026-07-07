# Stream B — Restrained motion signature (view transitions)

Date: 2026-07-07
Status: implemented + verified
Scope: framework-only. No consumer-repo or schema changes.

## Goal

One restrained motion signature: page-to-page navigation cross-fades so paging
through modules reads as one continuous surface, instead of hard reloads. The
design deliberately shipped zero client-side navigation JS; this taps that lever.

## Approach

- Add Astro `<ClientRouter />` to `CourseLayout`'s head (unconditional).
- **Transition style:** retime the root cross-fade to 180ms `var(--ease)`, guarded
  by `prefers-reduced-motion: no-preference` (Astro also disables it under
  reduced-motion). Chrome is near-identical page to page, so cross-fading the
  whole root reads as the content changing on a stable surface — no header
  `transition:persist` needed.

## The lifecycle problem + fix

Under `ClientRouter`, hoisted widget scripts run once and do NOT re-execute after a
swap; per-page setup must re-run, and document-level listeners / timers / observers
must NOT leak across navigations.

**`src/lib/pageLifecycle.ts` — `onPage(setup)`**: runs `setup(signal)` on the first
load and after every swap; the signal aborts on the next `astro:before-swap`. So
listeners bound with `{ signal }`, and cleanup registered via
`signal.addEventListener("abort", …)` for timers/observers, tear down automatically.
This makes every widget's change small and uniform, and removes the need to persist
the header (the ⌘K document hotkey binds with `{ signal }` so it can't stack).

### Per-widget

| Widget | Change |
|---|---|
| CodeBlock, Glossary, Quiz, FormulaSheet | wrap init in `onPage`, listeners `{ signal }` |
| ThemeToggle, SearchPalette | `onPage` (topbar re-renders each swap); SearchPalette keeps the pagefind cache at module scope; ⌘K bound with `{ signal }` |
| PageToc | `onPage`; scroll listener `{ signal }`; anchor-exists guard (no duplicate `#`) |
| Flashcards | `onPage`; document keydown `{ signal }` (no stacking) |
| Stepper | `onPage`; clear the play `setInterval`, drop resize/theme listeners on abort |
| Simulation | `onPage`; drop resize/theme listeners + disconnect observer on abort |
| `simRuntime.ts` | `lazyMountAll`/`onThemeChange` take an optional `AbortSignal`; `lazyMountAll` skips already-mounted els and disconnects the observer on abort |
| CourseLayout inline script | document handlers (arrow-nav, escape, print) bound once at top level (query live at event time); per-page work (progress paint, menu, copy buttons) runs on `astro:page-load` with `data-*` bind guards |
| Head theme init | re-apply saved `data-theme` on `astro:after-swap` (the incoming static doc has none, so a swap would flash to light) |
| index.astro progress script, SearchPalette kbd hint | `data-astro-rerun` (idempotent, re-runs per swap) |

Known limitation: a course sim/stepper module that starts its own RAF/timer owns its
teardown; the framework disposes only the hooks it provides.

## Verification (headless Chromium, built demo)

11/11 interactive checks after client-side navigation: nav is a real swap (window
global survives, content changes), theme toggle works, mark-done works + persists,
⌘K opens exactly one dialog (no stacked handlers), stepper mounts + transports,
flashcards keydown fires once after re-visits (no stacking), zero console/page
errors across the run. Separate leak probe: playing a stepper then navigating away
returns the live-interval count to baseline (interval cleared, no leak).
Build clean, `pnpm typecheck` clean, 74/74 unit tests, prettier clean.
