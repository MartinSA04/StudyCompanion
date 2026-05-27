import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  progressKey,
  readSections,
  writeSections,
  resetProgress,
} from "../src/lib/progress.ts";

/** A minimal in-memory localStorage, good enough for the helpers under test. */
function memoryStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    _store: store,
  };
}

/** A storage that throws on every access — simulates private mode / disabled. */
function throwingStorage() {
  const boom = () => {
    throw new Error("storage disabled");
  };
  return { getItem: boom, setItem: boom, removeItem: boom };
}

beforeEach(() => {
  // Each test installs its own; default to a clean in-memory one.
  (globalThis as { localStorage?: unknown }).localStorage = memoryStorage();
});

test("progressKey namespaces by course code", () => {
  assert.equal(progressKey("TFY4195"), "sc:progress:TFY4195");
});

test("write → read round-trips the set of done sections", () => {
  writeSections("ABC", new Set([3, 1, 2]));
  assert.deepEqual([...readSections("ABC")].sort(), [1, 2, 3]);
});

test("readSections returns an empty set when nothing is stored", () => {
  assert.equal(readSections("NONE").size, 0);
});

test("readSections coerces stored values to numbers", () => {
  (globalThis as { localStorage?: unknown }).localStorage = memoryStorage({
    "sc:progress:ABC": '["1","2","3"]',
  });
  assert.deepEqual([...readSections("ABC")].sort(), [1, 2, 3]);
});

test("readSections degrades to empty on corrupt / non-array JSON", () => {
  (globalThis as { localStorage?: unknown }).localStorage = memoryStorage({
    "sc:progress:BAD": "}{ not json",
    "sc:progress:OBJ": '{"a":1}',
  });
  assert.equal(readSections("BAD").size, 0);
  assert.equal(readSections("OBJ").size, 0);
});

test("storage that throws never bubbles — read empty, write/reset no-op", () => {
  (globalThis as { localStorage?: unknown }).localStorage = throwingStorage();
  assert.equal(readSections("X").size, 0);
  assert.doesNotThrow(() => writeSections("X", new Set([1])));
  assert.doesNotThrow(() => resetProgress("X"));
});

test("resetProgress clears the stored key", () => {
  writeSections("ABC", new Set([1, 2]));
  assert.equal(readSections("ABC").size, 2);
  resetProgress("ABC");
  assert.equal(readSections("ABC").size, 0);
});
