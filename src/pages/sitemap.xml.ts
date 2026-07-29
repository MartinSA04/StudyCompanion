import type { APIContext } from "astro";
import { loadCourse } from "../lib/loadCourse.ts";
import { sectionSlug, TOOL_SLUGS } from "../lib/nav.ts";

// Prerendered to a static /sitemap.xml at build. Hand-rolled rather than
// pulling in @astrojs/sitemap: it keeps the near-zero-dependency stance and
// gives full control to honour per-section `noindex` and emit `lastmod`
// from each section's `updated`. Draft sections are already gone — loadCourse
// drops them in a production build.
export const prerender = true;

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(context: APIContext): Promise<Response> {
  const site = context.site;
  const headers = { "Content-Type": "application/xml; charset=utf-8" };

  // No absolute origin → <loc> can't be built. Emit a valid empty urlset (the
  // missing-`site` DEV warning has already fired from CourseLayout, see 4.1).
  if (!site) {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n',
      { headers },
    );
  }

  const { sections, tools } = await loadCourse();

  // The overview's freshness is the freshest module it links to: it has no
  // `updated` of its own, and a guide whose newest module moved yesterday is a
  // page worth recrawling. Indexed sections only — a noindexed or draft
  // module's date must not leak a signal about a page that isn't in the map.
  const newest = sections
    .filter((s) => !s.data.noindex && s.data.updated)
    .reduce<
      Date | undefined
    >((max, s) => (!max || s.data.updated! > max ? s.data.updated! : max), undefined);

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: new URL("/", site).href, lastmod: newest?.toISOString() },
  ];
  for (const s of sections) {
    if (s.data.noindex) continue; // out of search, out of the sitemap
    urls.push({
      loc: new URL(`/${sectionSlug(s.id)}`, site).href,
      lastmod: s.data.updated?.toISOString(),
    });
  }
  const toolRoutes: [boolean, string][] = [
    [tools.formulas, TOOL_SLUGS.formulas],
    [tools.glossary, TOOL_SLUGS.glossary],
    [tools.flashcards, TOOL_SLUGS.flashcards],
    [tools.exams, TOOL_SLUGS.exams],
  ];
  for (const [on, slug] of toolRoutes) {
    if (on) urls.push({ loc: new URL(`/${slug}`, site).href });
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${xmlEscape(u.loc)}</loc>` +
          (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "") +
          `</url>`,
      )
      .join("\n") +
    "\n</urlset>\n";

  return new Response(body, { headers });
}
