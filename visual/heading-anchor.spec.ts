import { test, expect } from "@playwright/test";

/**
 * The hover "#" deep-link injected into prose headings by PageToc.astro.
 *
 * It used to be an inline box appended after the heading text, which made it
 * compete for room on the last line: a heading whose text already filled the
 * column (a single long Norwegian word, at 320–345px) pushed the marker onto a
 * row of its own — a lone "#" under an unwrapped heading. The marker now gets
 * its own grid column, so it can never be the thing that wraps.
 *
 * Measured, not snapshotted: the marker is a hover affordance, so a baseline
 * image of the resting state would not see it at all.
 */

const PAGES = [
  "/oversikt",
  "/eksempler",
  "/simulering",
  "/mer",
  "/sammenligning",
];

/** Headings whose marker sits below the heading's own text lines. */
async function orphanedMarkers(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const bad: string[] = [];
    for (const h of document.querySelectorAll<HTMLElement>(
      ".prose :is(h2, h3)",
    )) {
      const a = h.querySelector<HTMLElement>(".heading-anchor");
      if (!a) continue;
      // Measure the heading's own text, whatever wraps it: everything before
      // the marker. Deliberately not `.heading-text` — this must measure the
      // same thing before and after the fix, or it passes vacuously.
      const range = document.createRange();
      range.setStart(h, 0);
      range.setEndBefore(a);
      const lines = [...range.getClientRects()].filter((r) => r.width > 0);
      if (!lines.length) continue;
      const marker = a.getBoundingClientRect();
      if (marker.top >= lines[lines.length - 1].bottom - 1) {
        bad.push(h.textContent?.replace("#", "").trim().slice(0, 40) ?? "");
      }
    }
    return bad;
  });
}

test("the deep-link marker never takes a row of its own", async ({ page }) => {
  const offenders: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    // Sweep the narrow end: this is a wrap artifact, visible only at the widths
    // where a heading's text happens to fill its last line. 320px is the
    // narrowest phone still in use (iPhone SE 1st gen).
    for (let w = 320; w <= 600; w += 5) {
      await page.setViewportSize({ width: w, height: 844 });
      for (const h of await orphanedMarkers(page)) {
        offenders.push(`${path} @${w}px — "${h}"`);
      }
    }
  }
  expect(offenders).toEqual([]);
});

test("the marker never runs off the edge or widens the page", async ({
  page,
}) => {
  // The first attempt at this fix used `auto` tracks, whose min-content floor is
  // the whole unbreakable word — the grid then overflowed its heading and put
  // the marker 27.6px past a 320px viewport, taking the document into
  // horizontal scroll. Guard both the marker and the document.
  const offenders: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    await page.addStyleTag({
      content: ".heading-anchor { opacity: 1 !important; }",
    });
    for (let w = 320; w <= 600; w += 5) {
      await page.setViewportSize({ width: w, height: 844 });
      const r = await page.evaluate((vw) => {
        let worst = -Infinity;
        for (const a of document.querySelectorAll(".heading-anchor")) {
          worst = Math.max(worst, a.getBoundingClientRect().right - vw);
        }
        return { worst, doc: document.documentElement.scrollWidth - vw };
      }, w);
      if (r.worst > 0)
        offenders.push(
          `${path} @${w}px — marker ${r.worst.toFixed(1)}px past the edge`,
        );
      if (r.doc > 0)
        offenders.push(
          `${path} @${w}px — document ${r.doc}px wider than the viewport`,
        );
    }
  }
  expect(offenders).toEqual([]);
});

test("the marker sits beside the heading text, not away from it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 844 });
  await page.goto("/oversikt");
  const gaps = await page.evaluate(() => {
    const out: number[] = [];
    for (const h of document.querySelectorAll<HTMLElement>(".prose h2")) {
      const a = h.querySelector<HTMLElement>(".heading-anchor");
      if (!a) continue;
      const range = document.createRange();
      range.setStart(h, 0);
      range.setEndBefore(a);
      const text = [...range.getClientRects()].filter((r) => r.width > 0).pop();
      if (!text) continue;
      out.push(a.getBoundingClientRect().left - text.right);
    }
    return out;
  });
  expect(gaps.length).toBeGreaterThan(0);
  // Hugging the text, not parked at the far right of the column.
  for (const g of gaps) expect(g).toBeLessThan(24);
});

test("on a heading that wraps, the marker centres against the block", async ({
  page,
}) => {
  // The cost of giving the marker its own column: it can no longer trail the
  // LAST word of a wrapped heading — it sits at the text column's right edge.
  // Centring it there is the intended resting place, not an accident: baseline
  // alignment leaves it dangling at the top right of a four-line heading.
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/simulering");
  const wrapped = await page.evaluate(() => {
    for (const h of document.querySelectorAll<HTMLElement>(
      ".prose :is(h2, h3)",
    )) {
      const a = h.querySelector<HTMLElement>(".heading-anchor");
      const text = h.querySelector<HTMLElement>(".heading-text");
      if (!a || !text) continue;
      // .heading-text is a grid item, so it is blockified — getClientRects() on
      // it gives one border box, not one rect per line. Range over its contents
      // to actually count the lines.
      const range = document.createRange();
      range.selectNodeContents(text);
      const lines = [...range.getClientRects()].filter((r) => r.width > 0);
      if (lines.length < 2) continue;
      const marker = a.getBoundingClientRect();
      const block = text.getBoundingClientRect();
      return {
        lines: lines.length,
        // Centre-to-centre against the whole text block, not its first line.
        offsetFromCentre: Math.abs(
          (marker.top + marker.bottom) / 2 - (block.top + block.bottom) / 2,
        ),
        firstLineHeight: lines[0].height,
        besideColumn: marker.left >= block.right - 1,
      };
    }
    return null;
  });
  test.skip(!wrapped, "no heading wraps at 320px on this page");
  expect(wrapped!.lines).toBeGreaterThan(1);
  expect(wrapped!.offsetFromCentre).toBeLessThan(2);
  // Guard the regression the centring replaces: on a multi-line heading, a
  // baseline-aligned marker sits a full line-height or more above centre.
  expect(wrapped!.offsetFromCentre).toBeLessThan(wrapped!.firstLineHeight);
  expect(wrapped!.besideColumn).toBe(true);
});

test("a heading carrying KaTeX keeps its math inline", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 844 });
  // Demo section 01 carries `### Identiteten $e^{i\pi} + 1 = 0$`.
  await page.goto("/oversikt");
  const mathHeadings = await page.evaluate(() => {
    const out = [];
    for (const h of document.querySelectorAll<HTMLElement>(
      ".prose :is(h2, h3)",
    )) {
      if (!h.querySelector(".katex")) continue;
      out.push({
        // The grid must see exactly two items: the text span and the marker.
        // Anything else means the math got split into columns of its own.
        children: [...h.children].map((c) => c.className.split(" ")[0]),
        mathInsideText: !!h.querySelector(".heading-text .katex"),
        rows: new Set(
          [...h.querySelectorAll<HTMLElement>(".katex")].map((m) =>
            Math.round(m.getBoundingClientRect().top),
          ),
        ).size,
      });
    }
    return out;
  });
  test.skip(!mathHeadings.length, "demo has no heading with inline math");
  for (const h of mathHeadings) {
    expect(h.children).toEqual(["heading-text", "heading-anchor"]);
    expect(h.mathInsideText).toBe(true);
  }
});
