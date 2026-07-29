import { test, expect } from "@playwright/test";

/**
 * Touch ergonomics of the shell chrome.
 *
 * Both branches run under the desktop `chromium` project, because the `mobile`
 * project is scoped to `**\/mobile.spec.ts` by design (so the kitchen-sink shots
 * aren't re-rendered at phone size). Each describe sets its own context instead:
 * `hasTouch` makes `(pointer: coarse)` match, verified rather than assumed. A
 * full `devices[...]` descriptor can't be used here — it sets
 * `defaultBrowserType`, which Playwright refuses inside a describe group.
 *
 * The pairing IS the guard: it catches the touch floor being lost, and it
 * catches the touch floor leaking onto desktop, where 38px is a deliberate
 * marginalia density rather than an oversight.
 *
 * These MUST assert via boundingBox / computed style, never via a screenshot.
 * Taking a `fullPage` screenshot drops the coarse-pointer state mid-capture —
 * measured directly: the menu toggle reads 44x44 before `page.screenshot({
 * fullPage: true })` and 38x38 after it. So mobile.spec.ts's baselines record
 * the 38px chrome and always will; that is the harness, not a regression. Don't
 * "fix" those baselines, and don't try to cover the touch floor with a snapshot.
 */

/** Apple HIG / Material minimum tap target, in CSS px. */
const FLOOR = 44;

test.describe("touch pointer", () => {
  test.use({
    viewport: { width: 393, height: 852 },
    hasTouch: true,
    isMobile: true,
  });

  test("chrome controls meet the 44px touch floor", async ({ page }) => {
    await page.goto("/oversikt");
    // Every tap target in the topbar, whatever its class: the menu toggle plus
    // the .sc-icon-btn family (search, theme).
    const controls = page.locator(
      ".topbar .menu-toggle, .topbar .sc-icon-btn, .topbar button",
    );
    const count = await controls.count();
    expect(count, "no topbar controls found to measure").toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const control = controls.nth(i);
      if (!(await control.isVisible())) continue;
      const box = (await control.boundingBox())!;
      const label = await control.evaluate(
        (el) => el.className || el.tagName.toLowerCase(),
      );
      expect(
        Math.min(box.width, box.height),
        `${label} is ${box.width}x${box.height}, under the ${FLOOR}px floor`,
      ).toBeGreaterThanOrEqual(FLOOR);
    }
  });

  test("the drawer's close button meets the floor too", async ({ page }) => {
    await page.goto("/oversikt");
    await page.locator(".menu-toggle").click();
    const close = page.locator(".sidebar-close");
    await expect(close).toBeVisible();
    const box = (await close.boundingBox())!;
    // It used to be a magic 40px, just under the floor and out of step with the
    // token every other control sizes off.
    expect(
      Math.min(box.width, box.height),
      `.sidebar-close is ${box.width}x${box.height}`,
    ).toBeGreaterThanOrEqual(FLOOR);
  });

  test("the drawer does not chain its scroll to the page", async ({ page }) => {
    await page.goto("/oversikt");
    const behavior = await page
      .locator(".sidebar")
      .evaluate((el) => getComputedStyle(el).overscrollBehaviorY);
    // Without containment, scrolling past the end of the nav scrolls the
    // article behind the open drawer.
    expect(behavior).toBe("contain");
  });
});

test.describe("fine pointer", () => {
  test("desktop keeps the denser 38px chrome", async ({ page }) => {
    await page.goto("/oversikt");
    const h = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--control-h",
      ),
    );
    // A pointer-keyed bump must not reach a mouse: widening every control by
    // 6px on desktop would loosen the marginalia chrome DESIGN.md calls for.
    expect(h.trim()).toBe("38px");
  });
});
