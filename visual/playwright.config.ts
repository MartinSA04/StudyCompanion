import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

/**
 * Visual-regression snapshots of the bundled kitchen-sink demo (ROADMAP 2.6).
 * Builds + previews the demo course, then screenshots every injected route in
 * both themes — so a scoped-CSS regression (like the theme-toggle icon-scope bug)
 * is caught on a PR instead of by eye.
 *
 * Lives in visual/ (not the repo root) on purpose: the root tsconfig's `*.ts`
 * include would otherwise type-check this file and fail on the CI-only
 * @playwright/test dependency, and Astro rewrites tsconfig on sync so an
 * `exclude` won't stick.
 *
 * Baselines are committed under kitchen-sink.spec.ts-snapshots/. They are
 * platform-specific (font rendering differs per OS), so generate them on Linux —
 * locally with `pnpm install && pnpm test:visual:update` or via the workflow's
 * manual run — then commit them. CI compares against those.
 */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  use: {
    baseURL: "http://localhost:4321",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // One command so a fresh checkout (or CI) needs no manual build step first.
  // cwd is the repo root so `pnpm build`/`preview` find astro.config.mjs.
  webServer: {
    command: "pnpm build && pnpm preview --port 4321",
    cwd: repoRoot,
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
