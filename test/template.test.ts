import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import {
  courseSchema,
  sectionSchema,
  flashcardsSchema,
  SCHEMA_VERSION,
} from "../src/schema.ts";
import { validateXrefs } from "../src/lib/xref.ts";

/**
 * Guards the shipped `course-template/` content against the CURRENT tree's
 * schema + xref rules. The template pins a git TAG of this framework, so its own
 * `pnpm build` never exercises the working tree — a schema or cross-reference
 * change here would only surface for the first `degit` consumer. This test runs
 * the real zod schemas and the real `validateXrefs` over the template so that
 * drift fails CI here instead.
 */

const templateDir = fileURLToPath(
  new URL("../course-template/content/", import.meta.url),
);
const read = (rel: string) => readFileSync(templateDir + rel, "utf8");

/** Frontmatter block + MDX body (mirrors what Astro's content loader splits). */
function frontmatter(src: string): { data: unknown; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  assert.ok(m, "section is missing a `---` frontmatter block");
  return { data: parse(m[1]), body: src.slice(m[0].length) };
}

const sectionFiles = readdirSync(templateDir + "sections")
  .filter((f) => f.endsWith(".mdx"))
  .sort();

test("template course.yaml parses against the current course schema", () => {
  const course = courseSchema.parse(parse(read("course.yaml")));
  // Pinning the version here means a SCHEMA_VERSION bump that forgets the
  // template's course.yaml (or MIGRATIONS) trips this, not a downstream consumer.
  assert.equal(course.schemaVersion, SCHEMA_VERSION);
});

test("template flashcards.yaml parses against the current flashcards schema", () => {
  const cards = flashcardsSchema.parse(parse(read("flashcards.yaml")));
  assert.ok(cards.cards.length > 0);
});

test("every template section frontmatter parses against the section schema", () => {
  assert.ok(sectionFiles.length > 0, "template ships no example sections");
  for (const file of sectionFiles) {
    const { data } = frontmatter(read(`sections/${file}`));
    // Surfaces the offending file (zod alone would only name the key).
    assert.doesNotThrow(
      () => sectionSchema.parse(data),
      `sections/${file} frontmatter failed the section schema`,
    );
  }
});

test("template <Term>/<FormulaRef>/<Statement> refs all resolve (real xref validator)", () => {
  const course = courseSchema.parse(parse(read("course.yaml")));
  // Fed exactly like src/pages/index.astro drives the build-time check.
  const report = validateXrefs({
    glossaryTerms: course.glossary.map((g) => g.term),
    formulaIds: course.formulas.flatMap((f) => (f.id ? [f.id] : [])),
    sections: sectionFiles.map((file) => ({
      label: `sections/${file}`,
      body: frontmatter(read(`sections/${file}`)).body,
    })),
  });
  assert.deepEqual(
    report.errors,
    [],
    `template has dead cross-references:\n${report.errors.join("\n")}`,
  );
});
