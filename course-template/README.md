# course-template

A copyable starter for a **study-companion** course repo. It contains the three
thin files, a `content/` folder with an annotated `course.yaml` and one worked
example section per archetype, and a `public/` with a minimal canvas simulation —
everything a course needs and nothing more.

The bundled `LICENSE` is **CC BY 4.0** (the canonical legalcode, kept verbatim —
GitHub only auto-detects it unmodified): the convention for course repos here,
since what they hold is educational writing, not code. It becomes YOUR new
repo's license, so swap the file if your course needs different terms. The
framework itself stays MIT (the repo-root LICENSE); this file licenses only the
content repo copied from here.

## Create a course from it

```bash
npx degit MartinSA04/StudyCompanion/course-template course-mycode
cd course-mycode
pnpm install
pnpm dev
```

The template ships **no `pnpm-lock.yaml`** — the `pnpm install` above generates
yours. **Commit it**: the bundled `.github/workflows/deploy.yml` installs with
`--frozen-lockfile`, so your first deploy fails without it.

Once the course exists, REPLACE this file with a short course README (title,
live URL, "built on StudyCompanion, content only", run-locally, license line —
copy the shape from any existing course repo). This starter doc describes the
template, not your course, and reads stale the moment the repo is real.

Then:

1. Edit `package.json` → set `name` and pin the framework tag. Use the **newest**
   `vX.Y.Z` tag, and keep it current — bump it to pick up new widgets and fixes.
   Re-run `pnpm install` after changing the pin, and commit the updated lockfile.
2. Set `site` in `astro.config.mjs` to your public origin (needed for the
   canonical link, social cards and the sitemap).
3. Edit `content/course.yaml` → identity, accent, `courseUrl`, `institution`,
   `author`, exam, formulas, glossary. Keep `schemaVersion` equal to the
   framework's `SCHEMA_VERSION` (currently **4**); a mismatch fails the build.
   The schema is strict — an unknown or misspelled key fails the build naming
   the key.
4. Replace the example sections under `content/sections/` with your modules.
5. Drop your figures, sims and any vendored exam PDFs into `public/`. No favicon
   file is needed — the favicon, all app icons and the 1200×630 share card are
   generated from the course `accent`.

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
