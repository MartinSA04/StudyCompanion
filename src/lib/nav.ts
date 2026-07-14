import type { CollectionEntry } from "astro:content";
import type { Course } from "../schema.ts";
import type { Importance } from "./importance.ts";

/**
 * Navigation model shared by the overview page, the per-module pages and the
 * layout's sidebar. The framework is multi-page: the overview lives at `/`, each
 * section at `/<slug>`, and the reference tools at their own slugs. Everything is
 * derived from content — no per-course wiring.
 */

/**
 * One module (section) row in the sidebar nav. Tool rows are built separately
 * in the layout from `ToolFlags`, so every NavItem is a section.
 */
export interface NavItem {
  slug: string;
  /** Display number, e.g. "04", or an explicit `num` override like "RT". */
  num: string;
  /** Full title (module header). */
  title: string;
  /** Condensed title for the sidebar. */
  shortTitle: string;
  /** Drives the read/done checkbox + progress. */
  order: number;
  /** Optional chapter grouping; see `partGroups`. */
  part?: string;
  /** Pensum tier — drives the importance signal. */
  importance: Importance;
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
  glossary: "begreper",
  flashcards: "flashcards",
  exams: "eksamen",
} as const;

export interface ToolFlags {
  formulas: boolean;
  glossary: boolean;
  flashcards: boolean;
  exams: boolean;
}

export function toolFlags(course: Course, flashcardCount: number): ToolFlags {
  return {
    formulas: course.formulas.length > 0,
    glossary: course.glossary.length > 0,
    flashcards: course.features.flashcards && flashcardCount > 0,
    exams: course.exams.length > 0,
  };
}

/** The ordered module nav items (no tools). */
export function sectionNav(sections: CollectionEntry<"sections">[]): NavItem[] {
  const nums = sectionNumbers(sections);
  return sections.map((s) => ({
    slug: sectionSlug(s.id),
    num: nums.get(s.id) ?? String(s.data.order).padStart(2, "0"),
    title: s.data.title,
    shortTitle: shortTitle(s.data.title),
    order: s.data.order,
    part: s.data.part,
    importance: s.data.importance,
  }));
}

export interface PartGroup<T> {
  /** Part header label, or null for the generic/ungrouped bucket. */
  part: string | null;
  items: T[];
}

/**
 * Group ordered, part-tagged items into chapters for the sidebar / overview.
 * Generic over anything carrying an optional `part` (nav items or overview tiles).
 *
 * - No item has a `part` → a single group with `part: null` (today's flat list;
 *   the caller supplies the generic heading, e.g. "Moduler").
 * - Some items have a `part` → one group per distinct part, in first-appearance
 *   (i.e. `order`) sequence. Part-less items collect into a `part: null` group
 *   kept in its natural position relative to the parted ones.
 *
 * Items are assumed pre-sorted by `order` (as `sectionNav` returns them); a part
 * that recurs after an interruption merges back into its first group so a stray
 * ungrouped module never splits a chapter into two headers.
 */
export function partGroups<T extends { part?: string }>(
  items: T[],
): PartGroup<T>[] {
  if (!items.some((i) => i.part)) {
    return items.length ? [{ part: null, items }] : [];
  }
  const groups: PartGroup<T>[] = [];
  const byPart = new Map<string, PartGroup<T>>();
  let ungrouped: PartGroup<T> | null = null;
  for (const item of items) {
    const key = item.part ?? "";
    if (item.part) {
      let g = byPart.get(key);
      if (!g) {
        g = { part: item.part, items: [] };
        byPart.set(key, g);
        groups.push(g);
      }
      g.items.push(item);
    } else {
      if (!ungrouped) {
        ungrouped = { part: null, items: [] };
        groups.push(ungrouped);
      }
      ungrouped.items.push(item);
    }
  }
  return groups;
}
