/**
 * Pure gesture logic for a horizontal swipe, split from any DOM so it unit-tests
 * under node:test (the `.astro` island wires `attachSwipe` into the card chrome,
 * same split as stepper/filterList). Swipe is PARITY input: the caller commits a
 * verdict by clicking the button it mirrors, so the rating buttons stay the one
 * canonical code path and a swipe is never the only way to act.
 */

/** Minimum horizontal travel (px) before a release counts as a swipe. */
export const SWIPE_THRESHOLD = 48;

/** A release's decision: a left/right swipe, or `null` for anything else. */
export type SwipeVerdict = "left" | "right" | null;

/**
 * Classify a release from its total travel. A swipe needs BOTH enough
 * horizontal distance (`|dx| >= SWIPE_THRESHOLD`) AND horizontal dominance
 * (`|dx| > 2 * |dy|`) — a diagonal or vertical drag is the reader scrolling the
 * page, not swiping the card, so it verdicts `null`.
 */
export function swipeVerdict(dx: number, dy: number): SwipeVerdict {
  if (Math.abs(dx) < SWIPE_THRESHOLD) return null;
  if (Math.abs(dx) <= 2 * Math.abs(dy)) return null;
  return dx > 0 ? "right" : "left";
}

/** Live-drag + release callbacks the wiring reports gesture progress through. */
export interface SwipeHandlers {
  /** Called on every move of the active pointer with the running `dx` (for
   *  the card's follow transform). */
  onMove?: (dx: number) => void;
  /** Called once on release/cancel with the classified verdict. */
  onEnd: (verdict: SwipeVerdict) => void;
}

/**
 * Wire pointer events on `el` into `handlers`. Tracks a single active pointer
 * (a second concurrent one is ignored until the first releases), reports live
 * `dx` through `onMove`, and calls `onEnd` with the {@link swipeVerdict} on
 * pointerup — or `null` on pointercancel (the browser stole the gesture, e.g.
 * to scroll). Mouse pointers are included: swipe parity on desktop is free and
 * harmless. Returns a cleanup that detaches every listener.
 */
export function attachSwipe(
  el: HTMLElement,
  handlers: SwipeHandlers,
): () => void {
  let activeId: number | null = null;
  let startX = 0;
  let startY = 0;

  const down = (e: PointerEvent) => {
    if (activeId !== null) return; // hold to the first pointer
    activeId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    // Capture on the pressed element (a descendant of `el`), NOT `el` itself, so
    // a drift off it still delivers move/up — they bubble back to `el`'s
    // listeners either way. The distinction is the compatibility `click` a mouse
    // release synthesises: the browser retargets it to the capture element, so
    // capturing on `el` would steal that click from any child click handler
    // (e.g. a card that flips when clicked) and fire it on the container
    // instead. Capturing on the pressed target keeps the click on that target,
    // matching touch's native implicit capture. Guarded for the fake target used
    // in unit tests (its events carry no `target`).
    (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
  };

  const move = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    handlers.onMove?.(e.clientX - startX);
  };

  const up = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    handlers.onEnd(swipeVerdict(e.clientX - startX, e.clientY - startY));
  };

  const cancel = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    handlers.onEnd(null);
  };

  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", cancel);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", cancel);
  };
}
