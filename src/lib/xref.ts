import { slugify } from "./slug.ts";

/**
 * Build-time cross-reference validation.
 *
 * `<Term>` and `<FormulaRef>` only `console.warn` on an unresolved target, and
 * only in DEV — so a production `astro build` happily emits dead links to
 * non-existent glossary/formula anchors. This pure validator closes that gap:
 * the build step (src/pages/index.astro) feeds it the parsed `course.yaml`
 * definitions plus the raw MDX bodies and FAILS the build on any dead reference.
 *
 * Anchoring matches the widgets exactly (single source of truth in `slug.ts`):
 *   - `<Term name>`        → a glossary entry whose `slugify(term)` matches.
 *   - `<FormulaRef id>`    → a `course.formulas[]` entry with that `id`.
 *   - `<Statement … id?>`  → anchor (explicit `id` or `slugify(name)`) is unique.
 *   - `course.formulas[].id` values are unique.
 *
 * Kept pure (no Astro/fs imports) so it is unit-testable in isolation.
 */

export interface XrefInput {
  /** Glossary headwords, i.e. `course.glossary[].term`. */
  glossaryTerms: string[];
  /** The `id`s actually set on `course.formulas[]` entries (skip the unset). */
  formulaIds: string[];
  /** One entry per section: a label used in messages + the raw MDX body. */
  sections: { label: string; body: string }[];
}

export interface XrefReport {
  /** Fatal problems — the build should fail on any of these. */
  errors: string[];
  /** Soft findings — glossary terms no inline `<Term>` ever links to. */
  unusedGlossary: string[];
}

/** Pull a quoted attribute value out of a single opening tag (dq or sq). */
function attr(tag: string, name: string): string | null {
  const dq = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`));
  if (dq) return dq[1];
  const sq = tag.match(new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`));
  if (sq) return sq[1];
  return null;
}

/** Every opening tag of `<Comp …>` (or self-closing) in a body. */
function openingTags(body: string, comp: string): string[] {
  return body.match(new RegExp(`<${comp}\\b[^>]*?/?>`, "g")) ?? [];
}

/**
 * Drop fenced code blocks and inline-code spans so documentation that *shows*
 * a widget (e.g. a section explaining `<Term>` in backticks) is never mistaken
 * for a real reference.
 */
function stripCode(body: string): string {
  return body.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
}

export function validateXrefs(input: XrefInput): XrefReport {
  const errors: string[] = [];

  // Defined glossary anchors from course.yaml. <Glossary> emits id={slugify(term)}
  // per row and <Term> deep-links to "#slug", so each headword must slug to a
  // unique, non-empty anchor (slugify("λ") === "" — nothing to link to).
  const glossarySlugs = new Set<string>();
  const glossaryBySlug = new Map<string, string>();
  for (const term of input.glossaryTerms) {
    const slug = slugify(term);
    if (slug === "") {
      errors.push(
        `Glossary term "${term}" slugs to an empty anchor — <Glossary> can give its row no "#id" and no <Term name="${term}"> could resolve to it; give it an ASCII-bearing headword.`,
      );
      continue;
    }
    const prior = glossaryBySlug.get(slug);
    if (prior) {
      errors.push(
        `Duplicate glossary anchor "#${slug}" (from "${prior}" and "${term}") — terms must slug to a unique id so <Term> resolves to one row.`,
      );
    } else {
      glossaryBySlug.set(slug, term);
    }
    glossarySlugs.add(slug);
  }

  // course.formulas[].id must be unique (a <FormulaRef> deep-links to "#id").
  const formulaIds = new Set<string>();
  for (const id of input.formulaIds) {
    if (formulaIds.has(id)) {
      errors.push(
        `Duplicate formula id "${id}" in course.formulas — ids must be unique so <FormulaRef id="${id}"> resolves to one row.`,
      );
    }
    formulaIds.add(id);
  }

  const referencedGlossary = new Set<string>();
  // anchor → label of the section that first defined it (for the dup message).
  const statementAnchors = new Map<string, string>();

  for (const { label, body } of input.sections) {
    const text = stripCode(body);

    for (const tag of openingTags(text, "Term")) {
      const name = attr(tag, "name");
      if (name == null) continue; // bare `<Term>` (likely prose) — skip.
      const slug = slugify(name);
      referencedGlossary.add(slug);
      if (!glossarySlugs.has(slug)) {
        errors.push(
          `${label}: <Term name="${name}"> has no matching glossary entry (looked for the row anchor "#${slug}").`,
        );
      }
    }

    for (const tag of openingTags(text, "FormulaRef")) {
      const id = attr(tag, "id");
      if (id == null) continue;
      if (!formulaIds.has(id)) {
        errors.push(
          `${label}: <FormulaRef id="${id}"> matches no formula with that id in course.formulas.`,
        );
      }
    }

    for (const tag of openingTags(text, "Statement")) {
      const explicit = attr(tag, "id");
      const name = attr(tag, "name");
      // An explicit id is emitted verbatim as the DOM id / "#fragment" (with no
      // slugify pass to normalise it), so hold it to the same shape as
      // course.formulas[].id (schema.ts). `+` also rejects id="", which the
      // slug-derived empty-anchor rule below never sees because explicit != null.
      if (explicit != null && !/^[A-Za-z0-9_-]+$/.test(explicit)) {
        errors.push(
          `${label}: <Statement id="${explicit}"> is emitted verbatim as a DOM id and a "#fragment", so it must be ASCII letters, digits, "-" or "_" (e.g. "snells-lov") — no spaces, punctuation or math.`,
        );
        continue;
      }
      const anchor = explicit ?? (name != null ? slugify(name) : null);
      // A named result with no explicit id whose name slugs to nothing (e.g.
      // name="$\nabla \times E$" — slugify strips math) would render id="" /
      // href="#". Mirror the glossary empty-anchor rule rather than skip silently.
      if (anchor === "" && explicit == null && name != null) {
        errors.push(
          `${label}: <Statement name="${name}"> slugs to an empty anchor — the boxed result gets no "#id" and no deep-link could resolve to it; give it an ASCII-bearing name or an explicit id.`,
        );
        continue;
      }
      if (!anchor) continue;
      const prior = statementAnchors.get(anchor);
      if (prior) {
        errors.push(
          `Duplicate <Statement> anchor "#${anchor}" (in ${prior} and ${label}) — deep-links would be ambiguous; set a distinct id.`,
        );
      } else {
        statementAnchors.set(anchor, label);
      }
    }
  }

  // Soft: glossary terms that no inline <Term> ever links to (dead weight, not
  // an error — a reference list legitimately holds terms used only in prose).
  const unusedGlossary = input.glossaryTerms.filter(
    (t) => !referencedGlossary.has(slugify(t)),
  );

  return { errors, unusedGlossary };
}
