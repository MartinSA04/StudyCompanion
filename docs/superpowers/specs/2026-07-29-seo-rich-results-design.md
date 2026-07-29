# SEO + rich results — design

_2026-07-29. Ships as **v4.0.0** (`SCHEMA_VERSION` 4)._

## Problem

The course sites carry a solid SEO baseline — canonical URLs, Open Graph,
Twitter cards, `noindex`, a `lastmod` sitemap, `robots.txt`, and JSON-LD for
`Course` / `LearningResource` / `DefinedTermSet` / `BreadcrumbList`. Three real
gaps remain:

1. **The hub is invisible.** `hub/pages/index.astro` emits only `<title>`, a
   description and a data-URI favicon. No canonical, no Open Graph, no Twitter
   card, no JSON-LD, no `sitemap.xml`, no `robots.txt`. It is the front door to
   all six guides and shares as a bare link.
2. **No practice-problem structured data.** `<Quiz>` and the flashcards deck are
   exactly the content Google's Education Q&A rich result (`schema.org/Quiz`)
   exists for, and neither emits any.
3. **The structured data misrepresents authorship.** `src/pages/index.astro`
   declares the site _is_ an NTNU `Course`, with NTNU as `provider`, while the
   visible footer disclaims exactly that authority.

Plus one content-quality issue: sections without a `summary` fall back to
`"<Title> — <Course title>"`, producing near-duplicate meta descriptions.

Out of scope: the deferred `satori` 1200×630 OG image generator stays on
ROADMAP. Shares keep today's square-icon `summary` card.

## 1 · Hub SEO parity

**`hub/pages/index.astro`** — head gains `rel=canonical`, the full `og:*` set
(`type`, `title`, `description`, `url`, `site_name`, `locale=nb_NO`, `image` +
`image:width`/`height`/`type`/`alt`), `twitter:card=summary` with title /
description / image, `theme-color`, `color-scheme`, `generator`, and real
`icon` + `apple-touch-icon` links.

**`hub/pages/robots.txt.ts`** and **`hub/pages/sitemap.xml.ts`** — new
prerendered endpoints mirroring the course versions. The hub is a one-pager, so
the sitemap holds a single `<loc>`; it exists so `robots.txt` has something
standard to point at and so future hub routes are covered by construction.

**Icons.** The hub uses plain Astro with no integration, so it has no
rasterized icon to serve as `og:image`. The `sharp` block inside
`generateAppIcons` (`src/index.ts`) is extracted into a reusable
`rasterizeIcons(accent, outDir)` helper in `src/lib/` — `generateAppIcons` calls
it, and a small inline integration in `astro.config.hub.mjs` calls it with the
hub's own `#205ea6` to emit `icon-512.png` + `apple-touch-icon.png`. No hub
manifest: that is PWA surface, not SEO.

**JSON-LD**, one block. The `Person` is embedded rather than split into a second
top-level script: a bare `{"@id"}` reference needs a node that defines it, and a
standalone node would have to restate `@context` to be valid on its own. The
shared `@id` still joins it to each course site's author.

```jsonc
{ "@context": "https://schema.org", "@type": "CollectionPage",
  "@id": "https://kurs.martinsundal.no/#page",
  "name": "Studieguider", "description": "…", "inLanguage": "nb",
  "url": "https://kurs.martinsundal.no/",
  "author": { "@type": "Person",
              "@id": "https://kurs.martinsundal.no/#author",
              "name": "Martin Sundal" },
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 6,
    "itemListElement": [
      { "@type": "ListItem", "position": 1,
        "item": { "@type": "LearningResource",
                  "name": "TDT4120 Algoritmer og datastrukturer",
                  "learningResourceType": "Study guide",
                  "url": "https://algdat.martinsundal.no",
                  "about": { "@type": "Course", "name": "Algoritmer og datastrukturer",
                             "courseCode": "TDT4120" } } } ] } }
```

Known limitation, accepted: an `ItemList` whose items are **off-site** URLs will
not win a Google carousel (carousels require same-site items). The value is
entity disambiguation — it tells Google what the hub is and binds the six
course sites into one graph.

## 2 · Honest entity modelling

`courseLd` is replaced by **`studyGuideLd`**: the overview becomes a
`LearningResource` _about_ the course, rather than claiming to be it.

```jsonc
{ "@type": "LearningResource",
  "@id": "https://algdat.martinsundal.no/#guide",
  "name": "TDT4120 Algoritmer og datastrukturer",
  "learningResourceType": "Study guide",
  "author": { "@id": "…/#author" },
  "about": { "@type": "Course", "name": "Algoritmer og datastrukturer",
             "courseCode": "TDT4120",
             "url": "<courseUrl>",
             "provider": { "@type": "Organization", "name": "NTNU" } } }
```

The `provider` claim moves onto the _referenced_ course, where it is true, and
off the site itself. A `courseRef()` helper builds that inner object and is
shared with the per-section markup.

`learningResourceLd` gains `about` (the same course reference, so `TDT4120`
queries connect to every module), `learningResourceType`, and `author`.
`isPartOf` points at the guide's `@id` rather than re-declaring a `Course`.

Stable `@id`s (`<site>/#guide`, `<site>/#author`) mean the per-page objects form
one connected graph instead of disconnected fragments.

**Schema additions** — two optional top-level `course.yaml` fields beside
`institution`:

- `author` — person/organisation name; drives JSON-LD `author` and
  `<meta name="author">` (closing a ROADMAP long-tail item).
- `authorUrl` — optional URL for that author.

Omitted → nothing is emitted, matching the existing "explicit, never guessed
from a URL host" rule that governs `institution`.

## 3 · Practice-problem rich results

### `<Quiz>` — component-inline

`Quiz.astro` emits its own `<script type="application/ld+json">` beside the
form:

```jsonc
{ "@type": "Quiz", "about": { "@type": "Course", "courseCode": "TDT4120" },
  "hasPart": { "@type": "Question", "eduQuestionType": "Multiple choice",
    "text": "…",
    "suggestedAnswer": [ { "@type": "Answer", "text": "<wrong option>" } ],
    "acceptedAnswer": { "@type": "Answer", "text": "<correct option>",
                        "comment": { "@type": "Comment", "text": "<explanation>" } } } }
```

**Why component-inline rather than a page-level aggregate.** Quiz instances live
inside MDX bodies rendered through `<Content />`, so page frontmatter cannot see
them without a new remark/rehype pass over the MDX AST. Component-inline is ~10
lines, cannot drift from what is actually rendered, and JSON-LD in `<body>` is
fully supported by Google. The cost is N `Quiz` objects on a page instead of one
`Quiz` with N `hasPart` — Google accepts both. Revisit only if an aggregate is
ever actually needed.

`question`, `options` and `explanation` run through the existing `stripInline`
so KaTeX delimiters and inline HTML never reach the structured data. Course
context comes from `loadCourse()`, following the precedent already set by
`FormulaRef.astro` and `Term.astro`.

### Flashcards — page-level

The flashcards tool page in `[slug].astro` emits **one** `Quiz` whose `hasPart`
is one `Question` per card with `eduQuestionType: "Flashcard"`, `text` = front,
`acceptedAnswer` = back. Built from `flashcards.yaml`, where full course context
already exists.

**Capped at 100 questions**, with a build log line naming the count when it
truncates. The page already ships every card in the DOM; an uncapped 300-card
deck would roughly double that page's HTML weight for no additional ranking
benefit.

## 4 · Descriptions

**`summary` becomes required** in `sectionSchema`. Every section across all five
non-frozen consumers already has one and optics is frozen on `schemaVersion` 1,
so no content migration is needed — it simply becomes impossible to author a
summary-less module. This is the breaking change that makes the release a major.

The `d.summary ?? …` fallback in `[slug].astro` collapses to `d.summary`.

**Tool pages** get distinct descriptions instead of the shared
`"<Label> — <Course title>"` boilerplate, via four new `ui` keys carrying
Norwegian defaults (the established override pattern), composed as
`"<phrase> — <code> <title>"`. The phrases carry no terminal full stop: one
immediately before the appended `" — …"` reads as a typo.

| key                    | default                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `formulaSheetMetaDesc` | `Alle formler og symboler fra emnet samlet på én søkbar side`     |
| `glossaryMetaDesc`     | `Alle sentrale begreper fra emnet, forklart og søkbare`           |
| `flashcardsMetaDesc`   | `Øv med flashcards på sentrale begreper og resultater fra emnet`  |
| `examsMetaDesc`        | `Tidligere eksamensoppgaver med løsningsforslag`                  |

## 5 · Smaller fixes

- `og:image:width` / `height` / `type` on course pages (512 / 512 / `image/png`).
- Sitemap `/` entry gains a `lastmod` derived from the newest section `updated`.
- `<meta name="author">` when `author` is set.

## 6 · Testing

Extends `test/jsonLd.test.ts`, `test/seo.test.ts`, `test/hub.test.ts` and
`test/schema.test.ts`. New coverage: `studyGuideLd` / `courseRef` shape and
`@id` wiring, the quiz + flashcard builders (including `stripInline` handling of
KaTeX and the 100-card cap), the now-required `summary`, and the hub's ItemList
construction.

No visual-snapshot churn is expected: JSON-LD is invisible and the hub changes
are head-only.

## 7 · Release

`SCHEMA_VERSION` → 4, a `MIGRATIONS.md` entry (a no-op migration in practice:
"ensure every section has a `summary`"), `package.json` → **4.0.0**, tag
`v4.0.0`. Then the framework pin moves in lockstep across `course-template/`
(with a regenerated lockfile) and the five non-frozen consumer repos. Optics
stays frozen at v1.4.0 / `schemaVersion` 1.
