import { test } from "node:test";
import assert from "node:assert/strict";
import {
  breadcrumbList,
  courseRef,
  authorRef,
  studyGuideLd,
  learningResourceLd,
  definedTermSetLd,
  quizLd,
  flashcardQuizLd,
  hubCollectionLd,
  guideId,
  authorId,
  serializeLd,
  FLASHCARD_LD_LIMIT,
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

test("courseRef identifies the course and carries provider only when given", () => {
  const bare = courseRef({ code: "DEMO101", title: "Demokurs" });
  assert.equal(bare["@type"], "Course");
  assert.equal(bare.name, "Demokurs");
  assert.equal(bare.courseCode, "DEMO101");
  assert.ok(!("provider" in bare));
  assert.ok(!("url" in bare));

  const full = courseRef({
    code: "DEMO101",
    title: "Demokurs",
    url: "https://ntnu.no/emner/DEMO101",
    provider: "NTNU",
  });
  assert.equal(full.url, "https://ntnu.no/emner/DEMO101");
  assert.deepEqual(full.provider, { "@type": "Organization", name: "NTNU" });
});

test("studyGuideLd is a LearningResource ABOUT a course, never a Course", () => {
  const ld = studyGuideLd({
    code: "DEMO101",
    title: "Demokurs",
    description: "En studieguide.",
    url: "https://x/",
    inLanguage: "nb",
    course: { code: "DEMO101", title: "Demokurs", provider: "NTNU" },
  });
  // The whole point of the model: the SITE is not the course, and the
  // institution is never named as the site's own provider.
  assert.equal(ld["@type"], "LearningResource");
  assert.equal(ld.learningResourceType, "Study guide");
  assert.ok(!("provider" in ld));
  assert.ok(!("courseCode" in ld));

  assert.equal(ld["@id"], "https://x/#guide");
  assert.equal(ld.name, "DEMO101 Demokurs");
  assert.equal(ld.description, "En studieguide.");
  const about = ld.about as Record<string, unknown>;
  assert.equal(about["@type"], "Course");
  assert.equal(about.courseCode, "DEMO101");
  assert.deepEqual(about.provider, { "@type": "Organization", name: "NTNU" });
  // No `author` in course.yaml → no author node invented.
  assert.ok(!("author" in ld));
});

test("studyGuideLd attaches the author under the shared @id", () => {
  const url = "https://x/";
  const ld = studyGuideLd({
    code: "DEMO101",
    title: "Demokurs",
    url,
    inLanguage: "nb",
    course: { code: "DEMO101", title: "Demokurs" },
    author: { name: "Ola Nordmann", url: "https://ola.no", id: authorId(url) },
  });
  assert.deepEqual(ld.author, {
    "@type": "Person",
    "@id": "https://x/#author",
    name: "Ola Nordmann",
    url: "https://ola.no",
  });
});

test("authorRef omits url when the course sets none", () => {
  const ref = authorRef({ name: "Ola", id: "https://x/#author" });
  assert.ok(!("url" in ref));
});

test("learningResourceLd links a module to the guide @id and the course", () => {
  const ld = learningResourceLd({
    name: "Foton",
    url: "https://x/foton",
    inLanguage: "nb",
    dateModified: "2026-05-01",
    learningResourceType: "Study guide",
    about: { code: "DEMO101", title: "Demokurs" },
    partOfGuideId: guideId("https://x/"),
  });
  assert.equal(ld["@type"], "LearningResource");
  assert.equal(ld.dateModified, "2026-05-01");
  // A reference, not a re-declared inline Course — that's what joins the graph.
  assert.deepEqual(ld.isPartOf, { "@id": "https://x/#guide" });
  assert.equal((ld.about as Record<string, unknown>).courseCode, "DEMO101");
});

test("learningResourceLd omits every optional it wasn't given", () => {
  const ld = learningResourceLd({
    name: "Foton",
    url: "https://x/foton",
    inLanguage: "nb",
  });
  for (const k of [
    "dateModified",
    "about",
    "author",
    "isPartOf",
    "description",
    "learningResourceType",
  ]) {
    assert.ok(!(k in ld), `${k} should be absent`);
  }
});

test("quizLd splits options into accepted + suggested answers", () => {
  const ld = quizLd({
    question: "Hva er 2+2?",
    options: ["3", "4", "5"],
    answer: 1,
    explanation: "Fordi.",
    about: { code: "DEMO101", title: "Demokurs" },
  });
  assert.equal(ld["@type"], "Quiz");
  const q = ld.hasPart as Record<string, unknown>;
  assert.equal(q["@type"], "Question");
  assert.equal(q.eduQuestionType, "Multiple choice");
  assert.equal(q.learningResourceType, "Practice problem");
  assert.equal(q.text, "Hva er 2+2?");
  assert.deepEqual(q.acceptedAnswer, {
    "@type": "Answer",
    text: "4",
    comment: { "@type": "Comment", text: "Fordi." },
  });
  // The wrong options, in order, and never the correct one.
  assert.deepEqual(q.suggestedAnswer, [
    { "@type": "Answer", text: "3" },
    { "@type": "Answer", text: "5" },
  ]);
});

test("quizLd omits suggestedAnswer + comment when there's nothing to say", () => {
  const ld = quizLd({ question: "Sant?", options: ["Ja"], answer: 0 });
  const q = ld.hasPart as Record<string, unknown>;
  assert.ok(!("suggestedAnswer" in q));
  assert.ok(!("comment" in (q.acceptedAnswer as object)));
  assert.ok(!("about" in ld));
});

test("flashcardQuizLd maps every card to a Flashcard Question", () => {
  const ld = flashcardQuizLd({
    url: "https://x/flashcards",
    inLanguage: "nb",
    cards: [
      { front: "Foton?", back: "Lyskvant" },
      { front: "Boson?", back: "Heltallsspinn" },
    ],
  });
  assert.equal(ld["@type"], "Quiz");
  const parts = ld.hasPart as Record<string, unknown>[];
  assert.equal(parts.length, 2);
  assert.equal(parts[0].eduQuestionType, "Flashcard");
  assert.equal(parts[0].text, "Foton?");
  assert.deepEqual(parts[0].acceptedAnswer, {
    "@type": "Answer",
    text: "Lyskvant",
  });
});

test("flashcardQuizLd truncates at the cap and reports it", () => {
  const cards = Array.from({ length: FLASHCARD_LD_LIMIT + 25 }, (_, i) => ({
    front: `f${i}`,
    back: `b${i}`,
  }));
  let reported: [number, number] | null = null;
  const ld = flashcardQuizLd({
    url: "https://x/flashcards",
    inLanguage: "nb",
    cards,
    onTruncate: (kept, total) => (reported = [kept, total]),
  });
  assert.equal((ld.hasPart as unknown[]).length, FLASHCARD_LD_LIMIT);
  assert.deepEqual(reported, [FLASHCARD_LD_LIMIT, FLASHCARD_LD_LIMIT + 25]);
});

test("flashcardQuizLd stays silent when the deck fits under the cap", () => {
  let called = false;
  flashcardQuizLd({
    url: "https://x/flashcards",
    inLanguage: "nb",
    cards: [{ front: "a", back: "b" }],
    onTruncate: () => (called = true),
  });
  assert.equal(called, false);
});

test("hubCollectionLd lists each guide with its position and course code", () => {
  const ld = hubCollectionLd({
    name: "Studieguider",
    description: "Interaktive studieguider.",
    url: "https://kurs.example/",
    inLanguage: "nb",
    author: { name: "Ola", id: authorId("https://kurs.example/") },
    courses: [
      { code: "DEMO101", title: "Demokurs", url: "https://demo.example" },
      { code: "DEMO202", title: "Mer demo", url: "https://mer.example" },
    ],
  });
  assert.equal(ld["@type"], "CollectionPage");
  assert.equal(ld["@id"], "https://kurs.example/#page");
  // Inline Person, not a dangling {"@id"} reference — see hubCollectionLd.
  assert.deepEqual(ld.author, {
    "@type": "Person",
    "@id": "https://kurs.example/#author",
    name: "Ola",
  });

  const list = ld.mainEntity as Record<string, unknown>;
  assert.equal(list["@type"], "ItemList");
  assert.equal(list.numberOfItems, 2);
  const els = list.itemListElement as Record<string, unknown>[];
  assert.equal(els[0].position, 1);
  assert.equal(els[1].position, 2);
  const first = els[0].item as Record<string, unknown>;
  assert.equal(first["@type"], "LearningResource");
  assert.equal(first.name, "DEMO101 Demokurs");
  assert.equal(first.url, "https://demo.example");
  assert.equal((first.about as Record<string, unknown>).courseCode, "DEMO101");
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
