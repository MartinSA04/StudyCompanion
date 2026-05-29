import { defineConfig } from "astro/config";
import studyCompanion from "study-companion";

// The integration injects all pages, the MDX+KaTeX pipeline, and the Pagefind
// search index. A course never configures anything else here.
export default defineConfig({ integrations: [studyCompanion()] });
