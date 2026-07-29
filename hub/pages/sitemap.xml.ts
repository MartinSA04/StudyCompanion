import type { APIContext } from "astro";

/**
 * Hub twin of src/pages/sitemap.xml.ts. The hub is a one-pager, so this holds a
 * single `<loc>` — it exists so robots.txt has a standard target, and so any
 * future hub route is covered by construction rather than by remembering.
 *
 * No `<lastmod>`: the hub's content changes whenever a course is added to
 * courses.yaml, and there is no build-stable date for that (a build timestamp
 * would claim freshness on every deploy, which is worse than claiming none).
 */
export const prerender = true;

export async function GET(context: APIContext): Promise<Response> {
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `  <url><loc>${new URL("/", context.site!).href}</loc></url>\n` +
    "</urlset>\n";

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
