import type { APIContext } from "astro";
import { loadCourse } from "../lib/loadCourse.ts";
import { THEME_COLOR_LIGHT } from "../lib/themeColor.ts";
import { plain } from "../lib/text.ts";

// Prerendered to a static /manifest.webmanifest so the guide is
// installable ("Add to Home Screen"). Course-derived, no per-course code. The
// referenced PNG icons are generated per-course at build (astro:build:done).
export const prerender = true;

// The install splash colours — the light-theme page ground (--bg), from the one
// source CourseLayout's <meta name="theme-color"> also reads, so the installed
// PWA's splash matches the page instead of drifting to a stale literal.
const BG = THEME_COLOR_LIGHT;

export async function GET(_context: APIContext): Promise<Response> {
  const { course } = await loadCourse();
  const manifest = {
    // Stable app identity, independent of start_url. Without `id` a browser keys
    // the installed app to start_url, so ever changing that would register as a
    // brand-new app rather than an update to this one. Each course is its own
    // origin, so "/" is already unique. Ignored by iOS, which does not install
    // from the manifest at all.
    id: "/",
    // `plain()`: the manifest is the installed app's identity — home-screen
    // label, task switcher, store listing. Wrapping hints do not belong there.
    name: `${course.code} ${plain(course.title)}`,
    short_name: course.code,
    description: plain(course.subtitle ?? course.title),
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
