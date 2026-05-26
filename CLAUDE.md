This is study-companion: an Astro 5 integration + component library for course study guides.
- It is consumed by separate "course" repos that pin a git tag of this repo.
- Course repos contain only content; this repo owns ALL design, schema, and page wiring.
- The integration (src/index.ts) injects the page route and sets up MDX+KaTeX.
- Schemas live in src/schema.ts; bump SCHEMA_VERSION + MIGRATIONS.md on breaking changes.
- SemVer: breaking schema=major, new field/widget=minor, fix=patch. Tag every release vX.Y.Z.
- Never add per-course logic here. Keep everything data-driven off the schema.
- Build order & contracts: see study-companion-DESIGN.md.