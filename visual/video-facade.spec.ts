import { test, expect } from "@playwright/test";

/**
 * `<Video>`'s whole premise is that nothing third-party loads until the reader
 * asks for it. That is a property of the shipped page, not of the source, so it
 * needs a guard: a future "just preload the iframe" or "show the YouTube
 * thumbnail" would look harmless in review and silently put Google on every page
 * view of every course.
 *
 * The second half covers the swap itself — the facade is an <a> that a click
 * upgrades in place, so a broken handler must fail here rather than degrade
 * quietly into navigating away to YouTube.
 */

/** Never let a test run actually reach Google. */
async function blockYouTube(page: import("@playwright/test").Page) {
  const seen: string[] = [];
  await page.route("**youtube-nocookie.com/**", (route) => {
    seen.push(route.request().url());
    return route.abort();
  });
  return seen;
}

test("the facade ships with no iframe and no YouTube-hosted asset", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));

  await page.goto("/mer");
  await expect(page.locator("figure.video")).toBeVisible();

  await expect(page.locator("iframe")).toHaveCount(0);
  const thirdParty = requests.filter((u) =>
    /youtube|ytimg|ggpht|google/.test(u),
  );
  expect(thirdParty).toEqual([]);
});

test("clicking the facade swaps in a nocookie player, in place", async ({
  page,
}) => {
  const embedRequests = await blockYouTube(page);
  await page.goto("/mer");

  const box = page.locator(".video-box");
  await box.scrollIntoViewIfNeeded();
  const before = await box.boundingBox();

  await box.locator("a.video-frame").click();

  const iframe = box.locator("iframe.video-player");
  await expect(iframe).toHaveCount(1);
  await expect(box.locator("a.video-frame")).toHaveCount(0);
  // The video's own title, so the player is not an unlabelled frame to a
  // screen reader.
  await expect(iframe).toHaveAttribute("title", "The essence of calculus");
  await expect(iframe).toHaveAttribute("allowfullscreen", "");

  // Opens downward into 16:9: the box's top never moves, so the thing the
  // reader just clicked stays under the cursor.
  const after = await box.boundingBox();
  expect(after!.y).toBe(before!.y);
  expect(after!.height).toBeGreaterThan(before!.height);
  expect(after!.height / after!.width).toBeCloseTo(9 / 16, 2);

  expect(embedRequests).toHaveLength(1);
  expect(embedRequests[0]).toContain("youtube-nocookie.com/embed/WUvTyaaNkzM");
  // Without playsinline, a tap on iOS throws the reader into the fullscreen
  // native player and out of the guide.
  expect(embedRequests[0]).toContain("playsinline=1");
});

test("a modified click is left to the browser, not hijacked", async ({
  page,
}) => {
  await blockYouTube(page);
  await page.goto("/mer");

  const box = page.locator(".video-box");
  await box.scrollIntoViewIfNeeded();
  // Ctrl-click means "open in a new tab" — the facade must not swallow it and
  // play inline instead. Suppress the popup so the run stays offline.
  await page.context().route("**youtube.com/**", (route) => route.abort());
  await box.locator("a.video-frame").click({ modifiers: ["ControlOrMeta"] });

  await expect(box.locator("a.video-frame")).toHaveCount(1);
  await expect(box.locator("iframe")).toHaveCount(0);
});
