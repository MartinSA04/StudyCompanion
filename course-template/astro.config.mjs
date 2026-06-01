import { defineConfig } from "astro/config";
import studyCompanion from "study-companion";

// The integration injects all pages, the MDX+KaTeX pipeline, and the Pagefind
// search index. The only thing a course declares here is its canonical origin.
export default defineConfig({
  // REQUIRED: this guide's public origin (no trailing path). The framework reads
  // it for the canonical link, Open Graph / Twitter cards and the sitemap — set
  // it to your real deploy URL. Without it those absolute-URL features are
  // skipped (with a dev warning). See study-companion ROADMAP §4.1.
  site: "https://your-course.example.com",
  integrations: [studyCompanion()],
});
