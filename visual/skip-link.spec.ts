import { test, expect } from "@playwright/test";

/**
 * «Hopp til innhold» targets <main id="content">. With no scroll margin the
 * jump put main's top edge at the viewport top, under the sticky topbar, so
 * the h1 it opens with was hidden. `.content` carries the topbar height plus
 * the layout's top padding as scroll-margin-top (shell.css): the h1 lands
 * where it sits on a fresh load, below the bar.
 */
test("the skip link lands the h1 below the sticky topbar", async ({ page }) => {
  await page.goto("/oversikt");
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#content")).toBeFocused();

  const clearance = () =>
    page.evaluate(() => {
      const bar = document.querySelector(".topbar")!.getBoundingClientRect();
      const h1 = document.querySelector("main h1")!.getBoundingClientRect();
      return h1.top - bar.bottom;
    });
  await expect.poll(clearance).toBeGreaterThanOrEqual(0);
});
