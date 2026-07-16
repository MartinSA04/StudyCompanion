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

/**
 * Wide content (code blocks, display math, table wrappers) scrolls horizontally
 * on screen via overflow-x: auto, but paper has no scrollbar to reach the
 * overflow — so the @media print block resets these boxes to overflow: visible
 * !important, letting them spill to their natural width instead of clipping at
 * the page edge. Dropping that reset re-clips wide content on paper; the media
 * query is inert on screen, so nothing else catches it. Emulate print media and
 * assert the reset resolves for a .katex-display and a <pre>.
 */
test("print un-clips horizontally-scrolling wide content", async ({ page }) => {
  await page.emulateMedia({ media: "print" });
  const overflowX = (node: Element) => getComputedStyle(node).overflowX;

  // Display math ($$…$$) on the overview page renders a .katex-display box
  // (overflow-x: auto on screen, see base.css).
  await page.goto("/oversikt");
  await page.waitForLoadState("networkidle");
  expect(await page.locator(".katex-display").first().evaluate(overflowX)).toBe(
    "visible",
  );

  // A fenced code block on the examples page renders a <pre> (also overflow-x:
  // auto on screen).
  await page.goto("/eksempler");
  await page.waitForLoadState("networkidle");
  expect(await page.locator("pre").first().evaluate(overflowX)).toBe("visible");
});
