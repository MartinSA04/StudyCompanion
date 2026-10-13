import { test, expect, type Page } from "@playwright/test";

/**
 * What a search engine reads from the SERVED HTML, before any script runs.
 *
 * The countdown pills ("om 42 dager") are true only on the day the site was
 * built. Google took one for the exam page's snippet and kept showing it for
 * weeks. Every pill must sit inside a `data-nosnippet` span/div/section in
 * the static HTML: Google honours the attribute on those three elements only,
 * and only when the server sends it, not when a script adds it later.
 */
const HUB = `http://localhost:${process.env.SC_HUB_PORT ?? 4322}/`;

/** Parse the page's HTML as served, ignoring what scripts did to the DOM. */
async function served(page: Page, url: string) {
  await page.route("https://gc.zgo.at/**", (route) => route.abort());
  await page.goto(url);
  return page.evaluate(async () => {
    const html = await (await fetch(location.href)).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const pills = [...doc.querySelectorAll(".sc-countdown")].map((el) => ({
      text: el.textContent?.trim() ?? "",
      guard: el.closest("[data-nosnippet]")?.tagName.toLowerCase() ?? null,
    }));
    const ld = [
      ...doc.querySelectorAll('script[type="application/ld+json"]'),
    ].map((s) => JSON.parse(s.textContent ?? "{}"));
    const meta = (sel: string) =>
      doc.querySelector(sel)?.getAttribute("content") ?? null;
    return {
      pills,
      ld,
      title: doc.title,
      description: meta('meta[name="description"]'),
      siteName: meta('meta[property="og:site_name"]'),
    };
  });
}

for (const [label, path] of [
  ["overview", "/"],
  ["exam page", "/eksamen"],
  ["hub", HUB],
] as const) {
  test(`${label}: every countdown pill is data-nosnippet`, async ({ page }) => {
    const { pills } = await served(page, path);
    expect(pills.length).toBeGreaterThan(0);
    for (const p of pills)
      expect(["span", "div", "section"], `pill "${p.text}"`).toContain(p.guard);
  });

  test(`${label}: a WebSite node names the site as og:site_name does`, async ({
    page,
  }) => {
    // Only the home page counts for Google's site name, so skip /eksamen.
    test.skip(path === "/eksamen", "site name is read from the home page");
    const { ld, siteName } = await served(page, path);
    const site = ld.find((n) => n["@type"] === "WebSite");
    expect(site?.name).toBe(siteName);
  });
}

test("overview title and description carry the words a course is searched by", async ({
  page,
}) => {
  const { title, description } = await served(page, "/");
  expect(title).toBe("DEMO101 Demokurs · Kompendium · Example University");
  expect(description).toBe(
    "Kompendium i DEMO101 Demokurs ved Example University: moduler med " +
      "læringsmål, kjerneteori, formler og selvtest.",
  );
  // No module count: a snippet would keep it after modules are added.
  expect(description).not.toMatch(/\d+ moduler?/);
});

test("exam page leads with the exam date and names the course", async ({
  page,
}) => {
  const { title, description } = await served(page, "/eksamen");
  expect(title).toBe("Eksamen · DEMO101 Demokurs");
  expect(description).toMatch(/^Eksamen \S+ \d{1,2}\. \S+ \d{4}\. /);
  expect(description).toMatch(
    /\. Kompendium i DEMO101 Demokurs ved Example University\.$/,
  );
});

// Norwegian typography has no long dash (WRITING.md), and these strings are
// what a search result shows. Only pages whose title and description the
// framework composes: a module's come from its author (an en dash inside a
// name like Stern–Gerlach is correct there).
for (const path of ["/", "/eksamen", "/formelsamling", HUB])
  test(`no dash joins the title or description of ${path}`, async ({
    page,
  }) => {
    const { title, description } = await served(page, path);
    expect(title).not.toMatch(/[—–]/);
    expect(description).not.toMatch(/[—–]/);
  });
