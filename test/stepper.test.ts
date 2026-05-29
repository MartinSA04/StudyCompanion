import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampIndex,
  stepIndex,
  intervalFor,
  nextSpeed,
  SPEEDS,
  normalizeFrame,
  tickPlay,
} from "../src/lib/stepper.ts";

test("clampIndex keeps the index within [0, total-1]", () => {
  assert.equal(clampIndex(3, 10), 3);
  assert.equal(clampIndex(-2, 10), 0);
  assert.equal(clampIndex(99, 10), 9);
  assert.equal(clampIndex(5, 0), 0); // no frames
  assert.equal(clampIndex(Number.NaN, 10), 0);
});

test("stepIndex moves by a direction and clamps at the ends", () => {
  assert.equal(stepIndex(4, 10, +1), 5);
  assert.equal(stepIndex(4, 10, -1), 3);
  assert.equal(stepIndex(9, 10, +1), 9); // already last
  assert.equal(stepIndex(0, 10, -1), 0); // already first
});

test("intervalFor maps a speed multiplier to ms (faster = smaller), guarding 0", () => {
  assert.equal(intervalFor(1), 520);
  assert.equal(intervalFor(2), 260);
  assert.equal(intervalFor(0.5), 1040);
  assert.equal(intervalFor(2, 600), 300); // custom base
  assert.equal(intervalFor(0), 520); // non-positive → treated as 1×
});

test("nextSpeed cycles through SPEEDS and resets on an unknown value", () => {
  assert.deepEqual(SPEEDS, [0.5, 1, 2]);
  assert.equal(nextSpeed(0.5), 1);
  assert.equal(nextSpeed(1), 2);
  assert.equal(nextSpeed(2), 0.5); // wraps
  assert.equal(nextSpeed(3), SPEEDS[0]); // unknown → first
});

test("normalizeFrame reads line as a scalar or array, dropping non-positive", () => {
  assert.deepEqual(normalizeFrame({ line: 5 }).lines, [5]);
  assert.deepEqual(normalizeFrame({ line: [2, 4] }).lines, [2, 4]);
  assert.deepEqual(normalizeFrame({ line: 0 }).lines, []);
  assert.deepEqual(normalizeFrame({}).lines, []);
});

test("normalizeFrame takes desc, falling back to label then empty string", () => {
  assert.equal(normalizeFrame({ desc: "compare" }).desc, "compare");
  assert.equal(normalizeFrame({ label: "swap" }).desc, "swap");
  assert.equal(normalizeFrame({ desc: "a", label: "b" }).desc, "a");
  assert.equal(normalizeFrame({}).desc, "");
});

test("normalizeFrame stringifies vars (vars or variables) as [key, string] pairs", () => {
  assert.deepEqual(normalizeFrame({ vars: { i: 3, j: 4 } }).vars, [
    ["i", "3"],
    ["j", "4"],
  ]);
  // falls back to `variables`
  assert.deepEqual(normalizeFrame({ variables: { n: 10 } }).vars, [["n", "10"]]);
  // arrays/objects are JSON-stringified
  assert.deepEqual(normalizeFrame({ vars: { path: [1, 2] } }).vars, [
    ["path", "[1,2]"],
  ]);
  assert.deepEqual(normalizeFrame({}).vars, []);
});

test("tickPlay advances one frame and reports the end", () => {
  assert.deepEqual(tickPlay(4, 10), { index: 5, atEnd: false });
  assert.deepEqual(tickPlay(8, 10), { index: 9, atEnd: false });
  assert.deepEqual(tickPlay(9, 10), { index: 9, atEnd: true });
  assert.deepEqual(tickPlay(0, 0), { index: 0, atEnd: true });
});
