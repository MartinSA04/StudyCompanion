import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  sectionCollisionProblems,
  strayEntryProblems,
  schemaSkewProblem,
} from "../src/lib/loadCourse.ts";
import { SCHEMA_VERSION } from "../src/schema.ts";

/** Minimal CollectionEntry<"sections"> stand-in — the collision check only reads `id` + `data.order`. */
const sections = (entries: { id: string; order: number }[]) =>
  entries.map((e) => ({ id: e.id, data: { order: e.order } })) as never;

test("a clean section list has no collision problems", () => {
  assert.deepEqual(
    sectionCollisionProblems(
      sections([
        { id: "01-foton", order: 1 },
        { id: "02-geo", order: 2 },
        { id: "03-bilde", order: 3 },
      ]),
    ),
    [],
  );
});

test("two sections sharing an order is a problem", () => {
  const problems = sectionCollisionProblems(
    sections([
      { id: "01-alpha", order: 1 },
      { id: "02-beta", order: 1 },
    ]),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /"01-alpha" and "02-beta"/);
  assert.match(problems[0], /order 1/);
  assert.match(problems[0], /unique order/);
});

test("two files deriving the same slug is a problem", () => {
  // "01-foton" and "02-foton" both strip to slug "foton"; distinct orders keep
  // this to the slug collision alone.
  const problems = sectionCollisionProblems(
    sections([
      { id: "01-foton", order: 1 },
      { id: "02-foton", order: 2 },
    ]),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /"01-foton" and "02-foton"/);
  assert.match(problems[0], /"\/foton"/);
});

test("a slug shadowing a reserved tool page is a problem", () => {
  // "10-eksamen" derives slug "eksamen" — reserved for the Eksamen tool page.
  const problems = sectionCollisionProblems(
    sections([{ id: "10-eksamen", order: 1 }]),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /"10-eksamen"/);
  assert.match(problems[0], /"\/eksamen"/);
  assert.match(problems[0], /reserved/);
});

test("order and slug collisions accumulate rather than short-circuit", () => {
  // Same file pair collides on BOTH order and slug → two distinct problems.
  const problems = sectionCollisionProblems(
    sections([
      { id: "01-foton", order: 1 },
      { id: "02-foton", order: 1 },
    ]),
  );
  assert.equal(problems.length, 2);
});

/** Build a throwaway cwd with a populated content/sections and run `fn` inside it. */
function inSectionsDir(
  entries: { name: string; dir?: boolean }[],
  fn: () => void,
  { withDir = true }: { withDir?: boolean } = {},
) {
  const root = mkdtempSync(join(tmpdir(), "sc-stray-"));
  if (withDir) {
    const dir = join(root, "content", "sections");
    mkdirSync(dir, { recursive: true });
    for (const e of entries) {
      if (e.dir) mkdirSync(join(dir, e.name));
      else writeFileSync(join(dir, e.name), "");
    }
  }
  const prev = process.cwd();
  process.chdir(root);
  try {
    fn();
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
  }
}

test("a missing content/sections dir yields no stray problems", () => {
  inSectionsDir([], () => assert.deepEqual(strayEntryProblems(), []), {
    withDir: false,
  });
});

test("flat *.mdx files and tolerated dotfiles yield no stray problems", () => {
  inSectionsDir(
    [{ name: "01-foton.mdx" }, { name: "02-geo.mdx" }, { name: ".gitkeep" }],
    () => assert.deepEqual(strayEntryProblems(), []),
  );
});

test("a subdirectory under content/sections is a stray problem", () => {
  inSectionsDir([{ name: "part-a", dir: true }], () => {
    const problems = strayEntryProblems();
    assert.equal(problems.length, 1);
    assert.match(problems[0], /part-a\//);
    assert.match(problems[0], /subdirectory/);
  });
});

test("a non-*.mdx file under content/sections is a stray problem", () => {
  inSectionsDir([{ name: "notes.txt" }], () => {
    const problems = strayEntryProblems();
    assert.equal(problems.length, 1);
    assert.match(problems[0], /notes\.txt/);
    assert.match(problems[0], /not a \*\.mdx file/);
  });
});

test("schemaSkewProblem: matching versions produce no problem", () => {
  assert.equal(schemaSkewProblem(SCHEMA_VERSION), null);
  assert.equal(schemaSkewProblem(3, 3), null);
});

test("schemaSkewProblem: content NEWER than the framework says bump the pin", () => {
  const msg = schemaSkewProblem(SCHEMA_VERSION + 1);
  assert.match(msg!, /NEWER/);
  assert.match(msg!, /Bump the study-companion/);
  // Explicit framework version keeps the check independent of SCHEMA_VERSION.
  assert.match(schemaSkewProblem(4, 3)!, /NEWER/);
});

test("schemaSkewProblem: content OLDER than the framework points at MIGRATIONS", () => {
  const msg = schemaSkewProblem(SCHEMA_VERSION - 1);
  assert.match(msg!, /OLDER/);
  assert.match(msg!, /MIGRATIONS\.md/);
  assert.match(schemaSkewProblem(2, 3)!, /OLDER/);
});
