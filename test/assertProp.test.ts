import { test } from "node:test";
import assert from "node:assert/strict";
import { assertOneOf, assertRequiredString } from "../src/lib/assertProp.ts";

/**
 * `assertOneOf` is the build-time enum-prop guard behind Admonition/Statement/
 * Callout/Simulation: an allowed value passes silently, a stray one throws a
 * message that names the component, the prop and the allowed values so a
 * misspelled MDX prop fails loudly instead of shipping a blank badge.
 */
const TONES = ["note", "warning", "tip"] as const;

test("assertOneOf: an allowed value does not throw", () => {
  assert.doesNotThrow(() =>
    assertOneOf("warning", TONES, "Admonition", "tone"),
  );
});

test("assertOneOf: a disallowed value throws naming component, prop and allowed values", () => {
  assert.throws(
    () => assertOneOf("wrn", TONES, "Admonition", "tone"),
    (err: Error) => {
      assert.ok(err instanceof Error);
      assert.equal(
        err.message,
        'study-companion: <Admonition tone="wrn"> — tone must be ' +
          'one of "note", "warning", "tip".',
      );
      return true;
    },
  );
});

test("assertRequiredString: a non-empty string passes", () => {
  assert.doesNotThrow(() =>
    assertRequiredString("snells", "FormulaRef", "id", "the formula's id"),
  );
});

test("assertRequiredString: a missing or empty prop throws naming component and prop", () => {
  for (const bad of [undefined, ""]) {
    assert.throws(
      () =>
        assertRequiredString(
          bad,
          "ExamRef",
          "id",
          "the id of a course.exams entry",
        ),
      /<ExamRef> needs id="…" — the id of a course\.exams entry/,
    );
  }
});
