import { test } from "node:test";
import assert from "node:assert/strict";
import {
  courseSchema,
  sectionSchema,
  flashcardsSchema,
  SCHEMA_VERSION,
} from "../src/schema.ts";

/** Minimal valid course (only the no-default required fields). */
const base = {
  schemaVersion: SCHEMA_VERSION,
  code: "TST101",
  title: "Test",
  term: "V2026",
};

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

test("schemaVersion is required (no default) — omitting it fails the build", () => {
  const { schemaVersion, ...noVersion } = base;
  void schemaVersion;
  const result = courseSchema.safeParse(noVersion);
  assert.equal(result.success, false);
});

test("schemaVersion must be a positive int (0, negative, float rejected)", () => {
  for (const bad of [0, -1, 2.5, "3"]) {
    const r = courseSchema.safeParse({ ...base, schemaVersion: bad });
    assert.equal(r.success, false, `schemaVersion ${bad} should be rejected`);
  }
  assert.ok(courseSchema.safeParse({ ...base, schemaVersion: 3 }).success);
});

test("a formula id must be a fragment-safe token (letters/digits/-/_ only)", () => {
  const ok = courseSchema.parse({
    ...base,
    formulas: [{ tex: "n_1\\sin\\theta_1", id: "snells-lov_1" }],
  });
  assert.equal(ok.formulas[0].id, "snells-lov_1");
  // Spaces, punctuation and non-ASCII would break the DOM id / "#fragment".
  for (const bad of ["snells lov", "θ", "id#1", "a.b", ""]) {
    const r = courseSchema.safeParse({
      ...base,
      formulas: [{ tex: "x", id: bad }],
    });
    assert.equal(r.success, false, `formula id "${bad}" should be rejected`);
  }
});

test("a typo'd / unknown course key fails the build (strictObject)", () => {
  const result = courseSchema.safeParse({ ...base, titel: "typo" });
  assert.equal(result.success, false);
});

test("an unknown key on a nested strict object is rejected", () => {
  const result = courseSchema.safeParse({
    ...base,
    features: { progres: true },
  });
  assert.equal(result.success, false);
});

test("section takes a scalar `tag`, not a `tags` array (v3 migration)", () => {
  const ok = sectionSchema.parse({ order: 1, title: "M", tag: "Uke 3" });
  assert.equal(ok.tag, "Uke 3");
  // The old plural `tags: [...]` key is gone — passing it now fails.
  const legacy = sectionSchema.safeParse({
    order: 1,
    title: "M",
    tags: ["Uke 3"],
  });
  assert.equal(legacy.success, false);
});

test("section importance defaults to useful and enforces its enum", () => {
  assert.equal(
    sectionSchema.parse({ order: 1, title: "M" }).importance,
    "useful",
  );
  assert.equal(
    sectionSchema.safeParse({ order: 1, title: "M", importance: "vital" })
      .success,
    false,
  );
});

test("flashcards cards require front + back; unknown card keys rejected", () => {
  const ok = flashcardsSchema.parse({
    cards: [{ front: "Q", back: "A" }],
  });
  assert.equal(ok.cards[0].tags.length, 0);
  const bad = flashcardsSchema.safeParse({
    cards: [{ front: "Q", back: "A", frnot: "x" }],
  });
  assert.equal(bad.success, false);
});

test("ui string overrides default to the current Norwegian chrome", () => {
  const parsed = courseSchema.parse(base);
  assert.equal(parsed.ui.formulaSheetLabel, "Formelsamling");
  assert.equal(parsed.ui.glossaryLabel, "Begreper");
  assert.equal(parsed.ui.sheetEmptyLabel, "Ingen formler matcher søket.");
  assert.equal(parsed.ui.formulaSheetOtherGroupLabel, "Andre formler");
  assert.equal(parsed.ui.glossaryOtherGroupLabel, "Andre begreper");
  assert.equal(parsed.ui.linksOtherGroupLabel, "Andre lenker");
  assert.equal(parsed.ui.deadlinesLabel, "Frister");
  assert.equal(parsed.ui.nextDeadlineLabel, "Neste frist");
  assert.equal(parsed.ui.examAuthorityNote, "Offisiell eksamensinfo");
  assert.equal(parsed.ui.hubLinkLabel, "Alle emner");
  assert.equal(parsed.ui.footerDisclaimer, "Merk at siden kan inneholde feil.");
  assert.equal(parsed.ui.reportIssueLabel, "Meld fra om eventuelle feil her.");
  // The GitHub edit→PR flow reads as a change proposal, not a raw file edit.
  assert.equal(parsed.ui.editPageLabel, "Foreslå endring");
  // Overriding one key leaves the rest at their defaults (prefault).
  const over = courseSchema.parse({
    ...base,
    ui: { formulaSheetLabel: "Sheet" },
  });
  assert.equal(over.ui.formulaSheetLabel, "Sheet");
  assert.equal(over.ui.glossaryLabel, "Begreper");
});

test("exam.authorityUrl defaults to Studentweb; exam.time stays a verbatim string", () => {
  const parsed = courseSchema.parse({ ...base, exam: { date: "2026-06-01" } });
  assert.equal(
    parsed.exam?.authorityUrl,
    "https://fsweb.no/studentweb/login.jsf?inst=FSNTNU",
  );
  // exam.time is NEVER coerced to a Date — a time-of-day Date would reintroduce
  // the UTC-midnight print bug lib/dates.ts guards; it passes through verbatim.
  const timed = courseSchema.parse({ ...base, exam: { time: "09:00" } });
  assert.equal(timed.exam?.time, "09:00");
});

test("deadlines default to [] and reject unknown keys (strictObject)", () => {
  assert.deepEqual(courseSchema.parse(base).deadlines, []);
  const ok = courseSchema.parse({
    ...base,
    deadlines: [
      {
        title: "Øving 1",
        date: "2028-09-01",
        note: "Innlevering i Blackboard",
        url: "https://example.com/oving-1",
      },
    ],
  });
  assert.equal(ok.deadlines[0].title, "Øving 1");
  const bad = courseSchema.safeParse({
    ...base,
    deadlines: [{ title: "Øving 1", date: "2028-09-01", done: true }],
  });
  assert.equal(bad.success, false);
});

test("links carry optional group + note (strictObject rejects typos)", () => {
  const ok = courseSchema.parse({
    ...base,
    links: [
      {
        label: "Forelesninger",
        url: "https://example.com/f",
        group: "Timeplan",
      },
      { label: "Notater", url: "https://example.com/n", note: "PDF" },
    ],
  });
  assert.equal(ok.links[0].group, "Timeplan");
  assert.equal(ok.links[1].note, "PDF");
  const bad = courseSchema.safeParse({
    ...base,
    links: [{ label: "x", url: "https://example.com", grup: "typo" }],
  });
  assert.equal(bad.success, false);
});

test("features defaults apply when the block is omitted (prefault)", () => {
  const parsed = courseSchema.parse(base);
  assert.deepEqual(parsed.features, {
    progress: true,
    search: true,
    flashcards: false,
    theme: true,
  });
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
