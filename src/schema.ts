import { z } from "zod";

/**
 * Bump this on any BREAKING schema change and document the migration in
 * MIGRATIONS.md. loadCourse (src/lib/loadCourse.ts) compares a course's
 * `schemaVersion` against this number and fails the build on a mismatch, so a
 * version skew surfaces as a clear error instead of a mysterious break.
 *
 * SemVer mapping (see CLAUDE.md): breaking schema change => MAJOR release.
 */
export const SCHEMA_VERSION = 4;

/** A single exam paper / past-exam reference (rendered by <ExamList>). */
/**
 * When an exam was held. Accepts a full `YYYY-MM-DD`, or a month-precision
 * `YYYY-MM` for a paper whose day is not published anywhere — several NTNU sets
 * are named after the semester (…_221200), not the exam day, and carry no date
 * on the paper itself. Both forms sort; only the full form renders a day, so an
 * unknown day is shown as a month instead of being guessed into existence
 * (AUTHORING.md §7).
 */
const examDateSchema = z.union([
  z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .transform((m) => ({
      value: new Date(`${m}-01T00:00:00Z`),
      precision: "month" as const,
    })),
  z.coerce.date().transform((d) => ({ value: d, precision: "day" as const })),
]);

const examPaperSchema = z.strictObject({
  label: z.string(),
  /** May be an absolute URL or a path into the course's public/ folder. */
  url: z.string().optional(),
  solutionUrl: z.string().optional(),
  date: examDateSchema.optional(),
});

/** A reference-sheet formula entry (rendered by <FormulaSheet>). */
const formulaEntrySchema = z.strictObject({
  tex: z.string(),
  label: z.string().optional(),
  /** Free-text grouping, e.g. a section title. */
  section: z.string().optional(),
  /** Is this on the provided exam formula sheet? */
  onSheet: z.boolean().default(true),
  /** Must be memorized (not on the sheet) — gets a "må pugges" badge. */
  memorize: z.boolean().default(false),
  /**
   * Stable anchor id for deep-linking from prose via `<FormulaRef id>`. When set,
   * the formula's row in the sheet becomes a `#id` target. Must be unique.
   */
  id: z
    .string()
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'A formula id is emitted verbatim as a DOM id and a <FormulaRef> "#fragment", so it must be ASCII letters, digits, "-" or "_" (e.g. "snells" or "thin-lens") — no spaces, punctuation or math.',
    )
    .optional(),
});

/** A glossary term + definition (rendered by <Glossary>, linked by <Term>). */
const glossaryEntrySchema = z.strictObject({
  term: z.string(),
  /** May contain `$inline$` math and simple inline HTML. */
  definition: z.string(),
  /** Free-text grouping, e.g. a section title. */
  section: z.string().optional(),
});

// strictObject everywhere (v3): an unknown or typo'd key fails the build naming
// the key, instead of being silently ignored and "not working".
export const courseSchema = z.strictObject({
  /**
   * The schema version this course's content was written against. DELIBERATELY
   * no default: defaulting to the framework's own SCHEMA_VERSION would make the
   * version-skew guard in loadCourse vacuous — a course that omitted the field
   * would always "match", and a real skew would surface as a mysterious break
   * instead of the guard's clear migrate/bump-the-pin error.
   */
  schemaVersion: z.int().positive(),
  code: z.string(), //  "TFY4195"
  /**
   * "Optikk". May carry soft hyphens (U+00AD) to choose where a long compound
   * wraps on a phone — `title: "Halvleder\xADkomponenter"` in YAML. They are
   * display-only: `lib/text.ts` `plain()` strips them everywhere the title
   * becomes machine-read data. See AUTHORING.md §6.
   */
  title: z.string(),
  /** Same soft-hyphen convention as `title`. */
  subtitle: z.string().optional(),
  term: z.string(), //  "V2026"
  language: z.enum(["nb", "nn", "en"]).default("nb"),
  /** Brand accent for LIGHT mode (any CSS color). */
  accent: z.string().default("#205ea6"),
  /**
   * Brand accent for DARK mode. Defaults to `accent`. Set a lighter/brighter
   * shade so accent text, links and labels stay legible on dark surfaces — the
   * framework uses exactly this value (no auto-derivation), so each course
   * controls how its brand reads in each theme.
   */
  accentDark: z.string().optional(),

  /** Upcoming-exam metadata shown in the course header / sidebar. */
  exam: z
    .strictObject({
      date: z.coerce.date().optional(),
      /** Exam start time as a VERBATIM string (e.g. "09:00") — never a Date; a
       *  time-of-day Date would reintroduce the UTC-midnight print bug lib/dates.ts guards. */
      time: z.string().optional(),
      durationMinutes: z.number().optional(),
      format: z.string().optional(),
      aids: z.string().optional(),
      /**
       * Link to the OFFICIAL formula sheet handed out at the exam — distinct
       * from the guide's own Formelsamling. Prefer the university-hosted PDF
       * when one exists; only if it does not, vendor the PDF in the course's
       * `public/` and point here at that path. May be an absolute URL or a
       * `public/` path (same convention as `exams[].url`).
       */
      formulaSheetUrl: z.string().optional(),
      /**
       * Does the exam hand out a formula sheet at all? Default `true`. Set
       * `false` for closed-book / no-aids exams: the Formelsamling page then
       * shows a clear "no sheet is provided" notice and drops the
       * on-sheet/must-memorize chips and per-row badges (they are meaningless
       * when nothing is on a sheet — everything must be known). Prefer this over
       * marking every `formulas[]` entry `onSheet: false` / `memorize: true`.
       */
      formulaSheet: z.boolean().default(true),
      /** Portal that owns the authoritative exam facts. Every surface that renders
       *  exam facts also renders ui.examAuthorityNote linking here. */
      authorityUrl: z
        .url()
        .default("https://fsweb.no/studentweb/login.jsf?inst=FSNTNU"),
    })
    .optional(),

  /** Past exam papers for <ExamList>. Additive since v1 (optional). */
  exams: z.array(examPaperSchema).default([]),

  /** Dated coursework (øvinger, prosjekt, vurderinger) for the overview agenda. */
  deadlines: z
    .array(
      z.strictObject({
        title: z.string(),
        date: z.coerce.date(),
        /** Optional context line, e.g. "Innlevering i Blackboard". */
        note: z.string().optional(),
        url: z.url().optional(),
      }),
    )
    .default([]),

  /**
   * Link to the official, COMPLETE past-exam archive (e.g. the institute's
   * arkiv page). When set, the Eksamen page shows a short note that `exams[]`
   * is a curated selection and appends an "open the full archive" row to the
   * list. Use when you hand-pick the most relevant papers but more exist.
   */
  examArchive: z
    .strictObject({
      url: z.url(),
      label: z.string().default("Hele eksamensarkivet"),
    })
    .optional(),

  /** Reference-sheet formulas for <FormulaSheet>. Additive since v1 (optional). */
  formulas: z.array(formulaEntrySchema).default([]),

  /** Glossary terms for the <Glossary> tool page + inline <Term> links. */
  glossary: z.array(glossaryEntrySchema).default([]),

  /**
   * Canonical link to the OFFICIAL university course page (e.g. the NTNU
   * emneside). Distinct from the free-form `links` list: it has one consistent
   * home (the overview hero + footer) so its placement never drifts between
   * courses. Setting it is part of the per-course definition-of-done (AUTHORING).
   */
  courseUrl: z.url().optional(),

  /**
   * URL of the reader's course-hub site (the directory of all their study
   * guides). When set, the sidebar gets an "up" link above «Oversikt» back to
   * that hub. Deliberately just a URL: the hub itself owns the course list
   * (live, redeployed on push), so no sibling-course data is ever baked into a
   * pinned course build where it would go stale.
   */
  hubUrl: z.url().optional(),

  /**
   * Institution / provider name (e.g. "NTNU"), used as the schema.org `provider`
   * of the OFFICIAL course this guide is `about`. Explicit, not derived from a
   * URL host — omit it and no provider is emitted (no guessing).
   *
   * Note the claim it makes: the provider sits on the referenced course, never
   * on this site. A study guide is `about` a course; it is not the course, and
   * naming the institution as ITS provider would assert an institutional
   * authorship the footer disclaimer explicitly denies. See lib/jsonLd.ts.
   */
  institution: z.string().optional(),

  /**
   * Who wrote this guide. Drives the schema.org `author` on every page's
   * JSON-LD (via a shared `@id`, so the graph connects) and
   * `<meta name="author">`. Explicit only — omit it and no author is emitted,
   * the same no-guessing rule `institution` follows.
   */
  author: z.string().optional(),

  /** Optional URL identifying `author` (personal site, GitHub profile, …). */
  authorUrl: z.url().optional(),

  links: z
    .array(
      z.strictObject({
        label: z.string(),
        url: z.url(),
        /** Optional grouping for the sidebar Lenker list (groupBySection idiom). */
        group: z.string().optional(),
        /** Optional muted one-line description under the link. */
        note: z.string().optional(),
      }),
    )
    .default([]),

  /**
   * Optional SEO / social-card metadata. Additive: omit the object and every
   * value below falls back to data derived from the rest of `course.yaml`
   * (title, subtitle, accent, language). Absolute-URL features additionally
   * need `site` in astro.config.mjs.
   */
  seo: z
    .strictObject({
      /**
       * X / Twitter handle (with or without a leading "@") for
       * `twitter:site` / `twitter:creator` on the social card.
       */
      twitter: z.string().optional(),
    })
    .optional(),

  /**
   * Privacy-friendly analytics. Optional and additive: omit the whole object to
   * disable analytics entirely. The framework owns the wiring; a course only
   * provides the endpoint here.
   */
  analytics: z
    .strictObject({
      /**
       * GoatCounter count endpoint, e.g. "https://mycode.goatcounter.com/count"
       * — must include the /count path (taken verbatim, no derivation). When
       * set, the framework injects GoatCounter's async count.js on every page IN
       * PRODUCTION BUILDS ONLY (never in `astro dev`). GoatCounter is cookieless,
       * so no consent banner is needed.
       */
      goatcounter: z.url().optional(),
    })
    .optional(),

  /**
   * Source repository for THIS course's content (not the framework). When set,
   * each module page gets a «Foreslå endring» deep-link to the repo's new-issue
   * route (GitHub-style `/issues/new?title=…&body=…`), prefilled with the page
   * and its source file — an issue needs no fork, unlike GitHub's `/edit/`
   * route, which walls non-collaborators behind a fork prompt. Also drives the
   * footer's plain report-an-error issue link.
   */
  repoUrl: z.url().optional(),
  /** Branch the prefilled issue's source-file (`blob/`) link points at. */
  repoBranch: z.string().default("main"),

  features: z
    .strictObject({
      progress: z.boolean().default(true),
      search: z.boolean().default(true),
      flashcards: z.boolean().default(false),
      theme: z.boolean().default(true),
    })
    // prefault (not default) so omitting `features` entirely still applies the
    // inner per-flag defaults above. Zod 4's plain .default({}) would yield {}.
    .prefault({}),

  /** UI string overrides for localizing the chrome. */
  ui: z
    .strictObject({
      progressLabel: z.string().default("Fremgang"),
      searchLabel: z.string().default("Søk"),
      resetLabel: z.string().default("Nullstill"),
      skipToContent: z.string().default("Hopp til innhold"),
      flashcardsLabel: z.string().default("Flashcards"),
      /** Rate a card known — raises its level (it surfaces later). */
      knownLabel: z.string().default("Kan"),
      /** Rate a card for review — resets its level (it surfaces sooner). */
      reviewLabel: z.string().default("Øv"),
      /** Flip the active card between front and back. */
      flipLabel: z.string().default("Snu"),
      examsLabel: z.string().default("Eksamen"),
      formulaSheetLabel: z.string().default("Formelsamling"),
      officialFormulaSheetLabel: z
        .string()
        .default("Offisiell formelsamling til eksamen"),
      /**
       * Notice shown atop the Formelsamling page when `exam.formulaSheet` is
       * `false` (the exam provides no sheet). Override per course for `nn`/`en`.
       */
      noFormulaSheetNote: z
        .string()
        .default(
          "Til eksamen i dette emnet deles det ikke ut noen formelsamling. Oversikten under er en studieressurs: på eksamen må alt kunnes uten hjelpemidler.",
        ),
      /** Placeholder for the Formelsamling search field. */
      sheetSearchPlaceholder: z.string().default("Søk i formler og symboler …"),
      /** Accessible name (aria-label) for the Formelsamling search field. */
      sheetSearchLabel: z.string().default("Søk i formler"),
      /** Filter chip: only formulas that ARE on the exam sheet. */
      onSheetLabel: z.string().default("På formelarket"),
      /** Filter chip + per-row badge: off-sheet formulas that must be memorized. */
      memorizeLabel: z.string().default("Må pugges"),
      /** Empty state when no formula matches the sheet search. */
      sheetEmptyLabel: z.string().default("Ingen formler matcher søket."),
      /** Heading for section-less formulas when the sheet is otherwise grouped. */
      formulaSheetOtherGroupLabel: z.string().default("Andre formler"),
      glossaryLabel: z.string().default("Begreper"),
      /** Placeholder for the Begreper search field. */
      glossarySearchPlaceholder: z.string().default("Søk i begreper …"),
      /** Accessible name (aria-label) for the Begreper search field. */
      glossarySearchLabel: z.string().default("Søk i begreper"),
      /** Empty state when no glossary term matches the search. */
      glossaryEmptyLabel: z.string().default("Ingen begreper matcher søket."),
      /** Heading for section-less terms when the glossary is otherwise grouped. */
      glossaryOtherGroupLabel: z.string().default("Andre begreper"),
      /** Heading for group-less links when the sidebar Lenker list is otherwise grouped. */
      linksOtherGroupLabel: z.string().default("Andre lenker"),
      /** Note above <ExamList> when `examArchive` is set (curated selection). */
      examArchiveNote: z
        .string()
        .default(
          "Utvalget under er de mest relevante settene. Eldre eksamener finnes i det fullstendige arkivet.",
        ),
      /** Muted link to exam.authorityUrl rendered on every exam-facts surface. */
      examAuthorityNote: z.string().default("Offisiell eksamensinfo"),
      /** Heading for the dated-coursework agenda block on the overview. */
      deadlinesLabel: z.string().default("Frister"),
      /**
       * DEPRECATED (unused since the almanac-leaf agenda replaced the "Neste
       * frist: …" lede; the next deadline is now marked in the list itself).
       * Kept because removing a ui key is a breaking schema change.
       */
      nextDeadlineLabel: z.string().default("Neste frist"),
      courseLabel: z.string().default("Emneside"),
      /** Sidebar "up" link to the course hub (only rendered when `hubUrl` is set). */
      hubLinkLabel: z.string().default("Alle emner"),
      tocLabel: z.string().default("Innhold"),
      editPageLabel: z.string().default("Foreslå endring"),
      /**
       * Report-an-error link (→ `${repoUrl}/issues/new`, only rendered when
       * repoUrl is set). Rendered as a link directly after `footerDisclaimer`,
       * so the disclaimer + link pair reads as one flowing note.
       */
      reportIssueLabel: z.string().default("Meld fra om eventuelle feil her."),
      /**
       * Always-rendered footer disclaimer (renders even without repoUrl). Must
       * stand alone as a complete sentence when repoUrl is unset (no link joins it).
       */
      footerDisclaimer: z.string().default("Merk at siden kan inneholde feil."),
      updatedLabel: z.string().default("Oppdatert"),
      /**
       * Screen-reader prefix on a `<Video>` facade, so the link announces as an
       * action ("Spill av: <title>") rather than as a bare title. Visually
       * hidden — the play glyph carries it for sighted readers.
       */
      videoPlayLabel: z.string().default("Spill av"),

      /**
       * `<meta name="description">` for the four tool pages, each composed as
       * `"<phrase> — <code> <title>"`. They exist because the tool pages
       * otherwise shared one `"<Label> — <Course title>"` boilerplate, giving
       * four pages per site the same duplicate description. Phrase the override
       * to describe the PAGE, not the course; the course half is appended.
       *
       * Unlike the other `ui` strings these carry NO terminal punctuation — a
       * full stop immediately before the appended " — …" reads as a typo.
       */
      formulaSheetMetaDesc: z
        .string()
        .default("Alle formler og symboler fra emnet samlet på én søkbar side"),
      glossaryMetaDesc: z
        .string()
        .default("Alle sentrale begreper fra emnet, forklart og søkbare"),
      flashcardsMetaDesc: z
        .string()
        .default(
          "Øv med flashcards på sentrale begreper og resultater fra emnet",
        ),
      examsMetaDesc: z
        .string()
        .default("Tidligere eksamensoppgaver med løsningsforslag"),
    })
    .prefault({}),
});

export const sectionSchema = z.strictObject({
  order: z.number(),
  /**
   * Display label shown in the sidebar, overview tile and module header.
   * Defaults to the zero-padded `order` (e.g. 4 → "04"); override for special
   * modules, e.g. `num: "RT"` for a ray-tracing interlude.
   */
  num: z.string().optional(),
  title: z.string(),
  /**
   * One-sentence description of the module. REQUIRED (SCHEMA_VERSION 4): it is
   * the module's `<meta name="description">`, its Open Graph description and
   * its JSON-LD `description`, so an absent one meant every module shipped the
   * same `"<Title> — <Course title>"` boilerplate — duplicate meta descriptions
   * across a whole guide, and nothing for a search engine to build a snippet
   * from. Write it for a reader deciding whether to open the module.
   */
  summary: z.string(),
  importance: z.enum(["core", "useful", "extra"]).default("useful"),
  /**
   * Short kicker label shown on the module's overview tile (e.g. a week or
   * theme marker like "Uke 3" or "Interaktivt"). It renders NOWHERE else — not
   * in the sidebar, module header or search — so keep it a single glanceable
   * word or two, or omit it.
   */
  tag: z.string().optional(),
  /**
   * Optional chapter grouping, e.g. "Del 1: Geometrisk optikk". When any section
   * sets a `part`, the sidebar and overview group modules under part headers (in
   * `order`); part-less sections fall back to a generic "Moduler" group. Absent
   * everywhere → today's flat list. Global numbering is unaffected.
   */
  part: z.string().optional(),
  /** Last-updated date, shown as a freshness line in the module footer. */
  updated: z.coerce.date().optional(),
  /**
   * Keep this module out of search results: emits
   * `<meta name="robots" content="noindex">` and drops it from the sitemap
   * and Open Graph. The page is still built and linked in-site — only crawlers
   * are told to skip it. Use for low-value or duplicate pages.
   */
  noindex: z.boolean().default(false),
  /**
   * Hide this module from a PRODUCTION build: dropped from the nav, the overview
   * and routing (no page emitted), and from the sitemap. Stays fully visible in
   * `astro dev` so you can keep drafting it. Use to publish a guide before every
   * module is finished. Additive optional field → backward-compatible.
   */
  draft: z.boolean().default(false),
});

export const flashcardsSchema = z.strictObject({
  cards: z.array(
    z.strictObject({
      front: z.string(),
      back: z.string(),
      section: z.string().optional(),
      tags: z.array(z.string()).default([]),
    }),
  ),
});

export type Course = z.infer<typeof courseSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Flashcards = z.infer<typeof flashcardsSchema>;
export type ExamPaper = z.infer<typeof examPaperSchema>;
export type ExamDate = z.infer<typeof examDateSchema>;
export type FormulaEntry = z.infer<typeof formulaEntrySchema>;
export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;
