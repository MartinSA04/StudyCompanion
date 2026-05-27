import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sectionSlug,
  sectionNumbers,
  shortTitle,
  toolFlags,
} from "../src/lib/nav.ts";

test("sectionSlug strips a leading numeric prefix with optional separator", () => {
  assert.equal(sectionSlug("01-foton"), "foton");
  assert.equal(sectionSlug("02_geo1"), "geo1");
  assert.equal(sectionSlug("03foton"), "foton");
});

test("sectionSlug falls back to the raw id when stripping leaves nothing", () => {
  assert.equal(sectionSlug("12-"), "12-"); // would be "" → falls back
  assert.equal(sectionSlug("07"), "07");
  assert.equal(sectionSlug("intro"), "intro");
});

test("sectionNumbers auto-numbers gap-free, sorting by order", () => {
  // Deliberately unsorted input.
  const nums = sectionNumbers([
    { id: "c", data: { order: 3 } },
    { id: "a", data: { order: 1 } },
    { id: "b", data: { order: 2 } },
  ]);
  assert.equal(nums.get("a"), "01");
  assert.equal(nums.get("b"), "02");
  assert.equal(nums.get("c"), "03");
});

test("sectionNumbers: a `num` override keeps its label and does NOT consume a slot", () => {
  const nums = sectionNumbers([
    { id: "a", data: { order: 1 } },
    { id: "b", data: { order: 2 } },
    { id: "rt", data: { order: 3, num: "RT" } },
    { id: "c", data: { order: 4 } },
  ]);
  // Auto numbers stay gap-free around the override: 01, 02, RT, 03.
  assert.equal(nums.get("a"), "01");
  assert.equal(nums.get("b"), "02");
  assert.equal(nums.get("rt"), "RT");
  assert.equal(nums.get("c"), "03");
});

test("sectionNumbers: an empty-string `num` is treated as no override", () => {
  const nums = sectionNumbers([
    { id: "a", data: { order: 1, num: "" } },
    { id: "b", data: { order: 2 } },
  ]);
  assert.equal(nums.get("a"), "01");
  assert.equal(nums.get("b"), "02");
});

test("shortTitle trims at the first em-dash, comma, ampersand or colon", () => {
  assert.equal(shortTitle("Interferens — superposisjon"), "Interferens");
  assert.equal(shortTitle("Refleksjon, brytning"), "Refleksjon");
  assert.equal(shortTitle("Bølger & stråler"), "Bølger");
  assert.equal(shortTitle("Tema: undertittel"), "Tema");
  assert.equal(shortTitle("Geometrisk optikk"), "Geometrisk optikk");
});

test("toolFlags reflects course data + flashcard count", () => {
  const base = {
    formulas: [{}, {}],
    exams: [{}],
    features: { flashcards: true },
  } as never;
  const flags = toolFlags(base, 5);
  assert.deepEqual(flags, { formulas: true, flashcards: true, exams: true });

  // Flashcards gate on BOTH the feature flag AND a non-empty deck.
  const noDeck = toolFlags(
    { formulas: [], exams: [], features: { flashcards: true } } as never,
    0,
  );
  assert.deepEqual(noDeck, {
    formulas: false,
    flashcards: false,
    exams: false,
  });
  const flagOff = toolFlags(
    { formulas: [], exams: [], features: { flashcards: false } } as never,
    9,
  );
  assert.equal(flagOff.flashcards, false);
});
