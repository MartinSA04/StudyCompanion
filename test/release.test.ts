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

// The tag-push guard cannot check the lockfile: pnpm resolves the
// `github:…#vX.Y.Z` pin against the REMOTE, so `pnpm install --lockfile-only`
// in the template only succeeds once the tag is pushed. The lockfile sync
// therefore trails the tag by one commit, so this deliberately FAILS on the
// release commit itself and stays red until the post-tag-push sync lands —
// that transient red is the enforcement that the sync actually happened.
test("course-template lockfile specifier matches its study-companion pin", () => {
  const pin = JSON.parse(
    readFileSync(root + "course-template/package.json", "utf8"),
  ).dependencies["study-companion"];
  const lock = readFileSync(root + "course-template/pnpm-lock.yaml", "utf8");
  const m = /^ {6}study-companion:\n {8}specifier: (.+)$/m.exec(lock);
  assert.ok(m, "could not find study-companion specifier in pnpm-lock.yaml");
  assert.equal(
    m![1],
    pin,
    `lockfile specifier ${m![1]} does not match package.json pin ${pin}`,
  );
});
