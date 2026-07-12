import type { APIContext } from "astro";
import { loadCourse } from "../lib/loadCourse.ts";
import { THEME_COLOR_LIGHT } from "../lib/themeColor.ts";

// Prerendered to a static /manifest.webmanifest (4.8) so the guide is
// installable ("Add to Home Screen"). Course-derived, no per-course code. The
// referenced PNG icons are generated per-course at build (4.9, astro:build:done).
export const prerender = true;

// The install splash colours — the light-theme page ground (--bg), from the one
// source CourseLayout's <meta name="theme-color"> also reads, so the installed
// PWA's splash matches the page instead of drifting to a stale literal.
const BG = THEME_COLOR_LIGHT;

export async function GET(_context: APIContext): Promise<Response> {
  const { course } = await loadCourse();
  const manifest = {
    name: `${course.code} ${course.title}`,
    short_name: course.code,
    description: course.subtitle ?? course.title,
    lang: course.language,
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BG,
    theme_color: BG,
    categories: ["education"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
