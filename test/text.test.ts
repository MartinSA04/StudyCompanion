import { test } from "node:test";
import assert from "node:assert/strict";
import { plain } from "../src/lib/text.ts";
import { courseGraph } from "../src/lib/courseGraph.ts";

const SHY = "­";

test("plain strips soft hyphens, leaving the word as it is spelled", () => {
  assert.equal(plain(`Halvleder${SHY}komponenter`), "Halvlederkomponenter");
  // Several break points in one string, and one on a second word.
  assert.equal(
    plain(`Faste stoffers${SHY} fysikk${SHY}${SHY}emne`),
    "Faste stoffers fysikkemne",
  );
});

test("the shared JSON-LD course ref carries the plain title", () => {
  const course = {
    code: "TFE4146",
    title: `Halvleder${SHY}komponenter`,
    courseUrl: "https://www.ntnu.no/studier/emner/TFE4146",
    institution: "NTNU",
  } as Parameters<typeof courseGraph>[0];
  const { course: ref } = courseGraph(course, "https://example.com");
  assert.equal(ref.title, "Halvlederkomponenter");
  assert.equal(ref.code, "TFE4146");
});

test("plain leaves ordinary text — and real hyphens — untouched", () => {
  assert.equal(
    plain("Algoritmer og datastrukturer"),
    "Algoritmer og datastrukturer",
  );
  assert.equal(plain("Bose–Einstein-kondensat"), "Bose–Einstein-kondensat");
  assert.equal(plain(""), "");
});
