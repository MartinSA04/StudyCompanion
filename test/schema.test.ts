import { test } from "node:test";
import assert from "node:assert/strict";
import { courseSchema } from "../src/schema.ts";

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
