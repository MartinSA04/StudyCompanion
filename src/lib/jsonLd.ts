/**
 * schema.org JSON-LD builders — pure data in, plain JSON-serialisable objects
 * out. The injected pages assemble the right set per page kind and hand them to
 * CourseLayout, which renders each as a `<script type="application/ld+json">`.
 *
 * Everything is built from data already present (`course.yaml` + section
 * frontmatter + the nav model); no new schema. URLs are passed in already
 * resolved (absolute when `site` is set, root-relative otherwise) so this stays
 * pure and testable. Validate output against Google's Rich Results test.
 */

const CONTEXT = "https://schema.org" as const;

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

/** The course itself — emitted on the overview. */
export function courseLd(opts: {
  code: string;
  title: string;
  description?: string;
  url: string;
  inLanguage: string;
  provider?: { name: string; url?: string };
}) {
  const ld: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "Course",
    name: `${opts.code} ${opts.title}`,
    courseCode: opts.code,
    url: opts.url,
    inLanguage: opts.inLanguage,
  };
  if (opts.description) ld.description = opts.description;
  if (opts.provider) {
    ld.provider = {
      "@type": "Organization",
      name: opts.provider.name,
      ...(opts.provider.url ? { url: opts.provider.url } : {}),
    };
  }
  return ld;
}

/** A single module — a LearningResource, emitted per section page. */
export function learningResourceLd(opts: {
  name: string;
  description?: string;
  url: string;
  inLanguage: string;
  dateModified?: string;
  isPartOf?: { name: string; url: string };
}) {
  const ld: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "LearningResource",
    name: opts.name,
    url: opts.url,
    inLanguage: opts.inLanguage,
  };
  if (opts.description) ld.description = opts.description;
  if (opts.dateModified) ld.dateModified = opts.dateModified;
  if (opts.isPartOf) {
    ld.isPartOf = {
      "@type": "Course",
      name: opts.isPartOf.name,
      url: opts.isPartOf.url,
    };
  }
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
