import { test } from "node:test";
import assert from "node:assert/strict";
import { courseSchema, sectionSchema } from "../src/schema.ts";

/** Minimal valid course (only the no-default required fields). */
const base = { code: "TST101", title: "Test", term: "V2026" };

test("analytics.goatcounter endpoint is parsed when set", () => {
  const parsed = courseSchema.parse({
    ...base,
    analytics: { goatcounter: "https://mycode.goatcounter.com/count" },
  });
  assert.equal(
    parsed.analytics?.goatcounter,
    "https://mycode.goatcounter.com/count",
  );
});

test("analytics is undefined when omitted (analytics disabled)", () => {
  const parsed = courseSchema.parse(base);
  assert.equal(parsed.analytics, undefined);
});

test("a non-URL goatcounter value is rejected", () => {
  const result = courseSchema.safeParse({
    ...base,
    analytics: { goatcounter: "not-a-url" },
  });
  assert.equal(result.success, false);
});

test("seo.twitter + institution are optional and parsed when set", () => {
  const parsed = courseSchema.parse({
    ...base,
    institution: "NTNU",
    seo: { twitter: "@demo" },
  });
  assert.equal(parsed.institution, "NTNU");
  assert.equal(parsed.seo?.twitter, "@demo");
  // Omitted entirely → both undefined (no SEO overrides, no provider).
  const bare = courseSchema.parse(base);
  assert.equal(bare.institution, undefined);
  assert.equal(bare.seo, undefined);
});

test("section draft/noindex default to false and coerce when set", () => {
  const def = sectionSchema.parse({ order: 1, title: "M" });
  assert.equal(def.draft, false);
  assert.equal(def.noindex, false);
  const set = sectionSchema.parse({
    order: 2,
    title: "M",
    draft: true,
    noindex: true,
  });
  assert.equal(set.draft, true);
  assert.equal(set.noindex, true);
});
