import { test, expect } from "@playwright/test";

/**
 * Print coverage. Paper has no disclosure triangles, so the layout force-opens
 * every collapsed <details> (solutions, derivations, self-check answers) in a
 * `beforeprint` handler — CSS alone can't reveal closed-<details> content. This
 * asserts that a collapsed <Solution> body IS visible once printing is emulated,
 * so a regression that drops the handler (and silently prints empty solutions)
 * fails here.
 */
test("print reveals a collapsed <Solution> body", async ({ page }) => {
  await page.goto("/eksempler");
  await page.waitForLoadState("networkidle");

  const solution = page.locator(".solution").first();
  const body = solution.locator(".solution-body");
  // Baseline: closed on screen, so its body is hidden.
  await expect(solution).not.toHaveAttribute("open", "");
  await expect(body).toBeHidden();

  await page.emulateMedia({ media: "print" });
  // emulateMedia switches the CSS media query but does NOT fire `beforeprint`
  // (only a real print / window.print() does) — dispatch it so the layout's
  // print-prep handler runs, exactly as it would for an actual print.
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));

  await expect(solution).toHaveAttribute("open", "");
  await expect(body).toBeVisible();
});
