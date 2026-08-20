import { test, expect } from "@playwright/test";

/**
 * The disclosure chevron (`.sc-chev`) on Solution / Hint / Derivation / Answer.
 *
 * `.sc-summary` is a flex row, and the chevron was a flex item at the default
 * `flex-shrink: 1` — so a long summary label squeezed the glyph instead of
 * wrapping: a 13px chevron measured 7.7px next to a full-sentence label. The
 * icon is a fixed-size glyph; the label is what should give.
 */

/** The nominal size every disclosure passes to <Icon>. */
const NOMINAL = 13;

test("the chevron keeps its size next to a long label", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/mer");

  const before = await page.locator("summary.sc-summary .sc-chev svg").first();
  await expect(before).toBeVisible();

  const sizes = await page.evaluate(() => {
    // A label long enough to overflow the row at phone width — the real case is
    // a Norwegian sentence label, not the demo's one-word ones.
    const long =
      "Vis fullstendig løsning med alle mellomregninger og kommentarer";
    for (const s of document.querySelectorAll("summary.sc-summary")) {
      const label = s.querySelector(".sum-closed") ?? s.lastElementChild;
      if (label) label.textContent = long;
    }
    return [
      ...document.querySelectorAll("summary.sc-summary .sc-chev svg"),
    ].map((svg) => +svg.getBoundingClientRect().width.toFixed(2));
  });

  expect(sizes.length).toBeGreaterThan(0);
  for (const w of sizes) expect(w).toBeCloseTo(NOMINAL, 0);
});

test("the chevron is excluded from flex shrinking", async ({ page }) => {
  await page.goto("/mer");
  await expect(page.locator(".sc-chev").first()).toHaveCSS("flex-shrink", "0");
});
