import type { CollectionEntry } from "astro:content";
import type { Course } from "../schema.ts";

/**
 * Navigation model shared by the overview page, the per-module pages and the
 * layout's sidebar. The framework is multi-page: the overview lives at `/`, each
 * section at `/<slug>`, and the reference tools at their own slugs. Everything is
 * derived from content — no per-course wiring.
 */

export type NavKind = "section" | "formulas" | "flashcards" | "exams";

export interface NavItem {
  slug: string;
  /** Display number (sections) or glyph (tools). */
  num: string;
  /** Full title (module header). */
  title: string;
  /** Condensed title for the sidebar. */
  shortTitle: string;
  kind: NavKind;
  /** Only set for sections — drives the read/done checkbox + progress. */
  order?: number;
}

/** `01-foton` / `02_geo1` → `foton` / `geo1`. Falls back to the raw id. */
export function sectionSlug(id: string): string {
  return id.replace(/^\d+[-_]?/, "") || id;
}

/** Trim a long module title down for the narrow sidebar. */
export function shortTitle(title: string): string {
  return title.split("—")[0].split(",")[0].split("&")[0].split(":")[0].trim();
}

/** Tool slugs are reserved; a section may not collide with them. */
export const TOOL_SLUGS = {
  formulas: "formelsamling",
  flashcards: "flashcards",
  exams: "eksamen",
} as const;

export interface ToolFlags {
  formulas: boolean;
  flashcards: boolean;
  exams: boolean;
}

export function toolFlags(course: Course, flashcardCount: number): ToolFlags {
  return {
    formulas: course.formulas.length > 0,
    flashcards: course.features.flashcards && flashcardCount > 0,
    exams: course.exams.length > 0,
  };
}

/** The ordered module nav items (no tools). */
export function sectionNav(
  sections: CollectionEntry<"sections">[],
): NavItem[] {
  return sections.map((s) => ({
    slug: sectionSlug(s.id),
    num: String(s.data.order),
    title: s.data.title,
    shortTitle: shortTitle(s.data.title),
    kind: "section" as const,
    order: s.data.order,
  }));
}
