import type { Section } from "../schema.ts";

/** The three pensum tiers (mirrors `sectionSchema.importance`). */
export type Importance = Section["importance"];

/**
 * Norwegian default labels for the importance tiers. Single source of truth so
 * the module header, overview tiles and `<ImportanceTag>` never disagree.
 */
export const IMPORTANCE_LABELS: Record<Importance, string> = {
  core: "Kjernepensum",
  useful: "Pensum",
  extra: "Tilleggsstoff",
};
