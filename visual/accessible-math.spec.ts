import { test, expect } from "@playwright/test";

/**
 * Math inside controls and titles.
 *
 * Chrome leaves KaTeX's MathML out of a control's accessible name, so a link or
 * button whose visible text is a formula was announced without it: a math-only
 * <FormulaRef> had the name "", and a quiz option "Bølgelengden $\lambda$ blir
 * kortere" read "Bølgelengden blir kortere". Those controls (and <Callout> /
 * <Derivation> titles, which now typeset `$…$`) carry a plain-text name built
 * at build time (lib/mathText.ts). The layout half: a math-only FormulaRef and
 * a quiz option both scroll a too-wide formula inside themselves, and neither
 * may add a Tab stop of its own for it (Chrome makes a scroll container
 * focusable when nothing inside it is).
 */

test("math-only FormulaRef links are named by their formula", async ({
  page,
}) => {
  await page.goto("/sammenligning");
  const refs = page.locator(".formula-ref--math");
  await expect(refs.nth(0)).toHaveAccessibleName("n1 sin θ1 = n2 sin θ2");
  await expect(refs.nth(1)).toHaveAccessibleName("1/f = 1/s + 1/s′");
});

test("quiz options and the question group keep their math in the name", async ({
  page,
}) => {
  await page.goto("/eksempler");
  const quiz = page.locator(".quiz[data-multi]");
  await expect(quiz.locator("fieldset")).toHaveAccessibleName(
    "Hvilke av disse skjer når lys går fra luft inn i glass? " +
      "Flere svar er riktige. Kryss av alle som stemmer.",
  );
  await expect(quiz.getByRole("checkbox").first()).toHaveAccessibleName(
    "Bølgelengden λ blir kortere",
  );

  // Grading appends the state the colour + icon show, to the same name.
  await quiz.getByRole("checkbox").nth(1).click();
  await quiz.locator(".quiz-submit").click();
  await expect(quiz.getByRole("checkbox").first()).toHaveAccessibleName(
    "Bølgelengden λ blir kortere, riktig svar, ikke valgt",
  );
  await expect(quiz.locator(".quiz-feedback .sr-only")).toHaveText(
    "Riktige svar: Bølgelengden λ blir kortere; Farten v blir lavere.",
  );
});

test("Callout and Derivation titles typeset $…$ and are named in plain text", async ({
  page,
}) => {
  await page.goto("/oversikt");
  const callout = page.getByRole("note", { name: "Fortegnet til s′" });
  const label = callout.locator(".adm-label");
  await expect(label.locator(".katex")).toBeVisible();
  await expect(label).not.toContainText("$");
  // The kicker is uppercase; math inside it must not be (S′ ≠ s′).
  expect(
    await label
      .locator(".katex")
      .evaluate((n) => getComputedStyle(n).textTransform),
  ).toBe("none");

  const summary = page.locator(".derivation summary").first();
  await expect(summary).toHaveAccessibleName("Utledning av grensevinkelen θc");
  await expect(summary.locator(".katex")).toBeVisible();
  await expect(summary).not.toContainText("$");
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a too-wide math-only FormulaRef scrolls inside itself, one Tab stop", async ({
    page,
  }) => {
    await page.goto("/sammenligning");
    const ref = page.locator(".formula-ref--math").nth(1);
    // The demo's formulas fit a phone; widen one the way a long course
    // formula is wide (TFY4220's primitive-vector triple is ~430px).
    await ref.evaluate((a) => {
      a.innerHTML = a.innerHTML.repeat(6);
    });
    const width = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      view: document.documentElement.clientWidth,
    }));
    // (≤, not =: the reserved scrollbar gutter makes the document narrower
    // than the viewport in headless Chromium.)
    expect(
      width.doc,
      "the page itself must not scroll sideways",
    ).toBeLessThanOrEqual(width.view);
    expect(
      await ref.evaluate((a) => a.scrollWidth > a.clientWidth),
      "the link should be the scroller",
    ).toBe(true);

    // The link is its own scroll container and already focusable: Tab leaves
    // it for the next control, never for something inside it.
    await ref.focus();
    await page.keyboard.press("Tab");
    expect(
      await ref.evaluate((a) => {
        const f = document.activeElement;
        return f === a || a.contains(f);
      }),
    ).toBe(false);
  });

  test("an overflowing quiz option is one Tab stop and hands focus on", async ({
    page,
  }) => {
    await page.goto("/eksempler");
    const quiz = page.locator(".quiz:not([data-multi])");
    const options = quiz.locator(".quiz-option");
    const text = options.nth(0).locator(".quiz-text");
    // A formula option too wide for the row (KaTeX is nowrap there).
    await text.evaluate((s) => {
      s.insertAdjacentHTML(
        "beforeend",
        ` <span style="white-space:nowrap">${"W".repeat(60)}</span>`,
      );
    });
    expect(await text.evaluate((s) => s.scrollWidth > s.clientWidth)).toBe(
      true,
    );

    // Tab goes option → next option; the scrolling text is no stop of its own.
    await options.nth(0).focus();
    await page.keyboard.press("Tab");
    await expect(options.nth(1)).toBeFocused();

    // ←/→ on the row scroll the text instead.
    await options.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    expect(await text.evaluate((s) => s.scrollLeft)).toBeGreaterThan(0);

    // A click on the text grades, and focus lands on the feedback line — not
    // stranded inside the now-disabled button.
    await text.click({ position: { x: 20, y: 5 } });
    await expect(quiz.locator(".quiz-feedback")).toBeFocused();
    await expect(options.nth(0)).toBeDisabled();
  });
});
