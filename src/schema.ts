import { z } from "zod";

/**
 * Bump this on any BREAKING schema change and document the migration in
 * MIGRATIONS.md. loadCourse (src/lib/loadCourse.ts) compares a course's
 * `schemaVersion` against this number and fails the build on a mismatch, so a
 * version skew surfaces as a clear error instead of a mysterious break.
 *
 * SemVer mapping (see CLAUDE.md): breaking schema change => MAJOR release.
 */
export const SCHEMA_VERSION = 3;

/** A single exam paper / past-exam reference (rendered by <ExamList>). */
const examPaperSchema = z.strictObject({
  label: z.string(),
  /** May be an absolute URL or a path into the course's public/ folder. */
  url: z.string().optional(),
  solutionUrl: z.string().optional(),
  date: z.coerce.date().optional(),
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
  title: z.string(), //  "Optikk"
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
    })
    .optional(),

  /** Past exam papers for <ExamList>. Additive since v1 (optional). */
  exams: z.array(examPaperSchema).default([]),

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
   * Institution / provider name (e.g. "NTNU"), used as the schema.org `provider`
   * on the overview's `Course` JSON-LD. Explicit, not derived from a URL
   * host — omit it and no provider is emitted (no guessing).
   */
  institution: z.string().optional(),

  links: z
    .array(z.strictObject({ label: z.string(), url: z.url() }))
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
   * each module page gets a footer "edit this page" deep-link built from this
   * URL + the section's file path. GitHub-style `/edit/<branch>/<path>` URLs.
   */
  repoUrl: z.url().optional(),
  /** Branch the edit links point at. */
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
      /** Note above <ExamList> when `examArchive` is set (curated selection). */
      examArchiveNote: z
        .string()
        .default(
          "Utvalget under er de mest relevante settene. Eldre eksamener finnes i det fullstendige arkivet.",
        ),
      courseLabel: z.string().default("Emneside"),
      tocLabel: z.string().default("Innhold"),
      editPageLabel: z.string().default("Rediger denne siden"),
      updatedLabel: z.string().default("Oppdatert"),
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
  summary: z.string().optional(),
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
export type FormulaEntry = z.infer<typeof formulaEntrySchema>;
export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;
