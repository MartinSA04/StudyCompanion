import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

/**
 * Guards the hub's course list (hub/courses.yaml → kurs.martinsundal.no):
 * a typo'd URL or term fails CI here instead of shipping a dead tile.
 */
type HubCourse = { code: string; title: string; url: string; term: string };

const courses = parse(
  readFileSync(new URL("../hub/courses.yaml", import.meta.url), "utf8"),
) as HubCourse[];

test("courses.yaml is a non-empty list", () => {
  assert.ok(Array.isArray(courses));
  assert.ok(courses.length > 0);
});

test("every course has code, title, https url and a framework term code", () => {
  for (const c of courses) {
    assert.ok(c.code?.trim(), `code missing: ${JSON.stringify(c)}`);
    assert.ok(c.title?.trim(), `title missing in ${c.code}`);
    assert.match(c.url ?? "", /^https:\/\/\S+$/, `bad url in ${c.code}`);
    assert.match(c.term ?? "", /^[HV]\d{4}$/, `bad term in ${c.code}`);
  }
});

test("course codes are unique", () => {
  const codes = courses.map((c) => c.code);
  assert.equal(new Set(codes).size, codes.length);
});
