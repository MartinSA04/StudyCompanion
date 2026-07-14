import { test, expect } from "@playwright/test";

/**
 * Interactive-state snapshots. The kitchen-sink suite only captures each route
 * in its static SSR state; a graded Quiz, a flipped Flashcard back and a
 * mid-trace Stepper are JS-only states no server render reaches. Each test
 * drives the widget into that state, then snapshots the WIDGET locator (not the
 * full page) so the baseline is small and stable. Quiz/Flashcards run in both
 * themes (cheap, pure CSS-token repaints); the Stepper runs light-only — its
 * stage is a theme-tracking SVG, and one theme is enough to pin the trace
 * geometry without doubling a heavier deterministic-wait test.
 */

// Force the theme before any page script runs — same no-flash key the layout
// writes (sc:theme:<course code>), mirrored from kitchen-sink.spec.ts.
async function forceTheme(
  page: import("@playwright/test").Page,
  theme: string,
) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("sc:theme:DEMO101", t);
    } catch {
      /* storage blocked */
    }
  }, theme);
}

const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  test(`quiz answered — ${theme}`, async ({ page }) => {
    await forceTheme(page, theme);
    await page.goto("/eksempler");
    await page.waitForLoadState("networkidle");

    const quiz = page.locator(".quiz");
    // Answer index 1 ("Totalrefleksjon") — the correct option, so the snapshot
    // pins the green graded row, the "Riktig!" feedback and the revealed
    // explanation in one shot.
    await quiz.locator('.quiz-option[data-index="1"]').click();
    await expect(quiz.locator(".quiz-feedback")).toHaveAttribute(
      "data-result",
      "correct",
    );
    await expect(quiz.locator(".quiz-explain")).toBeVisible();

    await expect(quiz).toHaveScreenshot(`quiz-answered-${theme}.png`);
  });

  test(`flashcard flipped — ${theme}`, async ({ page }) => {
    await forceTheme(page, theme);
    await page.goto("/flashcards");
    await page.waitForLoadState("networkidle");

    const deck = page.locator(".flashcards");
    const card = deck.locator("[data-fc-card]:not([hidden])");
    // Clicking the card flips it (the card is itself the flip button); the CSS
    // 3D flip is a transition, disabled by the config's animations:"disabled",
    // so the back face settles immediately.
    await card.click();
    await expect(card).toHaveAttribute("data-flipped", "true");

    await expect(deck).toHaveScreenshot(`flashcard-flipped-${theme}.png`);
  });
}

test("stepper mid-trace — light", async ({ page }) => {
  await forceTheme(page, "light");
  await page.goto("/simulering");
  await page.waitForLoadState("networkidle");

  const stepper = page.locator(".stepper");
  // The stepper lazy-mounts on an IntersectionObserver (rootMargin 200px) and
  // sits at the bottom of this page, so it never intersects at initial load —
  // scroll it in to trigger the mount. Only then does the course module load,
  // init() set data-ready, and the transport listeners bind.
  await stepper.scrollIntoViewIfNeeded();
  await expect(stepper).toHaveAttribute("data-ready", "true");

  // Advance a few steps into the trace: the active bar (accent) and the
  // best-so-far bar (green) diverge, the count reads mid-run, and the driven
  // <CodeBlock id="max-scan"> above highlights the compare line + shows vars.
  const forward = stepper.locator('[data-act="forward"]');
  await forward.click();
  await forward.click();
  await forward.click();
  await expect(stepper.locator("[data-count]")).toHaveText("4 / 9");

  // The stepper stage is a deterministic SVG (no Math.random), so its pixels are
  // stable across runs — no canvas mask needed.
  await expect(stepper).toHaveScreenshot("stepper-mid-trace.png");

  // The variables + active line render into the separate CodeBlock the stepper
  // drives (by id), so snapshot it too to cover that half of the contract.
  const code = page.locator('.codeblock[data-code-block="max-scan"]');
  await expect(code.locator(".line.cb-line-active").first()).toBeVisible();
  await expect(code.locator("[data-codeblock-vars]")).not.toBeEmpty();
  await expect(code).toHaveScreenshot("stepper-codeblock-mid-trace.png");
});
