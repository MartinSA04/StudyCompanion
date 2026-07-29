import { test, expect } from "@playwright/test";

/**
 * The installed-app top inset (display: standalone).
 *
 * CourseLayout opts into a full-screen web view — `viewport-fit=cover` plus
 * `apple-mobile-web-app-status-bar-style=black-translucent` — so on a notched
 * iPhone the page is laid out from y=0, UNDER the status bar and Dynamic Island.
 * The sticky `.topbar` therefore pins into a band where iOS intercepts touches
 * and its controls (menu, search, theme) become physically untappable. Safari
 * never shows this, because Safari's own chrome occupies that band; only the
 * installed app does. That asymmetry is why it shipped.
 *
 * `env(safe-area-inset-top)` cannot be emulated in Chromium, so the fix routes
 * it through the `--safe-top` token and these tests override that token. Both
 * the bar itself and everything keyed to `--topbar-h` must track it: padding the
 * bar alone would move the controls clear but leave every derived offset —
 * heading scroll-margin, the sidebar dock — short by the inset.
 */

/** iPhone 16 Pro Dynamic Island inset, in CSS px. */
const INSET = 59;

test.use({ viewport: { width: 390, height: 844 } });

test("the topbar clears a top safe-area inset instead of pinning under it", async ({
  page,
}) => {
  await page.goto("/oversikt");
  const inner = page.locator(".topbar-inner");
  const mark = page.locator(".brand-mark");

  const [barBefore, markBefore] = await Promise.all([
    inner.boundingBox(),
    mark.boundingBox(),
  ]);

  await page.addStyleTag({ content: `:root { --safe-top: ${INSET}px; }` });

  const [barAfter, markAfter] = await Promise.all([
    inner.boundingBox(),
    mark.boundingBox(),
  ]);

  // The bar reserves exactly the inset...
  expect(barAfter!.height - barBefore!.height).toBeCloseTo(INSET, 0);
  // ...by moving its controls down, not by growing the background around them.
  expect(markAfter!.y - markBefore!.y).toBeCloseTo(INSET, 0);
  // The whole mark clears the reserved band — the untappable-control symptom.
  expect(markAfter!.y).toBeGreaterThanOrEqual(INSET);
});

test("--topbar-h tracks the inset so anchored headings clear the bar", async ({
  page,
}) => {
  await page.goto("/oversikt");
  const heading = page.locator(".prose :is(h2, h3, h4)").first();
  const scrollMargin = () =>
    heading.evaluate((el) =>
      parseFloat(getComputedStyle(el).scrollMarginTop || "0"),
    );

  const before = await scrollMargin();
  await page.addStyleTag({ content: `:root { --safe-top: ${INSET}px; }` });
  const after = await scrollMargin();

  // scroll-margin-top is calc(var(--topbar-h) + var(--gap-4)); if --topbar-h
  // stays a bare literal, a deep-linked heading lands under the taller bar.
  expect(after - before).toBeCloseTo(INSET, 0);
});
