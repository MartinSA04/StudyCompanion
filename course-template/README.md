# course-template

A copyable starter for a **study-companion** course repo. It contains the three
thin files, a `content/` folder with an annotated `course.yaml` and one worked
example section per archetype, and a `public/` with a minimal canvas simulation —
everything a course needs and nothing more.

## Create a course from it

```bash
npx degit MartinSA04/StudyCompanion/course-template course-mycode
cd course-mycode
pnpm install
pnpm dev
```

Copy from the repo's **main** branch — the `degit` path above takes HEAD by
default. Don't copy the template out of a release-tag checkout: a tag's committed
`pnpm-lock.yaml` always records the *previous* release by construction (the
lockfile is regenerated only after the tag is pushed), so it would start you on a
stale lockfile.

Then:

1. Edit `package.json` → set `name` and pin the framework tag. Use the **newest**
   `vX.Y.Z` tag, and keep it current — bump it to pick up new widgets and fixes.
   The committed `pnpm-lock.yaml` is pinned to the template's tag; after you
   change the pin, run `pnpm install` to update it.
2. Set `site` in `astro.config.mjs` to your public origin (needed for the
   canonical link, social cards and the sitemap).
3. Edit `content/course.yaml` → identity, accent, `courseUrl`, `institution`,
   exam, formulas, glossary. Keep `schemaVersion` equal to the framework's
   `SCHEMA_VERSION` (currently **3**); a mismatch fails the build. The schema is
   strict — an unknown or misspelled key fails the build naming the key.
4. Replace the example sections under `content/sections/` with your modules.
5. Drop your figures, sims and any vendored exam PDFs into `public/`. No favicon
   file is needed — the favicon and all app icons are generated from the course
   `accent`/`accentDark`.

## Local framework development

To author against a local checkout of the framework instead of a pinned tag,
swap the dependency in `package.json`:

```jsonc
"study-companion": "link:../study-companion"
```

## Where the guidance lives

- **`CLAUDE.md`** (here) — the rules + workflow for an authoring agent.
- **`AUTHORING.md`** (framework repo) — the full author's guide: archetypes,
  widget decision guide, conventions, and the per-section definition-of-done.
- **`README.md`** (framework repo) — the widget/`course.yaml` reference.
- **`SECTION-BRIEF.md`** (here) — a one-pager to plan each module before writing.
