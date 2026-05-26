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
});

export const courseSchema = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  code: z.string(), //  "TFY4195"
  title: z.string(), //  "Optikk"
  subtitle: z.string().optional(),
  term: z.string(), //  "V2026"
  language: z.enum(["nb", "nn", "en"]).default("nb"),
  accent: z.string().default("#2f6df6"), // per-course theme color (any CSS color)

  /** Upcoming-exam metadata shown in the course header / sidebar. */
  exam: z
    .object({
      date: z.coerce.date().optional(),
      durationMinutes: z.number().optional(),
      format: z.string().optional(),
      aids: z.string().optional(),
    })
    .optional(),

  /** Past exam papers for <ExamList>. Additive since v1 (optional). */
  exams: z.array(examPaperSchema).default([]),

  /** Reference-sheet formulas for <FormulaSheet>. Additive since v1 (optional). */
  formulas: z.array(formulaEntrySchema).default([]),

  links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),

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
      tocLabel: z.string().default("Innhold"),
    })
    .prefault({}),
});

export const sectionSchema = z.object({
  order: z.number(),
  title: z.string(),
  summary: z.string().optional(),
  importance: z.enum(["core", "useful", "extra"]).default("useful"),
  estMinutes: z.number().optional(),
  tags: z.array(z.string()).default([]),
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
