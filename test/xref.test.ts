import { test } from "node:test";
import assert from "node:assert/strict";
import { validateXrefs } from "../src/lib/xref.ts";

test("a clean course validates with no errors", () => {
  const { errors } = validateXrefs({
    glossaryTerms: ["Koherens", "Virtuelt bilde"],
    formulaIds: ["snells", "tynnlinse"],
    sections: [
      {
        label: "01-intro",
        body: 'Se <Term name="Koherens" /> og <FormulaRef id="snells" />.\n<Statement kind="law" name="Snells lov">…</Statement>',
      },
      {
        label: "02-bilde",
        body: 'Et <Term name="virtuelt bilde">virtuelt bilde</Term> følger <FormulaRef id="tynnlinse">linseformelen</FormulaRef>.',
      },
    ],
  });
  assert.deepEqual(errors, []);
});

test("a <Term> with no matching glossary entry is an error", () => {
  const { errors } = validateXrefs({
    glossaryTerms: ["Koherens"],
    formulaIds: [],
    sections: [{ label: "01", body: '<Term name="Diffraksjon" />' }],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Diffraksjon/);
  assert.match(errors[0], /#diffraksjon/);
});

test("a <FormulaRef> with no matching id is an error", () => {
  const { errors } = validateXrefs({
    glossaryTerms: [],
    formulaIds: ["snells"],
    sections: [{ label: "01", body: '<FormulaRef id="ghost" />' }],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /ghost/);
});

test("duplicate formula ids are an error", () => {
  const { errors } = validateXrefs({
    glossaryTerms: [],
    formulaIds: ["snells", "snells"],
    sections: [],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Duplicate formula id "snells"/);
});

test("duplicate <Statement> anchors across sections are an error", () => {
  // Same name in two sections → same derived slug → ambiguous deep-link.
  const { errors } = validateXrefs({
    glossaryTerms: [],
    formulaIds: [],
    sections: [
      { label: "01", body: '<Statement name="Snells lov">a</Statement>' },
      { label: "07", body: '<Statement name="Snells lov">b</Statement>' },
    ],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /#snells-lov/);
  assert.match(errors[0], /01 and 07/);
});

test("an explicit id collides with a name-derived anchor", () => {
  const { errors } = validateXrefs({
    glossaryTerms: [],
    formulaIds: [],
    sections: [
      { label: "a", body: '<Statement name="Ohm" />' }, // slug "ohm"
      { label: "b", body: '<Statement id="ohm" name="Ohms lov" />' },
    ],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /#ohm/);
});

test("distinct explicit ids avoid a false duplicate for identical names", () => {
  const { errors } = validateXrefs({
    glossaryTerms: [],
    formulaIds: [],
    sections: [
      { label: "a", body: '<Statement id="law-1" name="Lov">x</Statement>' },
      { label: "b", body: '<Statement id="law-2" name="Lov">y</Statement>' },
    ],
  });
  assert.deepEqual(errors, []);
});

test("widget mentions inside code spans/fences are ignored", () => {
  const { errors } = validateXrefs({
    glossaryTerms: [],
    formulaIds: [],
    sections: [
      {
        label: "guide",
        body: 'Bruk `<Term name="ghost" />` for å lenke.\n\n```mdx\n<FormulaRef id="ghost" />\n<Statement name="Snells lov" />\n```\n',
      },
    ],
  });
  assert.deepEqual(errors, []);
});

test("bare <Term>/<FormulaRef> without attributes are skipped", () => {
  const { errors } = validateXrefs({
    glossaryTerms: [],
    formulaIds: [],
    sections: [{ label: "01", body: "Komponentene <Term> og <FormulaRef>." }],
  });
  assert.deepEqual(errors, []);
});

test("matching is slug-based: case, spaces and æ/ø/å fold", () => {
  const { errors } = validateXrefs({
    glossaryTerms: ["Brytningsindeks", "Bølgelengde"],
    formulaIds: [],
    sections: [
      {
        label: "01",
        body: '<Term name="brytningsindeks" /> og <Term name="Bølgelengde" />',
      },
    ],
  });
  assert.deepEqual(errors, []);
});

test("unusedGlossary lists only terms no <Term> references", () => {
  const { unusedGlossary } = validateXrefs({
    glossaryTerms: ["Koherens", "Diffraksjon"],
    formulaIds: [],
    sections: [{ label: "01", body: '<Term name="Koherens" />' }],
  });
  assert.deepEqual(unusedGlossary, ["Diffraksjon"]);
});
