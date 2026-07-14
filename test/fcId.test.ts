import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fcId } from "../src/lib/fcId.ts";

/**
 * `fcId` is the stable content key <Flashcards> persists ratings under, hashed
 * from a card's RAW front text so a KaTeX-renderer upgrade (or any edit to
 * other cards) can't shift ids. These lock the pure-function contract.
 */

test("fcId is deterministic for the same input", () => {
  assert.equal(fcId("What is refraction?"), fcId("What is refraction?"));
});

test("fcId is base36 (no leading '-') and short", () => {
  for (const s of ["", "a", "θ = 90°", "front $x^2$ back", "a".repeat(500)]) {
    const id = fcId(s);
    assert.match(id, /^[0-9a-z]+$/, `"${s}" → ${id}`);
    assert.ok(id.length <= 7, `id too long for "${s}": ${id}`);
  }
});

test("fcId identical fronts collide (shared rating is intended), distinct don't", () => {
  assert.equal(fcId("same front"), fcId("same front"));
  // A broad sample of distinct strings must not collide en masse.
  const ids = new Set<string>();
  for (let i = 0; i < 2000; i++) ids.add(fcId(`card number ${i}`));
  assert.equal(ids.size, 2000);
});

test("a one-character edit changes the id", () => {
  assert.notEqual(fcId("Newton's first law"), fcId("Newton's second law"));
});

test("<Flashcards> keys ratings on fcId of the RAW front (parity)", () => {
  const source = readFileSync(
    fileURLToPath(
      new URL("../src/components/Flashcards.astro", import.meta.url),
    ),
    "utf8",
  );
  // The build-time id must be fcId(c.front), not fcId(rendered/back) — a mismatch
  // would break rating persistence silently.
  assert.match(source, /id:\s*fcId\(c\.front\)/);
});
