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

/**
 * Shiki paints code with an INLINE dark theme (background-color:#1c1b1a on the
 * <pre>, per-token color on each <span>; see shiki-flexoki.ts) that never
 * theme-switches. Print defaults to print-color-adjust: economy, which drops the
 * background fill — so an un-corrected printout renders light Flexoki ink on
 * dropped white (~1.6:1). The @media print block forces pure black-on-white ink
 * economy, with !important to beat Shiki's inline styles. Emulate print media
 * and assert both the <pre> and a descendant token span resolve to that.
 */
test("print forces Shiki code blocks to black-on-white ink economy", async ({
  page,
}) => {
  await page.emulateMedia({ media: "print" });
  await page.goto("/eksempler");
  await page.waitForLoadState("networkidle");

  const pre = page.locator("pre.astro-code").first();
  const paint = (node: Element) => {
    const s = getComputedStyle(node);
    return { color: s.color, background: s.backgroundColor };
  };
  // The forced fill/ink resolve to pure white/black despite Shiki's inline theme.
  expect(await pre.evaluate(paint)).toEqual({
    color: "rgb(0, 0, 0)",
    background: "rgb(255, 255, 255)",
  });
  // A syntax-token <span> carries its own inline color — assert the !important
  // override reaches descendants, not just the <pre>.
  expect(
    await pre
      .locator("span")
      .first()
      .evaluate((n) => getComputedStyle(n).color),
  ).toBe("rgb(0, 0, 0)");
});

/**
 * The page-meta row (freshness line + "Foreslå endring" edit link) is on-screen
 * chrome, not article content — the edit link is a dead affordance on paper. The
 * @media print block hides it alongside the site-footer (they were one element
 * before the v3.3.0 footer-to-page-meta split, and the footer already printed
 * hidden). Assert .page-meta resolves to display:none under print emulation so a
 * regression that drops it from the hide list re-exposes the dead link on paper.
 */
test("print hides the page-meta row (freshness + edit link)", async ({
  page,
}) => {
  await page.goto("/eksempler");
  await page.waitForLoadState("networkidle");

  const meta = page.locator(".page-meta").first();
  // Baseline: the row IS shown on screen (edit link is a live affordance there).
  await expect(meta).toBeVisible();

  await page.emulateMedia({ media: "print" });
  expect(await meta.evaluate((n) => getComputedStyle(n).display)).toBe("none");
});

/**
 * Screen reserves a stable scrollbar gutter (base.css) so the centered column
 * never shifts between scrolling and non-scrolling pages; paper has no
 * scrollbar, so the print block must release it or the column prints with a
 * blank strip and sits off-axis. Mirrors the screen="stable" guard in
 * flashcards-touch.spec.ts.
 */
test("print releases the reserved scrollbar gutter", async ({ page }) => {
  await page.goto("/oversikt");
  await page.emulateMedia({ media: "print" });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarGutter,
    ),
  ).toBe("auto");
});
