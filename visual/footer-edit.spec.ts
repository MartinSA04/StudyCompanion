import { test, expect } from "@playwright/test";

/**
 * The "·" between the freshness note and "Rediger denne siden" is punctuation
 * for the footer line, not part of the link. Generated inside the anchor it
 * would take the hover underline, sit inside the focus ring and hit area, and
 * leak into the link's accessible name.
 */
test("footer edit-link separator is not part of the link", async ({
  page,
}) => {
  await page.goto("/oversikt");
  const link = page.locator(".footer-edit");
  await expect(link).toBeVisible();
  // No generated dot inside the anchor…
  expect(
    await link.evaluate((el) => getComputedStyle(el, "::before").content),
  ).toBe("none");
  // …but the separator still renders, on the preceding span.
  expect(
    await page
      .locator(".footer-meta span")
      .first()
      .evaluate((el) => getComputedStyle(el, "::after").content),
  ).toContain("·");
});
