import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { SCHEMA_VERSION } from "../schema.ts";
import type { Course, Flashcards } from "../schema.ts";
import { sectionSlug, toolFlags, TOOL_SLUGS } from "./nav.ts";
import type { ToolFlags } from "./nav.ts";

export interface LoadedCourse {
  course: Course;
  sections: CollectionEntry<"sections">[];
  /** The course's flashcard deck — [] when absent or feature-disabled. */
  flashcards: Flashcards["cards"];
  /** Which tool pages exist, derived from content + feature flags. */
  tools: ToolFlags;
}

/**
 * The sections collection deliberately globs only flat `*.mdx` (see
 * src/content.ts) — a nested folder or a stray `.md` file would otherwise just
 * vanish from the guide with no error. Name every such entry so the author gets
 * a build failure instead of a silently missing module. The directory resolves
 * exactly like the glob's `base` ("./content/sections" against the consumer's
 * cwd at build time); dotfiles (.gitkeep, .DS_Store) are tolerated.
 */
function strayEntryProblems(): string[] {
  const dir = resolve("content/sections");
  if (!existsSync(dir)) return []; // no sections dir — the glob is empty too
  const problems: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      problems.push(
        `content/sections/${entry.name}/ is a subdirectory — sections must be ` +
          `flat *.mdx files directly in content/sections/.`,
      );
    } else if (!entry.name.endsWith(".mdx")) {
      problems.push(
        `content/sections/${entry.name} is not a *.mdx file, so the sections ` +
          `glob ignores it — rename it to .mdx or remove it.`,
      );
    }
  }
  return problems;
}

/**
 * Cross-file invariants the per-file zod schema cannot see: `order` values and
 * derived slugs must be unique, and no slug may shadow a reserved tool-page
 * slug (TOOL_SLUGS) — a section named e.g. `10-eksamen.mdx` would otherwise be
 * silently unreachable behind the Eksamen page. Checked on the UNFILTERED
 * section list so a collision involving a draft fails the production build
 * too; the content is just as broken for `astro dev`.
 */
function sectionCollisionProblems(
  sections: CollectionEntry<"sections">[],
): string[] {
  const problems: string[] = [];
  const byOrder = new Map<number, string>();
  const bySlug = new Map<string, string>();
  const reserved = new Set<string>(Object.values(TOOL_SLUGS));
  for (const s of sections) {
    const orderHolder = byOrder.get(s.data.order);
    if (orderHolder) {
      problems.push(
        `sections "${orderHolder}" and "${s.id}" both have order ${s.data.order} — every section needs a unique order.`,
      );
    } else {
      byOrder.set(s.data.order, s.id);
    }

    const slug = sectionSlug(s.id);
    const slugHolder = bySlug.get(slug);
    if (slugHolder) {
      problems.push(
        `sections "${slugHolder}" and "${s.id}" both derive the slug "/${slug}" — rename one file.`,
      );
    } else {
      bySlug.set(slug, s.id);
    }

    if (reserved.has(slug)) {
      problems.push(
        `section "${s.id}" derives the slug "/${slug}", which is reserved for a ` +
          `tool page (reserved: ${Object.values(TOOL_SLUGS).join(", ")}) — rename the file.`,
      );
    }
  }
  return problems;
}

/**
 * Read and validate the single course in this repo, returning the course
 * metadata, its sections sorted by `order`, the flashcard deck and the derived
 * tool-page flags. Every consumer (overview, [slug] routing, 404, sitemap,
 * manifest) reads through this single chokepoint, so they all agree — and this
 * is where the content-shape invariants zod's per-file schemas cannot express
 * are enforced.
 *
 * The schemaVersion guard turns a framework/content version skew into a clear
 * build error instead of a mysterious break:
 *   - content NEWER than the framework  => bump the study-companion pin.
 *   - content OLDER than the framework   => migrate content (see MIGRATIONS.md).
 * Within one major version SCHEMA_VERSION never changes, so a course that pins a
 * tag never hits this until it deliberately crosses a major boundary.
 */
export async function loadCourse(): Promise<LoadedCourse> {
  const courseEntries = await getCollection("course");
  const courseEntry = courseEntries[0];
  if (!courseEntry) {
    throw new Error(
      "study-companion: no content/course.yaml found in this course repo.",
    );
  }
  const course = courseEntry.data;
  const schemaVersion = course.schemaVersion;

  if (schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `study-companion: content schemaVersion ${schemaVersion} is NEWER than ` +
        `framework SCHEMA_VERSION ${SCHEMA_VERSION}. Bump the study-companion ` +
        `pin in package.json to a version that supports this schema.`,
    );
  }
  if (schemaVersion < SCHEMA_VERSION) {
    throw new Error(
      `study-companion: content schemaVersion ${schemaVersion} is OLDER than ` +
        `framework SCHEMA_VERSION ${SCHEMA_VERSION}. Migrate content/course.yaml ` +
        `and sections to schema v${SCHEMA_VERSION} (see MIGRATIONS.md), then set ` +
        `schemaVersion: ${SCHEMA_VERSION}.`,
    );
  }

  const allSections = (await getCollection("sections")).sort(
    (a, b) => a.data.order - b.data.order,
  );

  // All violations are collected and thrown together (same style as the xref
  // validation) so an author fixes one failed build, not one per problem.
  const problems = [
    ...strayEntryProblems(),
    ...sectionCollisionProblems(allSections),
  ];
  if (problems.length) {
    throw new Error(
      "study-companion: content validation failed —\n" +
        problems.map((p) => `  • ${p}`).join("\n"),
    );
  }

  // Draft modules (`draft: true`) are hidden from a PRODUCTION build — no route,
  // no nav entry, no overview tile, no sitemap row — but stay visible in
  // `astro dev` so they can be drafted in place. `import.meta.env.PROD` is true
  // during `astro build`, false during `astro dev`.
  const sections = allSections.filter(
    (s) => !(import.meta.env.PROD && s.data.draft),
  );

  // The deck is gated on the feature flag so a leftover flashcards.yaml cannot
  // resurrect a disabled tool. Tool flags derive from course data + deck size;
  // computing both here keeps every page reading the same values instead of
  // re-deriving them.
  const flashcards = course.features.flashcards
    ? ((await getCollection("flashcards"))[0]?.data.cards ?? [])
    : [];
  const tools = toolFlags(course, flashcards.length);

  return { course, sections, flashcards, tools };
}
