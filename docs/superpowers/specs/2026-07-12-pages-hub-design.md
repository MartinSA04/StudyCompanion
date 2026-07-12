# GitHub Pages course hub — design

A public one-pager at `kurs.martinsundal.no`, deployed from this repo via
GitHub Pages, with a button per course site. It follows the framework's UI
principles exactly by importing the framework's own style tokens — no copied
CSS.

## Goals

- One simple page: headline, one intro sentence, theme toggle, course tiles
  grouped by semester, footer.
- Visual lockstep with the framework: the page consumes `src/styles/` directly,
  so token and typography changes propagate to the hub on its next deploy.
- Data-driven: adding a course later is one YAML entry, no markup edits.
- Norwegian, matching the course sites and the framework's default UI strings.

## Non-goals

- No hub mode in the framework integration (the integration renders courses;
  the hub is repo-local).
- No search, no course metadata beyond code/title/URL/term.

## Page content

Single centered column in the site's reading measure, Norwegian copy:

- Headline `Studieguider` + one intro sentence: "Interaktive studieguider
  med flashcards, quiz og formelsamling." No separate kicker — the tiles
  carry the mono course-code kickers.
- Theme toggle top-right, same behavior and iconography as the course
  sites: choice persists in localStorage under `sc:theme:hub` (the
  framework's `sc:theme:<code>` pattern), falls back to
  `prefers-color-scheme`, with the usual no-flash inline script.
- Courses grouped by semester, one section per term, newest first. Section
  headers render the term code as a human label (`H2026` → «Høst 2026»,
  `V2026` → «Vår 2026») in the site's mono kicker style.
- One tile per course, each an `<a>` in the framework's tile language —
  `sc-panel` float, `sc-lift` hover-raise, course code as mono accent
  kicker, title beneath:

  | Term | Code | Title | URL |
  | --- | --- | --- | --- |
  | H2026 | FY2045 | Kvantemekanikk I | <https://kvante.martinsundal.no> |
  | H2026 | TDT4120 | Algoritmer og datastrukturer | <https://algdat.martinsundal.no> |
  | H2026 | TFE4146 | Halvlederkomponenter | <https://halvleder.martinsundal.no> |
  | H2026 | TFY4220 | Faste stoffers fysikk | <https://fastestoffer.martinsundal.no> |
  | H2026 | TFY4345 | Klassisk mekanikk | <https://klasmek.martinsundal.no> |
  | V2026 | TFY4195 | Optikk | <https://optikk.martinsundal.no> |

- Quiet mono footer: links to the GitHub repo
  (`github.com/MartinSA04/StudyCompanion`) and to `martinsundal.no`.
- Analytics: GoatCounter, mirroring the framework's wiring (async
  `count.js`, cookieless, production builds only — never in `astro dev`),
  counting to `https://kursmartinsundal.goatcounter.com/count`.

## Files

- `hub/pages/index.astro` — the page (Astro requires `pages/` under
  `srcDir`). Frontmatter parses `hub/courses.yaml` with the
  existing `yaml` dependency; imports `src/styles/fonts.css`,
  `src/styles/tokens.css`, and `src/styles/base.css` whole (a few unused KaTeX
  rules are the price of zero drift); page-scoped styles for the hub-specific
  layout. Head: `<title>Studieguider — Martin Sundal</title>`, meta
  description, `lang="no"`.
- `hub/courses.yaml` — `code`, `title`, `url`, `term` per course. Groups
  appear in order of first appearance in the file, tiles in file order
  within their group — keep the file sorted newest semester first; no sort
  logic to get wrong.
- `hub/public/CNAME` — `kurs.martinsundal.no`.
- Favicon: `faviconDataUri("#205ea6")` imported from `src/lib/favicon.ts` —
  the framework's own mark, no duplicated geometry. (Supersedes the earlier
  copied-SVG idea; the shared source already existed.)
- `astro.config.hub.mjs` — `site: "https://kurs.martinsundal.no"`,
  `srcDir: "./hub"`, `publicDir: "./hub/public"`, `outDir: "./dist-hub"`.
  Plain Astro, no integration.
- `package.json` — `hub:dev` and `hub:build` scripts pointing at the hub
  config.

The framework (`src/index.ts`), schema, demo course, and the course-repo
contract are untouched. `dist-hub/` joins `.gitignore`.

## Deployment

- `.github/workflows/pages.yml`: on push to `main` filtered to `hub/**`,
  `src/styles/**`, `astro.config.hub.mjs`, and the workflow itself, plus
  `workflow_dispatch` — install with pnpm, `pnpm hub:build`,
  `actions/upload-pages-artifact` on `dist-hub/`, `actions/deploy-pages`.
- One-time manual steps (repo owner): set the repo's Pages source to
  "GitHub Actions"; add a DNS `CNAME` record `kurs` →
  `martinsa04.github.io`.

## Testing

- Unit (`test/hub.test.ts`, node --test like the rest): `hub/courses.yaml`
  parses, is non-empty, and every entry has a non-empty `code`, `title`, an
  `https://` URL, and a `term` matching `^[HV]\d{4}$` — a typo'd link fails
  CI, not a visitor.
- Visual: hub snapshots in light and dark join the existing Playwright suite
  (forcing theme via the `sc:theme:hub` key, like the kitchen-sink tests);
  the visual config gains a second `webServer` entry that builds and
  previews the hub on its own port.
