import type { APIContext } from "astro";

// Prerendered to a static /robots.txt at build: allow-all plus a pointer
// to the sitemap when `site` is set. Per-page `noindex` is expressed with
// a meta tag, so robots.txt stays a simple allow + sitemap pointer.
export const prerender = true;

export function GET(context: APIContext): Response {
  const lines = ["User-agent: *", "Allow: /"];
  if (context.site) {
    lines.push("", `Sitemap: ${new URL("/sitemap.xml", context.site).href}`);
  }
  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
