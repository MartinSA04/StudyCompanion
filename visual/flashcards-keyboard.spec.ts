import { test, expect } from "@playwright/test";

/**
 * Space is the deck's flip key, but a mouse click leaves focus on the clicked
 * control — and a focused button natively activates on Space. Without focus
 * handoff, "click Neste, press Space" re-runs Neste (and paints its focus
 * ring) instead of flipping the card. These tests pin the handoff: after any
 * pointer click on a deck control, Space must flip the current card.
 */
test.describe("flashcards keyboard after mouse clicks", () => {
  test("Space flips instead of re-running the last-clicked nav button", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    const deck = page.locator(".flashcards");
    const pos = deck.locator("[data-fc-pos]");
    await expect(pos).toHaveText("1");

    await deck.locator("[data-fc-next]").click();
    await expect(pos).toHaveText("2");

    await page.keyboard.press("Space");
    await expect(
      deck.locator("[data-fc-card]:not([hidden])"),
    ).toHaveAttribute("data-flipped", "true");
    await expect(pos).toHaveText("2");
  });

  test("Space flips instead of re-running the last-clicked chip", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    const deck = page.locator(".flashcards");

    await deck.locator("[data-fc-shuffle]").click();
    await page.keyboard.press("Space");
    await expect(
      deck.locator("[data-fc-card]:not([hidden])"),
    ).toHaveAttribute("data-flipped", "true");
  });

  test("deck keys hand the keyboard highlight to the card, not <main>", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    // Clicking non-interactive text focuses the nearest focusable ancestor —
    // <main tabindex="-1"> — which would take the UA focus ring on the next
    // keypress and frame the whole page.
    await page.locator("main h1").click();
    await expect(page.locator("main")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    const card = page.locator("[data-fc-card]:not([hidden])");
    await expect(card).toBeFocused();
    expect(await card.evaluate((el) => el.matches(":focus-visible"))).toBe(
      true,
    );
  });

  test("Space after clicking page text flips exactly once and focuses the card", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await page.locator("main h1").click();
    await page.keyboard.press("Space");
    const card = page.locator("[data-fc-card]:not([hidden])");
    // "true" proves a single flip: a double flip (our handler + a stray native
    // activation on the freshly-focused card) would land back on "false".
    await expect(card).toHaveAttribute("data-flipped", "true");
    await expect(card).toBeFocused();
  });

  test("Enter on a focused link navigates instead of flipping", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await page.locator(".brand").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/");
  });
});
