import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Touch behaviour for the flashcard deck: swipe rating is PARITY input (right ≙
 * Kan, left ≙ Øv), the buttons stay fully functional, and on a phone viewport
 * the rating row is a sticky thumb bar. These tests drive the real gesture path
 * and pin those contracts.
 *
 * Runs under exactly one project: the file is not mobile.spec.ts, so the desktop
 * `chromium` project picks it up (and the `mobile` project — testMatch only
 * mobile.spec.ts — skips it). test.use gives it a phone-width, touch-enabled
 * context of its own so the ≤640px thumb-zone rules apply and .tap() works.
 *
 * Swipes are driven with page.mouse: attachSwipe listens on pointer events and
 * handles mouse pointers too, and real mouse input is turned by the browser into
 * the same pointerdown/move/up the handler binds — so this exercises the
 * production path without synthesising events (which would bypass hit-testing
 * and pointer capture).
 */
test.use({
  viewport: { width: 393, height: 851 },
  hasTouch: true,
});

// SWIPE_THRESHOLD is 48px (src/lib/swipe.ts): a swipe commits only past it, with
// horizontal dominance. PAST clears it, UNDER stays below; the vertical drill
// uses a dominant dy so the verdict is null (a scroll, not a swipe).
const PAST = 72;
const UNDER = 24;

// Drag a pointer across the visible card by (dx, dy). Several intermediate moves
// let the handler see live dx before the release verdict.
async function swipeCard(page: Page, card: Locator, dx: number, dy = 0) {
  const box = await card.boundingBox();
  if (!box) throw new Error("no visible card to swipe");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 8 });
  await page.mouse.up();
}

// The deck is an Astro island: its onPage handler runs show(), which stamps
// data-flipped="false" on the visible card (the SSR markup carries no such
// attribute). Waiting for it proves the swipe + rating handlers are wired before
// we drive them.
async function ready(page: Page) {
  await page.waitForLoadState("networkidle");
  await expect(page.locator("[data-fc-card]:not([hidden])")).toHaveAttribute(
    "data-flipped",
    "false",
  );
}

test.describe("flashcards touch — swipe parity + thumb zone", () => {
  test("swipe right rates the card Kan — counter climbs, deck advances", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await ready(page);
    const deck = page.locator(".flashcards");
    const known = deck.locator("[data-fc-known]");
    const pos = deck.locator("[data-fc-pos]");
    await expect(known).toHaveText("0");
    await expect(pos).toHaveText("1");

    await swipeCard(page, deck.locator("[data-fc-card]:not([hidden])"), PAST);

    // Same result as clicking Kan ([data-fc-rate="1"]): the known tally climbs
    // and the deck moves on to the next card.
    await expect(known).toHaveText("1");
    await expect(pos).toHaveText("2");
  });

  test("swipe left rates the card Øv — parity with the Øv button", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await ready(page);
    const deck = page.locator(".flashcards");
    const known = deck.locator("[data-fc-known]");
    const pos = deck.locator("[data-fc-pos]");

    // Mark the opening card known, then step back onto it — so swiping left has
    // a visible effect to undo (the tally drops back to 0). A card that was
    // already not-known would rate to the same 0, with nothing to observe.
    await deck.locator('[data-fc-rate="1"]').click();
    await expect(known).toHaveText("1");
    await deck.locator("[data-fc-prev]").click();
    await expect(pos).toHaveText("1");

    await swipeCard(page, deck.locator("[data-fc-card]:not([hidden])"), -PAST);

    // Left commits the Øv path ([data-fc-rate="0"]): the card is marked
    // not-known (tally back to 0) and the deck advances — the Øv button's exact
    // effect.
    await expect(known).toHaveText("0");
    await expect(pos).toHaveText("2");
  });

  test("a sub-threshold drag rates nothing and still lets a tap flip the card", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await ready(page);
    const deck = page.locator(".flashcards");
    const known = deck.locator("[data-fc-known]");
    const pos = deck.locator("[data-fc-pos]");
    const card = deck.locator("[data-fc-card]:not([hidden])");

    await swipeCard(page, card, UNDER);

    // Below the threshold: no rating, no advance — the same card is still up.
    await expect(known).toHaveText("0");
    await expect(pos).toHaveText("1");

    // And the short drag must not over-suppress the click: a plain tap still
    // flips the card (toggles data-flipped, whatever it reads now).
    const before = await card.getAttribute("data-flipped");
    await card.tap();
    await expect(card).toHaveAttribute(
      "data-flipped",
      String(before !== "true"),
    );
  });

  test("a mostly-vertical gesture scrolls — no rating, no flip-suppression", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await ready(page);
    const deck = page.locator(".flashcards");
    const known = deck.locator("[data-fc-known]");
    const pos = deck.locator("[data-fc-pos]");
    const card = deck.locator("[data-fc-card]:not([hidden])");

    // dy dominates dx: a vertical intent (page scroll), not a swipe.
    await swipeCard(page, card, 12, 96);

    await expect(known).toHaveText("0");
    await expect(pos).toHaveText("1");

    // No committed swipe means no click-suppression side effect either: a tap
    // still flips.
    const before = await card.getAttribute("data-flipped");
    await card.tap();
    await expect(card).toHaveAttribute(
      "data-flipped",
      String(before !== "true"),
    );
  });

  test("the Kan button still works as a touch tap", async ({ page }) => {
    await page.goto("/flashcards");
    await ready(page);
    const deck = page.locator(".flashcards");
    const known = deck.locator("[data-fc-known]");
    const pos = deck.locator("[data-fc-pos]");
    await expect(known).toHaveText("0");

    // Swipe is parity input, never the only path: a plain tap on Kan lands the
    // same effect as swipe-right.
    await deck.locator('[data-fc-rate="1"]').tap();

    await expect(known).toHaveText("1");
    await expect(pos).toHaveText("2");
  });

  test("a Kan rating persists across reload and sorts the card to the back", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await ready(page);
    const deck = page.locator(".flashcards");
    const known = deck.locator("[data-fc-known]");

    const firstId = await deck
      .locator("[data-fc-card]:not([hidden])")
      .getAttribute("data-fc-id");
    await swipeCard(page, deck.locator("[data-fc-card]:not([hidden])"), PAST);
    await expect(known).toHaveText("1");

    await page.reload();
    await ready(page);

    // Restored from localStorage…
    await expect(known).toHaveText("1");
    // …and the due-first queue puts the now-known card behind the not-known
    // ones, so it is no longer the card in view.
    const afterId = await deck
      .locator("[data-fc-card]:not([hidden])")
      .getAttribute("data-fc-id");
    expect(afterId).not.toBe(firstId);
  });

  test("the rating row is a sticky thumb bar on a phone viewport", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    await ready(page);
    // Force a short viewport so the page scrolls and the rating row's natural
    // position sits well below the fold: only then is a sticky bar (pinned to
    // the bottom) distinguishable from a static one (scrolled off). Width stays
    // under the component's 640px thumb-zone breakpoint.
    await page.setViewportSize({ width: 393, height: 320 });
    const max = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(max).toBeGreaterThan(80);

    await page.evaluate(() => window.scrollTo(0, 60));
    const next = page.locator("[data-fc-next]");
    const box = await next.boundingBox();
    const vh = page.viewportSize()!.height;
    expect(box).not.toBeNull();
    // position:sticky;bottom:0 pins the row to the bottom of the visual viewport
    // instead of leaving it at its (below-the-fold) flow position: its bottom
    // edge is within the viewport and hugs the bottom, in thumb reach. The lower
    // bound is loose to allow the row's own bottom padding (safe-area inset).
    expect(box!.y + box!.height).toBeLessThanOrEqual(vh + 1);
    expect(box!.y + box!.height).toBeGreaterThan(vh - 48);
  });

  test("the scrollbar gutter is reserved on the root element", async ({
    page,
  }) => {
    await page.goto("/flashcards");
    // Guards the stable-gutter rule (base.css): the centered column must not
    // jump by the scrollbar width between a tall page and a short one.
    const gutter = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "scrollbar-gutter",
      ),
    );
    expect(gutter).toContain("stable");
  });

  test("prefers-reduced-motion: a swipe still commits, with no follow transform", async ({
    page,
  }) => {
    // Motion is gated, the verdict is not: under reduce the card must not follow
    // the finger (no inline transform mid-drag), yet the release still rates the
    // card — the swipe is an input, and disabling it would strand touch users
    // without the parity path the buttons promise.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/flashcards");
    await ready(page);
    const deck = page.locator(".flashcards");
    const known = deck.locator("[data-fc-known]");
    const card = deck.locator("[data-fc-card]:not([hidden])");
    await expect(known).toHaveText("0");

    // Drive the drag inline (not via swipeCard) so we can read the card's inline
    // transform at full extension, before release: it must stay empty.
    const box = await card.boundingBox();
    if (!box) throw new Error("no visible card to swipe");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + PAST, cy, { steps: 8 });
    expect(await card.evaluate((el) => el.style.transform)).toBe("");
    await page.mouse.up();

    // Verdict commits regardless of the motion preference: Kan tally climbs.
    await expect(known).toHaveText("1");
  });
});
