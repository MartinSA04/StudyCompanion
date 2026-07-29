import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Release hygiene: every SCHEMA_VERSION bump must ship a matching MIGRATIONS.md
 * entry so a consuming course sees documented upgrade steps, not a bare number.
 * (The tag == package.json version check is a tag-push CI job, not this suite.)
 */
const root = fileURLToPath(new URL("../", import.meta.url));

const schemaSrc = readFileSync(root + "src/schema.ts", "utf8");
const migrations = readFileSync(root + "MIGRATIONS.md", "utf8");

test("SCHEMA_VERSION is declared as a positive integer in schema.ts", () => {
  const m = /export const SCHEMA_VERSION = (\d+);/.exec(schemaSrc);
  assert.ok(m, "could not find `export const SCHEMA_VERSION = N;`");
  assert.ok(Number(m![1]) >= 1);
});

test("MIGRATIONS.md documents the current SCHEMA_VERSION", () => {
  const version = Number(
    /export const SCHEMA_VERSION = (\d+);/.exec(schemaSrc)![1],
  );
  // Heading convention (see MIGRATIONS.md): `## SCHEMA_VERSION <n> — …`.
  const heading = new RegExp(`^## SCHEMA_VERSION ${version}\\b`, "m");
  assert.match(
    migrations,
    heading,
    `MIGRATIONS.md is missing a "## SCHEMA_VERSION ${version}" entry`,
  );
});

test("MIGRATIONS.md has an entry for every version up to the current one", () => {
  const version = Number(
    /export const SCHEMA_VERSION = (\d+);/.exec(schemaSrc)![1],
  );
  for (let v = 1; v <= version; v++) {
    assert.match(
      migrations,
      new RegExp(`^## SCHEMA_VERSION ${v}\\b`, "m"),
      `missing migration entry for SCHEMA_VERSION ${v}`,
    );
  }
});

// The template pin and the framework version move together in ONE release
// commit, so this is checkable at that commit rather than after it: a release
// that bumps package.json but forgets `course-template/package.json` fails here
// immediately. It also holds between releases, because the version only ever
// changes in a dedicated `chore(release)` commit.
//
// This replaced a lockfile-vs-pin check that could not be satisfied at the
// release commit at all: pnpm resolves the `github:…#vX.Y.Z` pin against the
// REMOTE, so the template lockfile could only be regenerated once the tag was
// pushed, always landing one commit behind the tag. The template now ships no
// lockfile (see .gitignore), which is what makes a one-commit release possible.
test("course-template pins the framework version this tree declares", () => {
  const pin = JSON.parse(
    readFileSync(root + "course-template/package.json", "utf8"),
  ).dependencies["study-companion"] as string;
  const { version } = JSON.parse(readFileSync(root + "package.json", "utf8"));
  assert.equal(
    pin.slice(pin.indexOf("#") + 1),
    `v${version}`,
    `course-template pins ${pin}, but this tree is version ${version}`,
  );
});
