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
  // Ports are discovered at runtime (see webServer): each `astro preview` binds a
  // free port and prints it, and Playwright's `wait.stdout` capture exports it as
  // SC_DEMO_PORT / SC_HUB_PORT. Workers re-load this config after the servers are
  // up, so this baseURL resolves to the demo's actual port; the fallback is only
  // for the brief main-process load before capture (which never navigates).
  use: {
    baseURL: `http://localhost:${process.env.SC_DEMO_PORT ?? 4321}`,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // One `build && preview` per site so a fresh checkout (or CI) needs no manual
  // build step first. cwd is the repo root so pnpm scripts find their configs.
  //
  // No fixed port/url on purpose. `astro preview` picks a free port (drifting off
  // its default when something — a dev server on 4321, a stray preview — already
  // holds it) and prints "http://localhost:<port>/"; `wait.stdout`'s named capture
  // group stores that port in the environment (SC_DEMO_PORT / SC_HUB_PORT) for the
  // tests to read. Because there is no port/url to probe, Playwright can't reuse
  // an ambient server — it always starts its own fresh production build and follows
  // it to whatever port it lands on. So the suite is hermetic: it never collides
  // with, nor screenshots, whatever else happens to be running.
  webServer: [
    {
      name: "demo",
      command: "pnpm build && pnpm preview",
      cwd: repoRoot,
      stdout: "pipe",
      wait: { stdout: /http:\/\/localhost:(?<sc_demo_port>\d+)/ },
      timeout: 120_000,
    },
    {
      name: "hub",
      command: "pnpm hub:build && pnpm hub:preview --port 4322",
      cwd: repoRoot,
      stdout: "pipe",
      wait: { stdout: /http:\/\/localhost:(?<sc_hub_port>\d+)/ },
      timeout: 120_000,
    },
  ],
});
