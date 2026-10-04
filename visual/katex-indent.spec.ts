import { test, expect, type Page } from "@playwright/test";

/**
 * The hanging indent base.css gives a display formula (so an `\allowbreak`
 * continuation hangs) must be inert while the formula fits. text-indent
 * inherits, and WebKit sizes every nested KaTeX box whose line starts with an
 * inline-block — fraction rows, accents, limits, `aligned` cells — as if the
 * indent applied: 1.5em of blank per box, centred rows pushed sideways. That
 * shipped v4.10.0–v4.12.1 and spread every such formula on iOS while Chromium
 * rendered it fine, so this spec runs in both engines (playwright.config.ts).
 *
 * The check: every chunk (`.base`) keeps its width when all indents inside
 * KaTeX are forced to zero. At desktop width nothing wraps, so any difference
 * is the indent leaking into the layout.
 */
type Chunk = { tex: string; width: number };

async function chunks(page: Page): Promise<Chunk[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".katex-html > .base")].map(
      (b) => ({
        tex:
          b
            .closest(".katex")
            ?.querySelector("annotation")
            ?.textContent?.slice(0, 60) ?? "",
        width: b.getBoundingClientRect().width,
      }),
    ),
  );
}

for (const path of ["/oversikt", "/mer", "/formelsamling"]) {
  test(`${path}: the hanging indent never resizes a formula that fits`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path);
    // Formulas in a closed <details> (hints, solutions) get no real layout,
    // and their first read is stale until the fonts they need load — open
    // them and let those fonts arrive before the baseline measurement.
    await page.evaluate(async () => {
      document.querySelectorAll("details").forEach((d) => (d.open = true));
      document.body.getBoundingClientRect();
      await document.fonts.ready;
    });
    const shipped = await chunks(page);
    expect(shipped.length).toBeGreaterThan(0);

    await page.addStyleTag({
      content: ".katex, .katex * { text-indent: 0 !important; }",
    });
    const zeroed = await chunks(page);

    expect(zeroed.length).toBe(shipped.length);
    const resized = shipped
      .map((c, i) => ({ ...c, zeroed: zeroed[i].width }))
      .filter((c) => Math.abs(c.width - c.zeroed) > 0.5);
    expect(resized).toEqual([]);
  });
}
