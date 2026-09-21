import { test, expect, type Page } from "@playwright/test";

/**
 * A top-level `\allowbreak` is the one place a nowrap formula may wrap, and
 * only when the line overflows (base.css). /mer carries the same formula as a
 * display block and as a <Formula> card, /formelsamling as a sheet row; all
 * must stay on one line at desktop width and wrap exactly at the seam —
 * continuation hanging in from the left edge, no horizontal scroll — at
 * phone width.
 */
type Chunk = { left: number; marked: boolean };
type Probe = { lines: Chunk[][]; scrolls: boolean }[];

async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => {
    const hosts = [
      ...document.querySelectorAll<HTMLElement>(
        ".katex-html:has(> .base > .allowbreak)",
      ),
    ];
    return hosts.map((h) => {
      const viewport = h.closest<HTMLElement>(
        ".katex-display, .fx, .fs-render",
      )!;
      // Chunks (.base) sit on a line left to right, each with its own strut
      // height, so their tops disagree even on one line; a chunk that starts
      // LEFT of its predecessor is the first on a new line.
      const lines: Chunk[][] = [];
      let prevLeft = -Infinity;
      for (const b of h.querySelectorAll<HTMLElement>(":scope > .base")) {
        const left = Math.round(b.getBoundingClientRect().left);
        if (left < prevLeft || lines.length === 0) lines.push([]);
        lines[lines.length - 1].push({
          left,
          marked: !!b.querySelector(":scope > .allowbreak"),
        });
        prevLeft = left;
      }
      return { lines, scrolls: viewport.scrollWidth > viewport.clientWidth };
    });
  });
}

const PAGES = [
  { path: "/mer", count: 2 }, // the display block and the <Formula> card
  { path: "/formelsamling", count: 1 }, // the sheet row
];

for (const { path, count } of PAGES) {
  test(`${path}: desktop one line; phone two lines split at the seam`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.waitForSelector(".katex-html:has(> .base > .allowbreak)");

    await page.setViewportSize({ width: 1280, height: 900 });
    const wide = await probe(page);
    expect(wide.length).toBe(count);
    for (const f of wide) {
      expect(f.lines.length).toBe(1);
      expect(f.scrolls).toBe(false);
    }

    await page.setViewportSize({ width: 393, height: 851 }); // Pixel 5
    const narrow = await probe(page);
    expect(narrow.length).toBe(count);
    for (const f of narrow) {
      expect(f.lines.length).toBe(2);
      const [line1, line2] = f.lines;
      // The last chunk on line 1 is the one that carries \allowbreak.
      expect(line1[line1.length - 1].marked).toBe(true);
      expect(line2.some((c) => c.marked)).toBe(false);
      // The continuation hangs in from the line-1 left edge and never scrolls.
      expect(line2[0].left).toBeGreaterThan(line1[0].left + 10);
      expect(f.scrolls).toBe(false);
    }
  });
}
