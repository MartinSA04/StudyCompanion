import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { SCHEMA_VERSION } from "../schema.ts";
import type { Course } from "../schema.ts";

export interface LoadedCourse {
  course: Course;
  sections: CollectionEntry<"sections">[];
}

/**
 * Read and validate the single course in this repo, returning the course
 * metadata plus its sections sorted by `order`.
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
  const schemaVersion = course.schemaVersion ?? SCHEMA_VERSION;

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

  // Draft modules (`draft: true`) are hidden from a PRODUCTION build — no route,
  // no nav entry, no overview tile, no sitemap row — but stay visible in
  // `astro dev` so they can be drafted in place. Filtering here is the single
  // chokepoint: every consumer (overview, [slug] routing, sitemap, xref
  // validation) reads through loadCourse, so they all agree. `import.meta.env.PROD`
  // is true during `astro build`, false during `astro dev`.
  const sections = (await getCollection("sections"))
    .filter((s) => !(import.meta.env.PROD && s.data.draft))
    .sort((a, b) => a.data.order - b.data.order);

  return { course, sections };
}
