import { test, expect } from "@playwright/test";

/**
 * KaTeX draws `\vec` as an absolutely positioned <svg> inside `.accent-body`,
 * a box KaTeX itself gives `width: 0` so the arrow can overhang the letter.
 * base.css's media reset (`img, svg, … { max-width: 100% }`) resolved against
 * that zero-width containing block and capped every arrow at 0px: $\vec r$
 * rendered as a plain r on all six course sites. KaTeX's own `height: inherit`
 * and the inline width beat the reset; only max-width leaked through.
 *
 * Measured, not snapshotted: the arrow is ~7px wide, well inside the 1%
 * pixel tolerance of a full-page baseline.
 */

test("every KaTeX accent arrow has its drawn width", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 844 });
  // Demo section 01 carries \vec{E} and \vec{B} in display math.
  await page.goto("/oversikt");
  const arrows = await page.evaluate(() =>
    [...document.querySelectorAll<SVGElement>(".katex .accent svg")].map(
      (svg) => ({
        // What KaTeX asked for: the inline `style="width:0.471em"`.
        wanted:
          parseFloat(svg.style.width) *
          parseFloat(getComputedStyle(svg).fontSize),
        // What the reader gets.
        got: svg.getBoundingClientRect().width,
        computed: getComputedStyle(svg).width,
      }),
    ),
  );
  expect(arrows.length).toBeGreaterThan(0);
  for (const a of arrows) {
    expect(a.got).toBeGreaterThan(0);
    expect(Math.abs(a.got - a.wanted)).toBeLessThan(1);
  }
});
