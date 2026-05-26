import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { courseSchema, sectionSchema, flashcardsSchema } from "./schema.ts";

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

const course = defineCollection({
  loader: glob({ pattern: "course.yaml", base: "./content" }),
  schema: courseSchema,
});

const sections = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./content/sections" }),
  schema: sectionSchema,
});

const flashcards = defineCollection({
  loader: glob({ pattern: "flashcards.yaml", base: "./content" }),
  schema: flashcardsSchema,
});

export const collections = { course, sections, flashcards };
