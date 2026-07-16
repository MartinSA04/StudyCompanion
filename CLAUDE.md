# study-companion

This is study-companion: an Astro 6 integration + component library for course study guides.

- It is consumed by separate "course" repos that pin a git tag of this repo.
- Course repos contain only content; this repo owns ALL design, schema, and page wiring.
- The integration (src/index.ts) injects the page routes and sets up MDX+KaTeX.
- Schemas live in src/schema.ts; bump SCHEMA_VERSION + MIGRATIONS.md on breaking changes.
- SemVer: breaking schema=major, new field/widget=minor, fix=patch. Tag every release vX.Y.Z.
- On every release: bump `package.json` version, then update the framework pin to
  the newest tag in `course-template/` (and regenerate `course-template/pnpm-lock.yaml`
  so the committed lockfile matches the new pin — `pnpm install --lockfile-only`
  in the template; this regen necessarily happens after the tag push, so the
  tagged tree always carries the previous template lockfile — copy the template
  from main, not a tag) AND every consuming course repo (except any marked FROZEN
  below). Keep all non-frozen course pins in lockstep with the latest tag.
  Consuming repos:
  - optics — `~/School/TFY4195/companion` — **FROZEN**: course is complete; do NOT
    bump its pin, apply schema migrations, or edit content (stays on v1.4.0 /
    schemaVersion 1) unless explicitly asked.
  - algdat — `~/School/TDT4120/companion`
  - klassisk mekanikk — `~/School/TFY4345/companion`
  - halvlederkomponenter — `~/School/TFE4146/companion`
  - faste stoffers fysikk — `~/School/TFY4220/companion`
  - kvantemekanikk I — `~/School/FY2045/companion`
- Never add per-course logic here. Keep everything data-driven off the schema.
- Architecture, contracts & widget reference: see README.md; planned work: see ROADMAP.md.
- A kitchen-sink demo course lives at content/ (srcDir=demo/). Run `pnpm dev`/`pnpm build`
  to verify changes standalone; it exercises every widget in both themes.
