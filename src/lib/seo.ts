/**
 * SEO helpers — pure string / URL logic shared by the injected pages, the
 * sitemap/manifest endpoints and CourseLayout. Kept dependency-free and
 * side-effect-free (bar the one once-guarded DEV warning) so it unit-tests with
 * the built-in `node:test` runner, like the rest of `src/lib`.
 *
 * Everything here is derived from data already in `course.yaml` + section
 * frontmatter — no new required schema, no per-course logic.
 */

/** Open Graph locale for a course `language` (the schema's `nb | nn | en`). */
export function ogLocale(language: string): string {
  switch (language) {
    case "nn":
      return "nn_NO";
    case "en":
      return "en_US";
    case "nb":
    default:
      return "nb_NO";
  }
}

/**
 * Collapse whitespace and soft-truncate to ~`max` chars at a word boundary
 * (Google renders ~155–160). Returns a trimmed single-line string; appends an
 * ellipsis only when it actually cut. Empty/whitespace input → "".
 */
export function truncateDescription(text: string, max = 155): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  // Prefer a word boundary, but don't chop more than ~40% off chasing one.
  const body = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return body.replace(/[\s.,;:–—-]+$/, "") + "…";
}

/**
 * Strip inline HTML tags and `$…$` KaTeX delimiters from a glossary/definition
 * string so it can sit in a plain-text context (meta description, JSON-LD).
 * Keeps the inner text; collapses whitespace.
 */
export function stripInline(text: string): string {
  return (text ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\$+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strip a trailing slash (except on the site root "/") so the canonical /
 * og:url / sitemap / JSON-LD URLs all agree on one form for a page — the
 * slug-derived URLs have no trailing slash, so the canonical (from Astro.url,
 * which carries one under the default directory build) is normalised to match.
 */
export function trimTrailingSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Absolute URL for `path` under `site`, or the path unchanged when `site` is
 * unset (graceful degradation — relative URLs still render, just aren't usable
 * by social crawlers / `rel=canonical`). `path` is treated as site-root-relative.
 */
export function absoluteUrl(path: string, site?: URL | string): string {
  if (!site) return path;
  return new URL(path, site).href;
}

let siteWarned = false;
/**
 * Warn ONCE per build that `site` is unset, so canonical / Open Graph / sitemap
 * absolute URLs were skipped. Called from CourseLayout in DEV only; the
 * module-level guard keeps it to a single line however many pages render.
 */
export function warnMissingSiteOnce(): void {
  if (siteWarned) return;
  siteWarned = true;
  console.warn(
    "[study-companion] `site` is not set in astro.config.mjs — canonical, " +
      "Open Graph and sitemap URLs need an absolute origin, so they were " +
      'skipped. Add e.g. `site: "https://<course>.example.com"` to the course ' +
      "config (see ROADMAP 4.1).",
  );
}
