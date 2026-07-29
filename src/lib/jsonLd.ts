/**
 * schema.org JSON-LD builders — pure data in, plain JSON-serialisable objects
 * out. The injected pages assemble the right set per page kind and hand them to
 * CourseLayout, which renders each as a `<script type="application/ld+json">`.
 *
 * Everything is built from data already present (`course.yaml` + section
 * frontmatter + the nav model). URLs are passed in already resolved (absolute
 * when `site` is set, root-relative otherwise) so this stays pure and testable.
 * Validate output against Google's Rich Results test.
 *
 * ## What this site claims to be
 *
 * A study guide is `about` a course; it IS NOT the course. Every builder here
 * holds that line: the guide is a `LearningResource`, and the university only
 * ever appears as the `provider` of the `Course` referenced under `about`
 * (see `courseRef`). Asserting `Course` + `provider: <university>` on the site
 * itself would claim an institutional authorship the footer disclaimer denies.
 *
 * ## `@id` wiring
 *
 * Pages are separate documents, so their JSON-LD is only ONE graph if the nodes
 * share stable identifiers. Two per site, both derived from the overview URL:
 * `<site>/#guide` (the guide as a whole) and `<site>/#author`. A module's
 * `isPartOf` points at `#guide` rather than re-declaring the guide inline, and
 * the same `#author` node recurs on every page — repeating a node under one
 * `@id` is how JSON-LD expresses "the same thing", not duplication.
 */

const CONTEXT = "https://schema.org" as const;

/** Stable `@id` for the guide as a whole, given its overview URL. */
export function guideId(overviewUrl: string): string {
  return `${overviewUrl}#guide`;
}

/** Stable `@id` for the guide's author, given the overview URL. */
export function authorId(overviewUrl: string): string {
  return `${overviewUrl}#author`;
}

/**
 * Serialize a JSON-LD object for a `<script type="application/ld+json">`, with
 * `<` escaped so a glossary definition that contains inline HTML can never break
 * out of the script element (the standard ld+json XSS guard).
 */
export function serializeLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export interface Crumb {
  name: string;
  url: string;
}

/** A breadcrumb trail (Oversikt › … › this page). */
export function breadcrumbList(items: Crumb[]) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export interface CourseRefOpts {
  /** Course code, e.g. "TDT4120". */
  code: string;
  /** Course title WITHOUT the code, e.g. "Algoritmer og datastrukturer". */
  title: string;
  /** The official university course page (`course.yaml` `courseUrl`). */
  url?: string;
  /** The institution that actually runs the course (`institution`). */
  provider?: string;
}

/**
 * The OFFICIAL course this guide is about — a nested reference, never a
 * top-level node. This is the one place `provider` may name the university,
 * because here the claim is true: NTNU provides TDT4120. It carries no `@id`;
 * it identifies the course by `courseCode` + the official `url`, which is what
 * lets a search engine connect every module of this guide to the same subject.
 */
export function courseRef(opts: CourseRefOpts) {
  const ref: Record<string, unknown> = {
    "@type": "Course",
    name: opts.title,
    courseCode: opts.code,
  };
  if (opts.url) ref.url = opts.url;
  if (opts.provider) {
    ref.provider = { "@type": "Organization", name: opts.provider };
  }
  return ref;
}

export interface AuthorOpts {
  name: string;
  url?: string;
  /** Stable cross-page identifier — `authorId(overviewUrl)`. */
  id: string;
}

/** The guide's author, as an inline node carrying the shared `@id`. */
export function authorRef(opts: AuthorOpts) {
  const ref: Record<string, unknown> = {
    "@type": "Person",
    "@id": opts.id,
    name: opts.name,
  };
  if (opts.url) ref.url = opts.url;
  return ref;
}

/**
 * The guide as a whole — emitted on the overview. A `LearningResource` ABOUT a
 * course, not a `Course`: see the authorship note at the top of this file.
 */
export function studyGuideLd(opts: {
  code: string;
  title: string;
  description?: string;
  url: string;
  inLanguage: string;
  course: CourseRefOpts;
  author?: AuthorOpts;
}) {
  const ld: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "LearningResource",
    "@id": guideId(opts.url),
    name: `${opts.code} ${opts.title}`,
    learningResourceType: "Study guide",
    url: opts.url,
    inLanguage: opts.inLanguage,
    about: courseRef(opts.course),
  };
  if (opts.description) ld.description = opts.description;
  if (opts.author) ld.author = authorRef(opts.author);
  return ld;
}

/**
 * A single module — a LearningResource, emitted per section page. `about`
 * repeats the course reference so each module connects to the subject on its
 * own (a module page is frequently the entry point from search, with the
 * overview never crawled in the same session), and `isPartOf` points at the
 * guide's `@id` instead of re-declaring the guide inline.
 */
export function learningResourceLd(opts: {
  name: string;
  description?: string;
  url: string;
  inLanguage: string;
  dateModified?: string;
  learningResourceType?: string;
  about?: CourseRefOpts;
  author?: AuthorOpts;
  /** `@id` of the guide this module belongs to — `guideId(overviewUrl)`. */
  partOfGuideId?: string;
}) {
  const ld: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "LearningResource",
    name: opts.name,
    url: opts.url,
    inLanguage: opts.inLanguage,
  };
  if (opts.learningResourceType)
    ld.learningResourceType = opts.learningResourceType;
  if (opts.description) ld.description = opts.description;
  if (opts.dateModified) ld.dateModified = opts.dateModified;
  if (opts.about) ld.about = courseRef(opts.about);
  if (opts.author) ld.author = authorRef(opts.author);
  if (opts.partOfGuideId) ld.isPartOf = { "@id": opts.partOfGuideId };
  return ld;
}

/** The glossary — a DefinedTermSet, emitted on the Begreper tool page. */
export function definedTermSetLd(opts: {
  name: string;
  url: string;
  inLanguage: string;
  terms: { term: string; definition: string; id: string }[];
}) {
  return {
    "@context": CONTEXT,
    "@type": "DefinedTermSet",
    name: opts.name,
    url: opts.url,
    inLanguage: opts.inLanguage,
    hasDefinedTerm: opts.terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.definition,
      "@id": `${opts.url}#${t.id}`,
      url: `${opts.url}#${t.id}`,
    })),
  };
}

/**
 * Cap on how many flashcards get structured data. The flashcards page already
 * ships every card in the DOM, so an uncapped 300-card deck would roughly
 * double that page's HTML weight to restate text a crawler has already read —
 * with no additional ranking benefit, since Google samples rather than rewards
 * volume. `flashcardQuizLd` logs when it truncates.
 */
export const FLASHCARD_LD_LIMIT = 100;

/**
 * One multiple-choice question, as Google's "practice problems" rich result
 * (schema.org `Quiz` + `Question`). Emitted INLINE by `<Quiz>` rather than
 * assembled page-level: quiz instances live inside MDX bodies rendered through
 * `<Content />`, so page frontmatter cannot see them without a remark pass over
 * the MDX AST. JSON-LD in `<body>` is fully supported, and a component that
 * emits its own markup can never drift from what it actually rendered.
 *
 * Text must arrive already stripped of KaTeX delimiters and inline HTML
 * (`stripInline` in lib/seo.ts) — structured data is plain text.
 *
 * `answer` is the 0-based index of the correct option, exactly as `<Quiz>`
 * takes it; out-of-range indices are the component's build-time guard to
 * reject, not this builder's.
 */
export function quizLd(opts: {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  about?: CourseRefOpts;
}) {
  const accepted: Record<string, unknown> = {
    "@type": "Answer",
    text: opts.options[opts.answer],
  };
  if (opts.explanation) {
    accepted.comment = { "@type": "Comment", text: opts.explanation };
  }
  const question: Record<string, unknown> = {
    "@type": "Question",
    eduQuestionType: "Multiple choice",
    learningResourceType: "Practice problem",
    text: opts.question,
    acceptedAnswer: accepted,
  };
  const wrong = opts.options.filter((_, i) => i !== opts.answer);
  if (wrong.length) {
    question.suggestedAnswer = wrong.map((text) => ({
      "@type": "Answer",
      text,
    }));
  }
  const ld: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "Quiz",
    hasPart: question,
  };
  if (opts.about) ld.about = courseRef(opts.about);
  return ld;
}

/**
 * The whole flashcard deck as ONE `Quiz` of `eduQuestionType: "Flashcard"`
 * questions — page-level, because `flashcards.yaml` is data the tool page
 * already holds in full (unlike the MDX-embedded `<Quiz>` above).
 *
 * Truncates to `FLASHCARD_LD_LIMIT` cards; pass `onTruncate` to surface that in
 * the build log. Cards arrive already stripped of KaTeX and inline HTML.
 */
export function flashcardQuizLd(opts: {
  url: string;
  inLanguage: string;
  cards: { front: string; back: string }[];
  about?: CourseRefOpts;
  onTruncate?: (kept: number, total: number) => void;
}) {
  const total = opts.cards.length;
  const kept = opts.cards.slice(0, FLASHCARD_LD_LIMIT);
  if (total > kept.length) opts.onTruncate?.(kept.length, total);

  const ld: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "Quiz",
    url: opts.url,
    inLanguage: opts.inLanguage,
    hasPart: kept.map((c) => ({
      "@type": "Question",
      eduQuestionType: "Flashcard",
      learningResourceType: "Practice problem",
      text: c.front,
      acceptedAnswer: { "@type": "Answer", text: c.back },
    })),
  };
  if (opts.about) ld.about = courseRef(opts.about);
  return ld;
}

/**
 * The course-hub one-pager: a `CollectionPage` whose `mainEntity` lists every
 * guide. The list items are OFF-SITE URLs, so this will not win a Google
 * carousel (those require same-site items) — its job is entity
 * disambiguation, binding the hub and the guides it links into one graph.
 */
export function hubCollectionLd(opts: {
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  author?: AuthorOpts;
  courses: { code: string; title: string; url: string }[];
}) {
  const ld: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    "@id": `${opts.url}#page`,
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.inLanguage,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.courses.length,
      itemListElement: opts.courses.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LearningResource",
          name: `${c.code} ${c.title}`,
          learningResourceType: "Study guide",
          url: c.url,
          about: courseRef({ code: c.code, title: c.title }),
        },
      })),
    },
  };
  // Inline, not a bare {"@id"} reference: a reference needs a node defining it,
  // and a second top-level script would have to restate "@context" to be valid
  // on its own. Embedding matches how studyGuideLd carries its author, and the
  // shared @id still joins the hub's Person to each guide's.
  if (opts.author) ld.author = authorRef(opts.author);
  return ld;
}
