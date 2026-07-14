import { test } from "node:test";
import assert from "node:assert/strict";
import {
  breadcrumbList,
  courseLd,
  learningResourceLd,
  definedTermSetLd,
  serializeLd,
} from "../src/lib/jsonLd.ts";

test("breadcrumbList numbers items from 1 with name + item", () => {
  const ld = breadcrumbList([
    { name: "Oversikt", url: "https://x/" },
    { name: "Foton", url: "https://x/foton" },
  ]);
  assert.equal(ld["@type"], "BreadcrumbList");
  const els = ld.itemListElement;
  assert.equal(els.length, 2);
  assert.deepEqual(els[0], {
    "@type": "ListItem",
    position: 1,
    name: "Oversikt",
    item: "https://x/",
  });
  assert.equal(els[1].position, 2);
});

test("courseLd carries code/name/lang and optional description + provider", () => {
  const bare = courseLd({
    code: "DEMO101",
    title: "Demokurs",
    url: "https://x/",
    inLanguage: "nb",
  });
  assert.equal(bare["@type"], "Course");
  assert.equal(bare.name, "DEMO101 Demokurs");
  assert.equal(bare.courseCode, "DEMO101");
  assert.equal(bare.inLanguage, "nb");
  assert.ok(!("description" in bare));
  assert.ok(!("provider" in bare));

  const full = courseLd({
    code: "DEMO101",
    title: "Demokurs",
    description: "En studieguide.",
    url: "https://x/",
    inLanguage: "nb",
    provider: { name: "NTNU", url: "https://ntnu.no" },
  });
  assert.equal(full.description, "En studieguide.");
  assert.deepEqual(full.provider, {
    "@type": "Organization",
    name: "NTNU",
    url: "https://ntnu.no",
  });
});

test("learningResourceLd includes dateModified + isPartOf when given", () => {
  const ld = learningResourceLd({
    name: "Foton",
    url: "https://x/foton",
    inLanguage: "nb",
    dateModified: "2026-05-01",
    isPartOf: { name: "DEMO101 Demokurs", url: "https://x/" },
  });
  assert.equal(ld["@type"], "LearningResource");
  assert.equal(ld.dateModified, "2026-05-01");
  const isPartOf = ld.isPartOf as { "@type": string; url: string };
  assert.equal(isPartOf["@type"], "Course");
  assert.equal(isPartOf.url, "https://x/");
});

test("serializeLd escapes < so inline HTML can't break out of the script", () => {
  const out = serializeLd({ description: "<b>x</b> & </script>" });
  assert.ok(!out.includes("</script>"));
  assert.ok(out.includes("\\u003c"));
  // Still valid JSON round-trips back to the original string.
  assert.equal(JSON.parse(out).description, "<b>x</b> & </script>");
});

test("definedTermSetLd maps terms to DefinedTerm with stable #id urls", () => {
  const ld = definedTermSetLd({
    name: "Begreper",
    url: "https://x/begreper",
    inLanguage: "nb",
    terms: [{ term: "Foton", definition: "Lyskvant", id: "foton" }],
  });
  assert.equal(ld["@type"], "DefinedTermSet");
  assert.equal(ld.hasDefinedTerm.length, 1);
  const t = ld.hasDefinedTerm[0];
  assert.equal(t["@type"], "DefinedTerm");
  assert.equal(t.name, "Foton");
  assert.equal(t.url, "https://x/begreper#foton");
  assert.equal(t["@id"], "https://x/begreper#foton");
});
