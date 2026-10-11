# study-companion

This is study-companion: an Astro 6 integration + component library for course study guides.

- It is consumed by separate "course" repos that pin a git tag of this repo.
- Course repos contain only content; this repo owns ALL design, schema, and page wiring.
- The integration (src/index.ts) injects the page routes and sets up MDX+KaTeX.
- Schemas live in src/schema.ts; bump SCHEMA_VERSION + MIGRATIONS.md on breaking changes.
- SemVer: breaking schema=major, new field/widget=minor, fix=patch. Tag every release vX.Y.Z.
- A release is ONE commit: bump `package.json` version and the framework pin in
  `course-template/package.json` together, then tag it. `test/release.test.ts`
  asserts the two agree, so a forgotten template repin fails at that commit; CI
  and release-guard are both green at the tag. The template ships no lockfile
  (see `.gitignore`) — that is what makes the single commit possible, so don't
  reintroduce one.
- After tagging, bump the pin in every consuming course repo (except any marked
  FROZEN below). Keep all non-frozen course pins in lockstep with the latest tag.
  Consuming repos:
  - optics — `~/School/TFY4195/companion` — un-frozen 2026-08 (maintainer call):
    keep its pin in lockstep like the others. Content is V2026-based; the course
    was reworked for H2026 as «Innføring i optikk og fotonikk» (broader photonics
    scope), so only touch content when explicitly asked.
  - algdat — `~/School/TDT4120/companion`
  - klassisk mekanikk — `~/School/TFY4345/companion`
  - halvlederkomponenter — `~/School/TFE4146/companion`
  - faste stoffers fysikk — `~/School/TFY4220/companion`
  - kvantemekanikk I — `~/School/FY2045/companion`
- Never add per-course logic here. Keep everything data-driven off the schema.
- Architecture, contracts & widget reference: see README.md; planned work: see ROADMAP.md.
- Writing course prose: AUTHORING.md (mechanics) + WRITING.md (the words — reader,
  length budget, plain language, register, sim design). Both are binding on course
  repos and live ONLY here, never copied into a course. When the maintainer corrects
  prose, write the general rule into WRITING.md, not only into agent memory.
- In chat replies, write math with Unicode symbols (ṙ, ∇, ×, ∂U/∂ṙ, ⇒), never LaTeX
  source: the terminal does not render it.
- A kitchen-sink demo course lives at content/ (srcDir=demo/). Run `pnpm dev`/`pnpm build`
  to verify changes standalone; it exercises every widget in both themes.
