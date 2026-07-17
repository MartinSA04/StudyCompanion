import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SWIPE_THRESHOLD,
  swipeVerdict,
  attachSwipe,
  type SwipeHandlers,
} from "../src/lib/swipe.ts";

test("SWIPE_THRESHOLD is the agreed 48px contract", () => {
  assert.equal(SWIPE_THRESHOLD, 48);
});

test("swipeVerdict needs the full threshold — 47.9 is nothing, 48 is a swipe", () => {
  assert.equal(swipeVerdict(47.9, 0), null);
  assert.equal(swipeVerdict(48, 0), "right");
  assert.equal(swipeVerdict(-48, 0), "left");
});

test("swipeVerdict reads the sign of dx as the direction", () => {
  assert.equal(swipeVerdict(80, 0), "right");
  assert.equal(swipeVerdict(-80, 0), "left");
});

test("swipeVerdict vetoes a diagonal/vertical drag as a scroll", () => {
  // Past the distance threshold, but dy is too large to be horizontal.
  assert.equal(swipeVerdict(60, 40), null);
  // Clearly horizontal survives.
  assert.equal(swipeVerdict(60, 20), "right");
  // Exactly 2× is still a veto (dominance is strict).
  assert.equal(swipeVerdict(60, 30), null);
});

test("swipeVerdict is null for zero movement", () => {
  assert.equal(swipeVerdict(0, 0), null);
});

/**
 * attachSwipe only ever calls add/removeEventListener and (guarded)
 * setPointerCapture, and reads pointerId/clientX/clientY off each event — so a
 * plain listener registry stands in for the element, and bare objects for the
 * PointerEvents. `emit` invokes whatever the lib registered for a type.
 */
function fakeTarget() {
  const listeners = new Map<string, Set<(e: unknown) => void>>();
  const target = {
    addEventListener(type: string, fn: (e: unknown) => void) {
      (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(
        fn,
      );
    },
    removeEventListener(type: string, fn: (e: unknown) => void) {
      listeners.get(type)?.delete(fn);
    },
    setPointerCapture() {},
    emit(type: string, e: Record<string, number>) {
      listeners.get(type)?.forEach((fn) => fn(e));
    },
    count() {
      return [...listeners.values()].reduce((n, s) => n + s.size, 0);
    },
  };
  return target;
}

function attach(
  target: ReturnType<typeof fakeTarget>,
  handlers: SwipeHandlers,
) {
  return attachSwipe(target as unknown as HTMLElement, handlers);
}

test("attachSwipe reports a right swipe on release", () => {
  const target = fakeTarget();
  const verdicts: (string | null)[] = [];
  attach(target, { onEnd: (v) => verdicts.push(v) });
  target.emit("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
  target.emit("pointerup", { pointerId: 1, clientX: 60, clientY: 0 });
  assert.deepEqual(verdicts, ["right"]);
});

test("attachSwipe onMove receives the live dx", () => {
  const target = fakeTarget();
  const moves: number[] = [];
  attach(target, { onMove: (dx) => moves.push(dx), onEnd: () => {} });
  target.emit("pointerdown", { pointerId: 1, clientX: 10, clientY: 0 });
  target.emit("pointermove", { pointerId: 1, clientX: 25, clientY: 0 });
  target.emit("pointermove", { pointerId: 1, clientX: 40, clientY: 0 });
  assert.deepEqual(moves, [15, 30]);
});

test("attachSwipe treats pointercancel as a null verdict", () => {
  const target = fakeTarget();
  const verdicts: (string | null)[] = [];
  attach(target, { onEnd: (v) => verdicts.push(v) });
  target.emit("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
  target.emit("pointercancel", { pointerId: 1, clientX: 60, clientY: 0 });
  assert.deepEqual(verdicts, [null]);
});

test("attachSwipe ignores a second concurrent pointer", () => {
  const target = fakeTarget();
  const moves: number[] = [];
  const verdicts: (string | null)[] = [];
  attach(target, {
    onMove: (dx) => moves.push(dx),
    onEnd: (v) => verdicts.push(v),
  });
  target.emit("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
  // A second finger presses down and moves — ignored while the first is active.
  target.emit("pointerdown", { pointerId: 2, clientX: 100, clientY: 0 });
  target.emit("pointermove", { pointerId: 2, clientX: 200, clientY: 0 });
  assert.deepEqual(moves, []);
  // The first pointer still drives the gesture.
  target.emit("pointermove", { pointerId: 1, clientX: 30, clientY: 0 });
  target.emit("pointerup", { pointerId: 1, clientX: 60, clientY: 0 });
  assert.deepEqual(moves, [30]);
  assert.deepEqual(verdicts, ["right"]);
});

test("attachSwipe cleanup detaches every listener", () => {
  const target = fakeTarget();
  const verdicts: (string | null)[] = [];
  const cleanup = attach(target, { onEnd: (v) => verdicts.push(v) });
  assert.equal(target.count(), 4); // down/move/up/cancel
  cleanup();
  assert.equal(target.count(), 0);
  // Events after cleanup reach nothing.
  target.emit("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
  target.emit("pointerup", { pointerId: 1, clientX: 60, clientY: 0 });
  assert.deepEqual(verdicts, []);
});
