import type { Course } from "../schema.ts";
import { absoluteUrl } from "./seo.ts";
import { authorId, type AuthorOpts, type CourseRefOpts } from "./jsonLd.ts";
import { plain } from "./text.ts";

/**
 * The three things every page's JSON-LD needs from `course.yaml`: the overview
 * URL that `@id`s hang off, the reference to the OFFICIAL course this guide is
 * about, and the author node. Derived once here so the overview, the module
 * pages and the tool pages cannot disagree about `@id`s — which would silently
 * split the site's structured data into disconnected graphs.
 *
 * `site` unset degrades the same way the rest of the SEO surface does: URLs
 * stay root-relative (so `@id`s become "/#guide") rather than being omitted.
 */
export interface CourseGraph {
  /** Absolute (or root-relative) URL of the overview — the graph's anchor. */
  overviewUrl: string;
  /** Passed to `courseRef`/`studyGuideLd` as the subject of the guide. */
  course: CourseRefOpts;
  /** Undefined when `course.yaml` sets no `author` (never guessed). */
  author?: AuthorOpts;
}

export function courseGraph(course: Course, site?: URL | string): CourseGraph {
  const overviewUrl = absoluteUrl("/", site);
  return {
    overviewUrl,
    course: {
      code: course.code,
      // Structured data, so the on-screen wrapping hints come out (lib/text.ts):
      // a crawler must see the course spelled the way it is spelled.
      title: plain(course.title),
      // The institution provides the COURSE, never this guide — see jsonLd.ts.
      url: course.courseUrl,
      provider: course.institution,
    },
    author: course.author
      ? {
          name: course.author,
          url: course.authorUrl,
          id: authorId(overviewUrl),
        }
      : undefined,
  };
}
