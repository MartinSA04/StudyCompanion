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

/**
 * Display numbers for the ordered sections, keyed by section id. Modules with
 * an explicit `num` override (e.g. ray tracing → "RT") keep that label and do
 * NOT consume a slot in the running counter, so the auto-numbered modules stay
 * gap-free: 01, 02, 03, RT, 04, 05 … rather than 01, 02, 03, RT, 05.
 *
 * Single source of truth so the sidebar, overview tiles and module header never
 * disagree. Callers pass the full section list (any order — sorted here).
 */
export function sectionNumbers(
  sections: { id: string; data: { order: number; num?: string } }[],
): Map<string, string> {
  const ordered = [...sections].sort((a, b) => a.data.order - b.data.order);
  const map = new Map<string, string>();
  let n = 0;
  for (const s of ordered) {
    if (s.data.num != null && s.data.num !== "") {
      map.set(s.id, s.data.num);
    } else {
      n += 1;
      map.set(s.id, String(n).padStart(2, "0"));
    }
  }
  return map;
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
  const nums = sectionNumbers(sections);
  return sections.map((s) => ({
    slug: sectionSlug(s.id),
    num: nums.get(s.id) ?? String(s.data.order).padStart(2, "0"),
    title: s.data.title,
    shortTitle: shortTitle(s.data.title),
    kind: "section" as const,
    order: s.data.order,
  }));
}
