import { test, expect } from "@playwright/test";

/**
 * Mobile-viewport snapshots. Runs only under the "mobile" project (a Pixel 5
 * profile — see playwright.config.ts), which is why these live in their own spec
 * the desktop project ignores. The desktop kitchen-sink suite never exercises
 * the narrow layout: the collapsed sidebar, the stacked <Compare> grid, and —
 * the reason Sidenote is here — its inline-aside fallback. Sidenote only floats
 * into the margin strip ≥1200px; below that it falls back to a quiet inline
 * aside on the reading column, which no desktop shot captures.
 */
const PAGES = [
  // Sidenote lives on /oversikt — captured here in its inline-aside state.
  { path: "/oversikt", name: "module-oversikt" },
  // Compare lives on /sammenligning — captured here stacked to one column.
  { path: "/sammenligning", name: "module-sammenligning" },
  { path: "/", name: "overview" },
];

for (const { path, name } of PAGES) {
  test(`${name} — mobile`, async ({ page }) => {
    // Force light so a drifting OS theme can't flip the baseline.
    await page.addInitScript(() => {
      try {
        localStorage.setItem("sc:theme:DEMO101", "light");
      } catch {
        /* storage blocked */
      }
    });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    // The project name ("mobile") is already appended to the snapshot filename
    // by Playwright's default path template, so the arg stays unsuffixed.
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      mask: [
        page.locator(".sim-canvas"),
        // Same contract as kitchen-sink.spec.ts: countdown PHRASES (exam pill
        // + deadline lede) drift every run and get masked; deadline rows carry
        // data-exam-countdown only for client auto-hide and render
        // deterministic dates/titles, so they stay asserted.
        page.locator("[data-exam-countdown]:not([data-countdown-no-text])"),
      ],
    });
  });
}
