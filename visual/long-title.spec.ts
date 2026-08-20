import { test, expect } from "@playwright/test";

/**
 * Long-title wrapping (AUTHORING.md §6, lib/text.ts).
 *
 * A Norwegian course or module title is often one long compound, and `body`'s
 * `overflow-wrap: break-word` chops it mid-syllable with no hyphen. Two things
 * fix that, and this spec guards both:
 *
 *   1. the title surfaces hyphenate via the page's `lang`, and
 *   2. an author-placed soft hyphen survives into the DOM but never into the
 *      metadata built from the same string.
 *
 * Computed style + text content, never a screenshot: the soft hyphen is
 * invisible unless the line happens to break on it, so a baseline image would
 * pass just as happily with the character stripped out.
 *
 * The demo course pins the seam in section 01's title ("grunn\xADbegreper").
 */

/** U+00AD SOFT HYPHEN. */
const SHY = "­";

test("the title surfaces hyphenate in the document language", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "nb");
  // The hero heading — the widest single string a phone has to fit.
  await expect(page.locator(".hero h1")).toHaveCSS("hyphens", "auto");

  await page.goto("/oversikt");
  await expect(page.locator(".mod-head h1")).toHaveCSS("hyphens", "auto");

  // NOT the brand: it is nowrap + ellipsis by design, and hyphenating body
  // prose would fire on every line rather than on the one long word.
  await expect(page.locator(".brand-title")).toHaveCSS("hyphens", "manual");
  await expect(page.locator(".prose").first()).toHaveCSS("hyphens", "manual");
});

test("an author's soft hyphen reaches the heading and nothing else", async ({
  page,
}) => {
  await page.goto("/oversikt");

  // On screen: the break opportunity is preserved verbatim.
  const heading = await page.locator(".mod-head h1").textContent();
  expect(heading).toContain(SHY);
  expect(heading?.replace(new RegExp(SHY, "g"), "")).toBe(
    "Oversikt og grunnbegreper",
  );

  // Everywhere a machine reads the same title: stripped.
  const meta = await page.evaluate((shy) => {
    const content = (sel: string) =>
      document.querySelector<HTMLMetaElement>(sel)?.content ?? "";
    const ld = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ]
      .map((s) => s.textContent ?? "")
      .join("");
    return {
      offenders: [
        ["document.title", document.title],
        ["og:title", content('meta[property="og:title"]')],
        ["og:site_name", content('meta[property="og:site_name"]')],
        ["description", content('meta[name="description"]')],
        ["json-ld", ld],
      ]
        .filter(([, v]) => v.includes(shy))
        .map(([k]) => k),
      title: document.title,
    };
  }, SHY);

  expect(meta.offenders).toEqual([]);
  expect(meta.title).toBe("Oversikt og grunnbegreper · DEMO101");
});

test("the web manifest names the app without break hints", async ({
  request,
}) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  for (const field of ["name", "short_name", "description"] as const) {
    expect(manifest[field], `manifest.${field}`).not.toContain(SHY);
  }
});
