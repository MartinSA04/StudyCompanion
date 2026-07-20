import { test, expect } from "@playwright/test";

/**
 * Full-page snapshots of the course hub (kurs.martinsundal.no) in both themes.
 * The hub previews on its own port — the second webServer entry, whose actual
 * port `wait.stdout` captured into SC_HUB_PORT — so use.baseURL (the demo) does
 * not apply here; navigate its absolute URL.
 */
const HUB = `http://localhost:${process.env.SC_HUB_PORT ?? 4322}/`;
const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  test(`hub — ${theme}`, async ({ page }) => {
    // The preview serves a production build, which carries the GoatCounter
    // tag: block it so tests neither flake on the CDN nor count as traffic.
    await page.route("https://gc.zgo.at/**", (route) => route.abort());
    await page.addInitScript((t) => {
      try {
        localStorage.setItem("sc:theme:hub", t);
      } catch {
        /* storage blocked */
      }
    }, theme);
    await page.goto(HUB);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`hub-${theme}.png`, {
      fullPage: true,
      // Tile exam countdowns SSR a live "om N dager" that drifts every day, so
      // mask the pills — the tile ORDER (sorted by exam date) stays asserted.
      mask: [page.locator("[data-exam-countdown]")],
    });
  });
}
