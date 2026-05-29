import { z } from "zod";

/**
 * Bump this on any BREAKING schema change and document the migration in
 * MIGRATIONS.md. The injected page (src/pages/index.astro) compares a course's
 * `schemaVersion` against this number and fails the build on a mismatch, so a
 * version skew surfaces as a clear error instead of a mysterious break.
 *
 * SemVer mapping (see CLAUDE.md): breaking schema change => MAJOR release.
 */
export const SCHEMA_VERSION = 1;

/** A single exam paper / past-exam reference (rendered by <ExamList>). */
const examPaperSchema = z.object({
  label: z.string(),
  /** May be an absolute URL or a path into the course's public/ folder. */
  url: z.string().optional(),
  solutionUrl: z.string().optional(),
  date: z.coerce.date().optional(),
});

/** A reference-sheet formula entry (rendered by <FormulaSheet>). */
const formulaEntrySchema = z.object({
  tex: z.string(),
  label: z.string().optional(),
  /** Free-text grouping, e.g. a section title. */
  section: z.string().optional(),
  /** Is this on the provided exam formula sheet? */
  onSheet: z.boolean().default(true),
  /** Must be memorized (not on the sheet) — gets a ★ badge. */
  memorize: z.boolean().default(false),
  /**
   * Stable anchor id for deep-linking from prose via `<FormulaRef id>`. When set,
   * the formula's row in the sheet becomes a `#id` target. Must be unique.
   */
  id: z.string().optional(),
});

/** A glossary term + definition (rendered by <Glossary>, linked by <Term>). */
const glossaryEntrySchema = z.object({
  term: z.string(),
  /** May contain `$inline$` math and simple inline HTML. */
  definition: z.string(),
  /** Free-text grouping, e.g. a section title. */
  section: z.string().optional(),
});

export const courseSchema = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  code: z.string(), //  "TFY4195"
  title: z.string(), //  "Optikk"
  subtitle: z.string().optional(),
  term: z.string(), //  "V2026"
  language: z.enum(["nb", "nn", "en"]).default("nb"),
  /** Brand accent for LIGHT mode (any CSS color). */
  accent: z.string().default("#2f6df6"),
  /**
   * Brand accent for DARK mode. Defaults to `accent`. Set a lighter/brighter
   * shade so accent text, links and labels stay legible on dark surfaces — the
   * framework uses exactly this value (no auto-derivation), so each course
   * controls how its brand reads in each theme.
   */
  accentDark: z.string().optional(),

  /** Upcoming-exam metadata shown in the course header / sidebar. */
  exam: z
    .object({
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
    })
    .optional(),

  /** Past exam papers for <ExamList>. Additive since v1 (optional). */
  exams: z.array(examPaperSchema).default([]),

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

  links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),

  /**
   * Source repository for THIS course's content (not the framework). When set,
   * each module page gets a footer "edit this page" deep-link built from this
   * URL + the section's file path. GitHub-style `/edit/<branch>/<path>` URLs.
   */
  repoUrl: z.url().optional(),
  /** Branch the edit links point at. */
  repoBranch: z.string().default("main"),

  features: z
    .object({
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
    .object({
      progressLabel: z.string().default("Fremgang"),
      searchLabel: z.string().default("Søk"),
      resetLabel: z.string().default("Nullstill"),
      skipToContent: z.string().default("Hopp til innhold"),
      flashcardsLabel: z.string().default("Flashcards"),
      examsLabel: z.string().default("Eksamen"),
      formulaSheetLabel: z.string().default("Formelsamling"),
      officialFormulaSheetLabel: z
        .string()
        .default("Offisiell formelsamling til eksamen"),
      glossaryLabel: z.string().default("Begreper"),
      courseLabel: z.string().default("Emneside"),
      tocLabel: z.string().default("Innhold"),
      editPageLabel: z.string().default("Rediger denne siden"),
      updatedLabel: z.string().default("Oppdatert"),
    })
    .prefault({}),
});

export const sectionSchema = z.object({
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
  estMinutes: z.number().optional(),
  tags: z.array(z.string()).default([]),
  /**
   * Optional chapter grouping, e.g. "Del 1: Geometrisk optikk". When any section
   * sets a `part`, the sidebar and overview group modules under part headers (in
   * `order`); part-less sections fall back to a generic "Moduler" group. Absent
   * everywhere → today's flat list. Global numbering is unaffected.
   */
  part: z.string().optional(),
  /** Last-updated date, shown as a freshness line in the module footer. */
  updated: z.coerce.date().optional(),
});

export const flashcardsSchema = z.object({
  cards: z.array(
    z.object({
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
