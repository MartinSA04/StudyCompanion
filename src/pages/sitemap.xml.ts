import type { APIContext } from "astro";
import { loadCourse } from "../lib/loadCourse.ts";
import { sectionSlug, TOOL_SLUGS } from "../lib/nav.ts";

// Prerendered to a static /sitemap.xml at build (4.5). Hand-rolled rather than
// pulling in @astrojs/sitemap: it keeps the near-zero-dependency stance and
// gives full control to honour per-section `noindex` (4.6) and emit `lastmod`
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

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: new URL("/", site).href },
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
