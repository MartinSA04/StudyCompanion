import { test, expect } from "@playwright/test";

/**
 * Replaces footer-edit.spec.ts: the "·"-separator contract it guarded died
 * when the freshness/edit pair moved OUT of the footer into the .page-meta
 * row and the trust line became one flowing sentence. What must hold now:
 * the pair reads as MODULE-level metadata (above the footer separator,
 * freshness left / feedback link right), and the trust line reads as a
 * sentence whose report link is a real anchor — with no separator dot
 * anywhere. The feedback link is a PREFILLED new-issue deep-link, not
 * GitHub's /edit/ route (which walls non-collaborators behind a fork
 * prompt): it must carry the module anchor in its title param.
 */
test("module meta sits above the footer, freshness left, feedback right", async ({
  page,
}) => {
  await page.goto("/oversikt");
  const meta = page.locator(".page-meta");
  await expect(meta).toBeVisible();
  // Directly above the footer's separator rule, not inside the footer.
  expect(await page.locator(".page-meta + .site-footer").count()).toBe(1);
  expect(await page.locator(".site-footer .page-meta").count()).toBe(0);

  const feedback = page.locator(".page-meta-feedback");
  await expect(feedback).toHaveAttribute("href", /\/issues\/new\?/);
  const href = (await feedback.getAttribute("href"))!;
  expect(new URL(href).searchParams.get("title")).toMatch(/^\[\d+ · /);
  const [row, updated, feedbackBox] = await Promise.all([
    meta.boundingBox(),
    page.locator(".page-meta-updated").boundingBox(),
    feedback.boundingBox(),
  ]);
  // Left/right ends of the row (flex space-between), not a centered line.
  expect(Math.abs(updated!.x - row!.x)).toBeLessThan(2);
  expect(
    Math.abs(feedbackBox!.x + feedbackBox!.width - (row!.x + row!.width)),
  ).toBeLessThan(2);
});

test("footer trust line is one sentence with a real report link", async ({
  page,
}) => {
  await page.goto("/oversikt");
  const trust = page.locator(".footer-trust");
  // Full default wording — also catches a stale content-layer cache serving
  // old ui strings (schema-default changes don't invalidate it; see docs).
  await expect(trust).toContainText("Merk at siden kan inneholde feil.");
  const link = trust.locator("a");
  await expect(link).toHaveText("Meld fra om eventuelle feil her.");
  await expect(link).toHaveAttribute("href", /\/issues\/new$/);
  expect(await trust.textContent()).not.toContain("·");
});
