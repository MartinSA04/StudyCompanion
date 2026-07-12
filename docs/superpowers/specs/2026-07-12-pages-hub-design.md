# GitHub Pages course hub — design

A public one-pager at `kurs.martinsundal.no`, deployed from this repo via
GitHub Pages, with a button per course site. It follows the framework's UI
principles exactly by importing the framework's own style tokens — no copied
CSS.

## Goals

- One simple page: kicker, headline, one intro sentence, course tiles, footer.
- Visual lockstep with the framework: the page consumes `src/styles/` directly,
  so token and typography changes propagate to the hub on its next deploy.
- Data-driven: adding a course later is one YAML entry, no markup edits.
- Norwegian, matching the course sites and the framework's default UI strings.

## Non-goals

- No hub mode in the framework integration (the integration renders courses;
  the hub is repo-local).
- No theme toggle: the hub follows `prefers-color-scheme`. Course sites keep
  their per-course toggle.
- No search, no analytics, no course metadata beyond code/title/URL.

## Page content

Single centered column in the site's reading measure, Norwegian copy:

- Headline `Studieguider` + one intro sentence: "Interaktive studieguider
  med flashcards, quiz og formelsamling." No separate kicker — the tiles
  carry the mono course-code kickers.
- One tile per course, in this order (same as martinsundal.no), each an
  `<a>` in the framework's tile language — `sc-panel` float, `sc-lift`
  hover-raise, course code as mono accent kicker, title beneath:

  | Code | Title | URL |
  | --- | --- | --- |
  | TFY4195 | Optikk | <https://optikk.martinsundal.no> |
  | FY2045 | Kvantemekanikk I | <https://kvante.martinsundal.no> |
  | TDT4120 | Algoritmer og datastrukturer | <https://algdat.martinsundal.no> |
  | TFE4146 | Halvlederkomponenter | <https://halvleder.martinsundal.no> |
  | TFY4220 | Faste stoffers fysikk | <https://fastestoffer.martinsundal.no> |
  | TFY4345 | Klassisk mekanikk | <https://klasmek.martinsundal.no> |

- Quiet mono footer: links to the GitHub repo
  (`github.com/MartinSA04/StudyCompanion`) and to `martinsundal.no`.
- Dark mode: a tiny inline no-flash script sets `data-theme` on `:root` from
  `prefers-color-scheme` (and tracks live changes). Same tokens as the
  course sites.

## Files

- `hub/index.astro` — the page. Frontmatter parses `hub/courses.yaml` with the
  existing `yaml` dependency; imports `src/styles/fonts.css`,
  `src/styles/tokens.css`, and `src/styles/base.css` whole (a few unused KaTeX
  rules are the price of zero drift); page-scoped styles for the hub-specific
  layout. Head: `<title>Studieguider — Martin Sundal</title>`, meta
  description, `lang="no"`.
- `hub/courses.yaml` — `code`, `title`, `url` per course; file order is
  display order.
- `hub/public/CNAME` — `kurs.martinsundal.no`.
- `hub/public/favicon.svg` — the CourseLayout brand-mark geometry as a
  standalone SVG (small intentional duplication; extract a shared source
  only if the mark ever changes).
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
  parses, is non-empty, and every entry has a non-empty `code`, `title`, and
  an `https://` URL — a typo'd link fails CI, not a visitor.
- Visual: hub snapshots in light and dark join the existing Playwright suite;
  the visual config gains a second `webServer` entry that builds and previews
  the hub on its own port.
