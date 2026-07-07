# study-companion

This is study-companion: an Astro 6 integration + component library for course study guides.

- It is consumed by separate "course" repos that pin a git tag of this repo.
- Course repos contain only content; this repo owns ALL design, schema, and page wiring.
- The integration (src/index.ts) injects the page routes and sets up MDX+KaTeX.
- Schemas live in src/schema.ts; bump SCHEMA_VERSION + MIGRATIONS.md on breaking changes.
- SemVer: breaking schema=major, new field/widget=minor, fix=patch. Tag every release vX.Y.Z.
- On every release: bump `package.json` version, then update the framework pin to
  the newest tag in `course-template/` AND every consuming course repo. Keep all
  course pins in lockstep with the latest tag. Consuming repos:
  - optics — `~/School/TFY4195/companion`
  - algdat — `~/School/TDT4120/companion`
  - klassisk mekanikk — `~/School/TFY4345/companion`
  - halvlederkomponenter — `~/School/TFE4146/companion`
  - faste stoffers fysikk — `~/School/TFY4220/companion`
  - kvantemekanikk I — `~/School/FY2045/companion`
- Never add per-course logic here. Keep everything data-driven off the schema.
- Architecture, contracts & widget reference: see README.md; planned work: see ROADMAP.md.
- A kitchen-sink demo course lives at content/ (srcDir=demo/). Run `pnpm dev`/`pnpm build`
  to verify changes standalone; it exercises every widget in both themes.
