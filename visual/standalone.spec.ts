import { test, expect } from "@playwright/test";

/**
 * Installed-app (`display: standalone`) chrome.
 *
 * `display-mode` CANNOT be emulated: `page.emulateMedia()` has no such option,
 * and CDP's `Emulation.setEmulatedMedia` accepts a `display-mode` feature
 * silently while `matchMedia("(display-mode: standalone)")` stays false —
 * verified, not assumed. So the standalone branch is asserted through the CSSOM
 * (the rule shipped, parsed, and targets exactly one selector) rather than by
 * rendering it, and the browser branch is asserted for real.
 *
 * That pairing is what matters: the CSSOM test catches the rule being deleted or
 * widened, and the browser test catches it being applied unconditionally.
 */

test("the hub link shows in a browser tab", async ({ page }) => {
  await page.goto("/oversikt");
  // Also guards the fixture: the demo course sets hubUrl, so if this link ever
  // stops rendering the CSSOM assertion below would be guarding nothing.
  const hub = page.locator(".sidebar-hub");
  await expect(hub).toHaveCount(1);
  await expect(hub).toBeVisible();
  await expect(hub).toHaveAttribute("href", /^https?:\/\//);
});

test("the shipped CSS hides the hub link in standalone, and nothing else", async ({
  page,
}) => {
  await page.goto("/oversikt");

  const rules = await page.evaluate(() => {
    const found: { selector: string; body: string }[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let top: CSSRuleList;
      try {
        top = sheet.cssRules; // same-origin, so readable
      } catch {
        continue;
      }
      for (const rule of Array.from(top)) {
        if (
          rule instanceof CSSMediaRule &&
          rule.conditionText
            .replace(/\s/g, "")
            .includes("display-mode:standalone")
        ) {
          for (const inner of Array.from(rule.cssRules)) {
            if (inner instanceof CSSStyleRule) {
              found.push({
                selector: inner.selectorText,
                body: inner.style.cssText,
              });
            }
          }
        }
      }
    }
    return found;
  });

  // The hub link points at a DIFFERENT origin, so it is outside the PWA scope:
  // tapping it hands the URL to an in-app browser sheet instead of navigating.
  assertHidesHub(rules);
});

function assertHidesHub(rules: { selector: string; body: string }[]): void {
  expect(
    rules.length,
    "no (display-mode: standalone) rule shipped in the stylesheet",
  ).toBeGreaterThan(0);
  const hub = rules.find((r) => r.selector === ".sidebar-hub");
  expect(
    hub,
    `no .sidebar-hub rule; saw ${JSON.stringify(rules)}`,
  ).toBeTruthy();
  expect(hub!.body).toContain("display: none");
  // Narrow on purpose: an installed reader must keep the whole course nav, so
  // the standalone branch may not hide anything beyond this one link.
  expect(
    rules.map((r) => r.selector),
    "standalone must not hide anything but the hub link",
  ).toEqual([".sidebar-hub"]);
}
