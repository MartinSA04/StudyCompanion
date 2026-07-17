# study-companion — Roadmap

_Last updated: 2026-07-14._

The framework is feature-complete for its six consuming courses: every planned
widget, the SEO/social/PWA surface, the authoring kit, and the v3 schema
overhaul have shipped. What remains is a short list of deliberately-deferred,
demand-driven items. This is a _menu_, not a commitment.

> Scope reminder (see `CLAUDE.md`): everything stays **data-driven off the
> schema**, with **zero per-course logic** in the framework. Courses pin a tag
> and only author `content/`. SemVer: breaking schema = `major` (bump
> `SCHEMA_VERSION` + `MIGRATIONS.md`), new optional field/widget = `minor`,
> fix/polish = `patch`.

## Deferred features

Built on demand — each is genuinely useful but was held back as too heavy for
the value at the time, or waiting on a real consumer that needs it.

- **Auto-generated OG share image** — `minor`, **L**. A build-time, per-page
  branded 1200×630 PNG (accent ground, the `>_` mark, course `code`, page title)
  via `satori` + a rasterizer, wired to `og:image`/`twitter:image`. Would upgrade
  today's interim square-icon `summary` card to `summary_large_image`. Big
  dependency + effort; could ship opt-in first (`course.yaml` `seo.ogImage:
  true`).
- **Offline reading via service worker** — `minor`, **L**. An **opt-in** precache
  service worker (`course.yaml` `features.offline`) caching the static shell +
  visited pages (Cache-First for fonts/CSS/KaTeX, Stale-While-Revalidate for
  pages), registered in production only, no network beacons. Hand-rolled to keep
  deps lean. A revision guide is exactly what a student wants offline.
- **Long-tail Apple/social polish** — `patch`. The cheap head wins already
  shipped; still open: generated `apple-touch-startup-image` splash screens,
  `@media (display-mode: standalone)` chrome tweaks, `<meta name="author">`.
  Pull individually as demand appears.

## Speculative (only if a consumer needs them)

- **`<Tabs>`** — alternative explanations / approaches / languages. `minor`, **M**.
- **`<Embed>`** — privacy-friendly lecture-video facade with an aspect-ratio box.
  `minor`, **M**.
- **Preact escalation** for `<Quiz>`/`<Flashcards>` — only if island state
  outgrows vanilla JS. Not needed at current complexity.
- **Keystatic** content editing — revisit only if non-technical authors appear.
- **Full chrome i18n** — extend the schema `ui` override layer to island-internal
  strings (Flashcards filter/nav/empty-state/keyboard-hint microcopy, copy-button
  feedback, ThemeToggle label) so an `nn`/`en` course renders monolingual chrome;
  `language` already admits those values but overrides stop at page chrome.
  Revisit when a non-`nb` consumer materializes. `minor`, **L**.

## Infrastructure follow-ups

Guard-tightening on already-shipped CI, safe to do once the baselines settle.

- **Promote Lighthouse budgets from warn to error.** The LCP/TBT assertions run
  as warnings today; flip them to errors once the CI baselines have stabilized
  across a few runs so a real regression fails the build.
- **Tighten the resource-summary byte budgets.** The new per-resource byte
  budgets were set intentionally loose to avoid false failures; ratchet them
  down toward the observed sizes as they stabilize.
- **Full `BASE_URL` / subpath support.** The framework assumes `base: "/"`
  (root-hosted, asserted at setup). If a course ever needs a subpath deploy
  (e.g. GitHub Pages under a repo path), thread `import.meta.env.BASE_URL`
  through the internal links, canonical/OG URLs, sitemap, and manifest.

---

_History (shipped items P0–P5, the §4 SEO/social/PWA tranche, and the v3 schema
overhaul) lives in git. The next `major` — `SCHEMA_VERSION` 4 + a `MIGRATIONS.md`
entry — is triggered only by the first change that forces existing courses to
restructure content._
