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

/** Every required section key, so a case can add just the one it exercises. */
const minimalSection = { order: 1, title: "M", summary: "En modul." };

test("section summary is REQUIRED (v4 migration)", () => {
  // The whole point of the v4 break: without it, every module fell back to the
  // same "<Title> — <Course title>" meta description.
  const { summary, ...withoutSummary } = minimalSection;
  assert.equal(sectionSchema.safeParse(withoutSummary).success, false);
  assert.equal(sectionSchema.parse(minimalSection).summary, "En modul.");
});

test("section takes a scalar `tag`, not a `tags` array (v3 migration)", () => {
  const ok = sectionSchema.parse({ ...minimalSection, tag: "Uke 3" });
  assert.equal(ok.tag, "Uke 3");
  // The old plural `tags: [...]` key is gone — passing it now fails.
  const legacy = sectionSchema.safeParse({
    ...minimalSection,
    tags: ["Uke 3"],
  });
  assert.equal(legacy.success, false);
});

test("section importance defaults to useful and enforces its enum", () => {
  assert.equal(sectionSchema.parse(minimalSection).importance, "useful");
  assert.equal(
    sectionSchema.safeParse({ ...minimalSection, importance: "vital" }).success,
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
  const def = sectionSchema.parse(minimalSection);
  assert.equal(def.draft, false);
  assert.equal(def.noindex, false);
  const set = sectionSchema.parse({
    ...minimalSection,
    order: 2,
    draft: true,
    noindex: true,
  });
  assert.equal(set.draft, true);
  assert.equal(set.noindex, true);
});

// ── exams[].date: month precision (v4.6) ─────────────────────────────────────
// Several NTNU sets are named after the semester, not the exam day, and carry
// no date on the paper. `YYYY-MM` lets such a row sort correctly without a
// guessed day ever entering the data (AUTHORING.md §7).

test("exams[].date accepts a full YYYY-MM-DD as day precision", () => {
  const parsed = courseSchema.parse({
    ...base,
    exams: [{ label: "Ordinær", date: "2025-11-26" }],
  });
  const d = parsed.exams[0].date;
  assert.equal(d?.precision, "day");
  assert.equal(d?.value.toISOString(), "2025-11-26T00:00:00.000Z");
});

test("exams[].date accepts a month-precision YYYY-MM", () => {
  const parsed = courseSchema.parse({
    ...base,
    exams: [{ label: "Kontinuasjon", date: "2022-08" }],
  });
  const d = parsed.exams[0].date;
  assert.equal(d?.precision, "month");
  // Stored as the 1st purely so the row sorts; never rendered as a day.
  assert.equal(d?.value.toISOString(), "2022-08-01T00:00:00.000Z");
});

test("exams[].date stays optional (an undated paper is allowed)", () => {
  const parsed = courseSchema.parse({
    ...base,
    exams: [{ label: "Ukjent" }],
  });
  assert.equal(parsed.exams[0].date, undefined);
});

test("a month-precision date sorts between the full dates around it", () => {
  const parsed = courseSchema.parse({
    ...base,
    exams: [
      { label: "des 2022", date: "2022-12-01" },
      { label: "aug 2022", date: "2022-08" },
      { label: "des 2021", date: "2021-12-14" },
    ],
  });
  const order = [...parsed.exams]
    .sort((a, b) => (b.date?.value.getTime() ?? 0) - (a.date?.value.getTime() ?? 0))
    .map((e) => e.label);
  assert.deepEqual(order, ["des 2022", "aug 2022", "des 2021"]);
});

test("a nonsense date value is rejected", () => {
  const result = courseSchema.safeParse({
    ...base,
    exams: [{ label: "Tull", date: "ikke en dato" }],
  });
  assert.equal(result.success, false);
});

test("a 13th month is not accepted as month precision", () => {
  const result = courseSchema.safeParse({
    ...base,
    exams: [{ label: "Tull", date: "2022-13" }],
  });
  assert.equal(result.success, false);
});
