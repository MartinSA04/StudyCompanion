import { test, expect } from "@playwright/test";

/**
 * Symboler on a phone stacks each row — the symbol and its unit on one line,
 * the meaning across the card's full width below — instead of squeezing three
 * columns into ~330px. The rows are restyled with display: grid, which makes
 * browsers drop native table semantics, so the markup restates them with ARIA
 * roles; Chrome's accessibility tree must still see a table. A group with no
 * units at all has no unit column. The demo's "Notasjon" group is unit-less
 * and holds the wide two-symbol row.
 */

test("phone: each row stacks, the meaning spans the card, and it is still a table", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/symboler");
  const layout = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".sym-row")].map((row) => {
      const card = row.closest(".sym-card")!.getBoundingClientRect();
      const tex = row.querySelector(".sym-tex")!.getBoundingClientRect();
      const meaning = row
        .querySelector(".sym-meaning")!
        .getBoundingClientRect();
      return {
        below: meaning.top >= tex.bottom - 1,
        spans: meaning.width > card.width * 0.8,
        inside: [...row.children].every(
          (c) => c.getBoundingClientRect().right <= card.right + 0.5,
        ),
      };
    }),
  );
  expect(layout.length).toBeGreaterThan(0);
  for (const row of layout)
    expect(row).toEqual({ below: true, spans: true, inside: true });

  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const roles = new Set(
    nodes.map((n: { role?: { value?: string } }) => n.role?.value),
  );
  for (const role of ["table", "row", "columnheader", "rowheader", "cell"])
    expect(roles.has(role), role).toBe(true);
});

test("a group with no units renders without the unit column", async ({
  page,
}) => {
  await page.goto("/symboler");
  const columns = await page.evaluate(() =>
    [...document.querySelectorAll(".sym-group")].map((g) => ({
      title: g.querySelector(".sym-group-title")?.textContent?.trim() ?? "",
      headers: g.querySelectorAll("thead th").length,
      unitCells: g.querySelectorAll(".sym-unit").length,
    })),
  );
  const notation = columns.find((c) => c.title.endsWith("Notasjon"))!;
  expect(notation).toMatchObject({ headers: 2, unitCells: 0 });
  expect(columns.filter((c) => c.headers === 3).length).toBeGreaterThan(0);
});
