import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { courseSchema, sectionSchema, flashcardsSchema } from "./schema.ts";
import { saltedLoader } from "./lib/saltedLoader.ts";

/**
 * Content collections owned by the framework and re-exported verbatim by every
 * course repo via its one-line `src/content.config.ts`:
 *
 *     export { collections } from "study-companion/content";
 *
 * IMPORTANT: the `base` paths below are resolved against the *consumer's*
 * (course repo's) current working directory at build time, so they read the
 * course's `content/` folder — never the framework's.
 */

/**
 * Digest salt for every collection: the content layer caches parsed entries in
 * node_modules/.astro keyed on the content FILE's bytes only, so a schema
 * change against unchanged files (a framework bump adding a defaulted field, a
 * ui-string default edit during dev) would keep serving the stale parse —
 * crashing on missing fields or silently showing old defaults. Hashing
 * schema.ts into the digest re-parses everything whenever the schema changes.
 */
const schemaDigest = createHash("sha1")
  .update(readFileSync(new URL("./schema.ts", import.meta.url)))
  .digest("hex");

const course = defineCollection({
  loader: saltedLoader(
    glob({ pattern: "course.yaml", base: "./content" }),
    schemaDigest,
  ),
  schema: courseSchema,
});

const sections = defineCollection({
  loader: saltedLoader(
    glob({ pattern: "*.mdx", base: "./content/sections" }),
    schemaDigest,
  ),
  schema: sectionSchema,
});

const flashcards = defineCollection({
  loader: saltedLoader(
    glob({ pattern: "flashcards.yaml", base: "./content" }),
    schemaDigest,
  ),
  schema: flashcardsSchema,
});

export const collections = { course, sections, flashcards };
