/**
 * Pure logic for the <Stepper> algorithm trace-player. Kept free
 * of any DOM so it can be unit-tested with node:test — the `.astro` island wires
 * these into the player chrome (the island itself is exercised by the demo build,
 * same split as mdx-components).
 */

/** A single trace frame. The framework only reads `line`, `desc`/`label` and
 * `vars`/`variables`; every other field is opaque course payload handed straight
 * to the course module's `render(stage, frame)`. */
export interface Frame {
  /** 1-based source line(s) to highlight in the linked <CodeBlock>. */
  line?: number | number[];
  /** Step description (announced via aria-live). `label` is an accepted alias. */
  desc?: string;
  label?: string;
  /** Variables shown in the rail. `variables` is an accepted alias. */
  vars?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Clamp `idx` into the valid range for `total` frames (→ 0 when there are none). */
export function clampIndex(idx: number, total: number): number {
  if (!Number.isFinite(idx)) return 0;
  if (total <= 0) return 0;
  return Math.min(Math.max(Math.trunc(idx), 0), total - 1);
}

/** Move `idx` by `dir` (±1…), staying within bounds. */
export function stepIndex(idx: number, total: number, dir: number): number {
  return clampIndex(idx + dir, total);
}

/** Play-speed multipliers offered by the transport's speed toggle. */
export const SPEEDS = [0.5, 1, 2] as const;

/** Play-loop interval (ms) for a speed multiplier; faster = shorter. */
export function intervalFor(multiplier: number, base = 520): number {
  const m = Number(multiplier) > 0 ? Number(multiplier) : 1;
  return Math.round(base / m);
}

/** The next multiplier when cycling the speed toggle (wraps; unknown → first). */
export function nextSpeed(current: number): number {
  const i = SPEEDS.indexOf(current as (typeof SPEEDS)[number]);
  return SPEEDS[(i + 1) % SPEEDS.length];
}

function toLineList(line: Frame["line"]): number[] {
  const arr = Array.isArray(line) ? line : line == null ? [] : [line];
  return arr.map(Number).filter((n) => Number.isFinite(n) && n > 0);
}

function stringifyValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Normalise a raw frame into the fields the player chrome renders. */
export function normalizeFrame(frame: Frame): {
  lines: number[];
  desc: string;
  vars: [string, string][];
} {
  const source = frame.vars ?? frame.variables ?? {};
  return {
    lines: toLineList(frame.line),
    desc: frame.desc ?? frame.label ?? "",
    vars: Object.entries(source).map(([k, v]) => [k, stringifyValue(v)]),
  };
}

/** Advance one frame for the play loop; `atEnd` is true once it can't advance. */
export function tickPlay(
  idx: number,
  total: number,
): { index: number; atEnd: boolean } {
  if (idx >= total - 1) return { index: clampIndex(idx, total), atEnd: true };
  return { index: idx + 1, atEnd: false };
}
