import { test, expect } from "@playwright/test";

/**
 * base.css overrides two of katex.min.css's rules — `.katex` font-size and
 * `.katex-display` text-align — and must win them by SPECIFICITY, never by
 * stylesheet order. katex.min.css is only linked on pages that carry math, and
 * Astro's ClientRouter keeps stylesheets already in the head where they are
 * and appends the new ones at the end: navigating from a no-math page to a
 * math page puts katex.min.css AFTER the layout CSS. When the overrides relied
 * on order that navigation centred every display block and grew inline math
 * to KaTeX's 1.21em, and a reload snapped it all back.
 *
 * Both load paths are asserted so they can never disagree again.
 */

type Probe = {
  sheets: string[];
  displayAlign: string[];
  displayInner: string[];
  /** Display-math .katex font-size ÷ its parent's font-size. */
  displayRatio: number[];
  /** Inline prose .katex font-size ÷ its parent's font-size. */
  inlineRatio: number[];
};

async function probe(page: import("@playwright/test").Page): Promise<Probe> {
  return page.evaluate(() => {
    const fs = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
    const ratio = (el: Element) => fs(el) / fs(el.parentElement!);
    const displays = [...document.querySelectorAll(".katex-display")];
    const inline = [
      ...document.querySelectorAll<HTMLElement>(".prose p > .katex"),
    ];
    return {
      sheets: [...document.querySelectorAll("link[rel=stylesheet]")].map((l) =>
        (l.getAttribute("href") ?? "").replace(/\.[^./]+\.css$/, ".css"),
      ),
      displayAlign: displays.map((d) => getComputedStyle(d).textAlign),
      displayInner: displays.map(
        (d) => getComputedStyle(d.querySelector(".katex")!).textAlign,
      ),
      displayRatio: displays.map((d) => ratio(d.querySelector(".katex")!)),
      inlineRatio: inline.map(ratio),
    };
  });
}

function expectDesign(p: Probe) {
  expect(p.displayAlign.length).toBeGreaterThan(0);
  expect(p.inlineRatio.length).toBeGreaterThan(0);
  for (const a of p.displayAlign) expect(a).toBe("left");
  for (const a of p.displayInner) expect(a).toBe("left");
  // Display math at KaTeX's shipped 1.21em; inline prose math at base.css's 1.05em.
  for (const r of p.displayRatio) expect(r).toBeCloseTo(1.21, 2);
  for (const r of p.inlineRatio) expect(r).toBeCloseTo(1.05, 2);
}

test.describe("KaTeX overrides survive stylesheet reordering", () => {
  test("hard load of a math page", async ({ page }) => {
    await page.goto("/oversikt");
    const p = await probe(page);
    // The authored order: katex.min.css first, then the layout CSS.
    expect(p.sheets.indexOf("/_astro/katex.min.css")).toBeLessThan(
      p.sheets.indexOf("/_astro/CourseLayout.css"),
    );
    expectDesign(p);
  });

  test("client-side navigation from a page without math", async ({ page }) => {
    await page.goto("/");
    // The overview page carries no KaTeX, so it never linked katex.min.css.
    expect((await probe(page)).sheets).not.toContain("/_astro/katex.min.css");
    await page.click('a[href="/oversikt"]');
    await page.waitForURL("**/oversikt");
    await page.waitForSelector(".katex-display");
    const p = await probe(page);
    // The precondition this spec exists for: ClientRouter appended KaTeX's
    // sheet after the layout CSS. If Astro ever changes that, the assertions
    // below still hold — this line only documents what the test exercises.
    expect(p.sheets.indexOf("/_astro/katex.min.css")).toBeGreaterThan(
      p.sheets.indexOf("/_astro/CourseLayout.css"),
    );
    expectDesign(p);
  });
});
