import { test, expect } from "@playwright/test";

/**
 * Full-page snapshots of every route the demo (DEMO101) injects, in both themes.
 * Each page groups several widgets, so this covers the widget set without a
 * per-component harness. The canvas simulation is masked (its pixels aren't
 * deterministic across runs); everything else is server-rendered and stable.
 */
const PAGES = [
  { path: "/", name: "overview" },
  { path: "/oversikt", name: "module-oversikt" },
  { path: "/eksempler", name: "module-eksempler" },
  { path: "/simulering", name: "module-simulering" },
  { path: "/mer", name: "module-mer" },
  { path: "/sammenligning", name: "module-sammenligning" },
  { path: "/formelsamling", name: "tool-formelsamling" },
  { path: "/begreper", name: "tool-begreper" },
  { path: "/flashcards", name: "tool-flashcards" },
  { path: "/eksamen", name: "tool-eksamen" },
];
const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  for (const { path, name } of PAGES) {
    test(`${name} — ${theme}`, async ({ page }) => {
      // Force the theme before any page script runs (the no-flash key is per code).
      await page.addInitScript((t) => {
        try {
          localStorage.setItem("sc:theme:DEMO101", t);
        } catch {
          /* storage blocked */
        }
      }, theme);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      // Framework contract guard: the overview module carries the demo's only
      // display-math source, so this is where a build regression that drops
      // .katex-display (e.g. $$…$$ getting parsed as inline) would surface.
      if (name === "module-oversikt") {
        await expect(page.locator(".katex-display").first()).toBeVisible();
      }
      await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
        fullPage: true,
        mask: [page.locator(".sim-canvas")],
      });
    });
  }
}
