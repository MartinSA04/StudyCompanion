import type { APIContext } from "astro";

// Hub twin of src/pages/robots.txt.ts: allow-all plus a pointer to the
// sitemap. `site` is pinned in astro.config.hub.mjs, so unlike the course
// version there is no missing-origin branch to degrade through.
export const prerender = true;

export function GET(context: APIContext): Response {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${new URL("/sitemap.xml", context.site!).href}`,
  ];
  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
