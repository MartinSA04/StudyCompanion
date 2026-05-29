# GoatCounter analytics support — design

**Date:** 2026-05-29
**Status:** Approved (brainstorming) → ready for implementation plan
**Release impact:** Additive schema field → **minor** (1.0.1 → 1.1.0). No `SCHEMA_VERSION` bump, no `MIGRATIONS.md` entry.

## Summary

Let a course opt into [GoatCounter](https://www.goatcounter.com/) — a cookieless,
privacy-friendly analytics service — by setting a single endpoint in its
`course.yaml`. When set, the framework injects GoatCounter's async `count.js` on
every page **in production builds only**. Omitting it disables analytics
entirely. This fits the same privacy-footprint thread that motivated self-hosting
fonts (ROADMAP 2.5): GoatCounter is cookieless and needs no consent banner.

## Goals

- A course enables analytics with one data-driven config value; the framework
  owns all wiring (matching the project model: course = content/config,
  framework = design/schema/pages).
- Hosted GoatCounter (`*.goatcounter.com`) support.
- No analytics in `astro dev`.
- No new third-party runtime dependency in the build (the tag references the
  GoatCounter CDN at runtime only, and only in production output).

## Non-goals (YAGNI)

- **Self-hosted GoatCounter** (custom `count.js` `src`). Hosted-only for now.
  The `analytics` namespace leaves room to add this later without a breaking
  change.
- **Other providers** (Plausible, Umami, GA, …). The `analytics` object is the
  extension point if/when wanted.
- **Consent/cookie banner.** GoatCounter is cookieless; not needed.
- **SPA pageview handling.** The guide is multi-page with full page loads, so
  GoatCounter's automatic pageview counting works as-is.
- **Custom events / `count()` calls.** Out of scope.

## Design

### 1. Schema (`src/schema.ts`) — additive

Add an optional `analytics` object to `courseSchema`:

```ts
analytics: z
  .object({
    /**
     * GoatCounter count endpoint, e.g. "https://mycode.goatcounter.com/count"
     * (must include the /count path — set verbatim, no derivation). When set,
     * the framework injects GoatCounter's async count.js on every page IN
     * PRODUCTION BUILDS ONLY. GoatCounter is cookieless; no consent banner
     * needed. Omit to disable analytics.
     */
    goatcounter: z.url().optional(),
  })
  .optional(),
```

- `z.url()` matches existing URL fields (`courseUrl`, `links[].url`, `repoUrl`)
  and fails the build on a malformed value.
- `.optional()` on the whole object (not `.prefault({})`): omitting `analytics`
  leaves it `undefined`, giving clean "unset = disabled" semantics.
- **Explicit over derived:** the endpoint is taken verbatim — the course must
  include the `/count` path. We do not auto-append it.
- No `SCHEMA_VERSION` bump (purely additive, non-breaking) and therefore no
  `MIGRATIONS.md` entry.

### 2. Injection (`src/layouts/CourseLayout.astro`)

One conditional block at the end of `<head>`, alongside the existing theme
no-flash script:

```astro
{
  import.meta.env.PROD && course.analytics?.goatcounter && (
    <script
      is:inline
      data-goatcounter={course.analytics.goatcounter}
      async
      src="https://gc.zgo.at/count.js"
    />
  )
}
```

- `is:inline` — keep Astro from bundling/transforming the third-party CDN tag;
  emit it verbatim.
- `import.meta.env.PROD` — true in `astro build`, false in `astro dev`, so the
  tag is never present in dev output. (GoatCounter also skips `localhost` by
  default; this is the belt-and-suspenders gate that keeps it out of the dev DOM
  entirely.)
- `https://gc.zgo.at/count.js` — explicit `https`, not the protocol-relative
  `//` form GoatCounter's docs show.
- `data-goatcounter` is set directly from the schema value; no `define:vars`
  needed.

`course.analytics` is already in scope via the existing
`const { course, ... } = Astro.props;` destructure.

### 3. Docs

- **`course-template/content/course.yaml`** — commented example so new courses
  discover it in the starter:

  ```yaml
  # Privacy-friendly analytics (optional). Set your GoatCounter count endpoint
  # to enable; only emitted in production builds. GoatCounter is cookieless, so
  # no consent banner is needed. The value must include the /count path.
  # analytics:
  #   goatcounter: "https://yourcode.goatcounter.com/count"
  ```

- **`AUTHORING.md`** — short subsection: the field, "must include `/count`",
  production-only behavior, cookieless/no-consent note.
- **`README.md`** — one line in the feature/config list.
- **`ROADMAP.md`** — a small "Privacy-friendly analytics (GoatCounter) — ✅ Done"
  entry, consistent with the 2.5/2.6 logging style and the privacy-footprint
  thread.

### Demo

The demo course (`content/course.yaml`) is **kept clean** — `analytics` is left
unset. Analytics has no visual surface, so it adds nothing to the kitchen-sink
screenshots, and leaving it unset keeps the demo's production build (and the
Playwright visual suite, which waits on `networkidle`) free of any external
`gc.zgo.at` request. No Playwright changes, no baseline regeneration.

## Verification

1. **Unit test — `test/schema.test.ts` (new).** Pure and deterministic, the
   layer that is actually unit-testable (the `.astro` head injection can't run
   outside the Astro/Vite pipeline — same reasoning as `test/mdx-components.test.ts`):
   - `courseSchema.parse({...minimal..., analytics: { goatcounter: "https://x.goatcounter.com/count" }})`
     yields `analytics.goatcounter === "https://x.goatcounter.com/count"`.
   - Omitting `analytics` yields `analytics === undefined`.
   - A non-URL `goatcounter` value throws (`safeParse(...).success === false`).
2. **One-off manual build grep (not committed).** Temporarily set
   `analytics.goatcounter` in the demo `content/course.yaml`, run `pnpm build`,
   and confirm `data-goatcounter` / `gc.zgo.at` appears in `dist/` HTML; confirm
   it is **absent** from `astro dev`-served HTML (the PROD gate). Then revert the
   demo edit so the demo stays clean.
3. `pnpm typecheck`, `pnpm lint`, and the existing `pnpm test` suite stay green.

## Files touched

| File | Change |
| --- | --- |
| `src/schema.ts` | Add optional `analytics.goatcounter` field |
| `src/layouts/CourseLayout.astro` | Conditional GoatCounter `<script>` in `<head>` |
| `course-template/content/course.yaml` | Commented example |
| `AUTHORING.md` | Document the field |
| `README.md` | One-line mention |
| `ROADMAP.md` | "Done" entry |
| `test/schema.test.ts` | New unit test for the field |

## Release / process notes

- **Minor** version bump (1.0.1 → 1.1.0) and a `vX.Y.Z` tag — done by the
  maintainer, not in this work.
- Per the maintainer's standing instruction, **nothing is committed**; changes
  (including this spec) are left for local verification.
