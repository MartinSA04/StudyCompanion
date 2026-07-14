/**
 * Client-side runtime shared by the <Simulation> and <Stepper> islands. DOM-only
 * (imported from their bundled `<script>` blocks), so it isn't unit-tested — the
 * demo `pnpm build` exercises both consumers. The pure, testable trace logic
 * lives separately in `stepper.ts`.
 */

export interface CodeBlockController {
  /** Highlight a single 1-based line (null/0 clears). */
  setActiveLine: (n: number | null) => void;
  /** Highlight several 1-based lines at once. */
  setActiveLines: (lines: number[]) => void;
  /** Remove all active-line highlighting. */
  clear: () => void;
  /** Fill the block's variable strip with `key = value` pairs ([] clears it). */
  setVars: (pairs: [string, string][]) => void;
}

/**
 * Resolve a <CodeBlock> (by `id`, or the first on the page) into a controller
 * that toggles the `.cb-line-active` class the CodeBlock styles — so a sim or
 * stepper can walk the highlight in lockstep with what it paints (ROADMAP 3.8).
 * Returns null when no such block exists.
 */
export function makeCodeBlockController(
  id?: string,
): CodeBlockController | null {
  const fig = id
    ? document.querySelector<HTMLElement>(`.codeblock[data-code-block="${id}"]`)
    : document.querySelector<HTMLElement>(".codeblock");
  if (!fig) return null;
  const lines = [...fig.querySelectorAll<HTMLElement>(".line")];
  const apply = (want: number[]) => {
    const set = new Set(want.filter((n) => n > 0));
    lines.forEach((ln, i) => {
      const active = set.has(i + 1);
      ln.classList.toggle("cb-line-active", active);
      if (active) ln.setAttribute("aria-current", "step");
      else ln.removeAttribute("aria-current");
    });
    fig.dataset.activeLines = [...set].join(",");
  };
  const varsEl = fig.querySelector<HTMLElement>("[data-codeblock-vars]");
  const setVars = (pairs: [string, string][]) => {
    if (!varsEl) return;
    const frag = document.createDocumentFragment();
    for (const [k, v] of pairs) {
      const wrap = document.createElement("span");
      wrap.className = "cv";
      const ks = document.createElement("span");
      ks.className = "cv-k";
      ks.textContent = k;
      const vs = document.createElement("span");
      vs.className = "cv-v";
      vs.textContent = v;
      wrap.append(ks, document.createTextNode(" = "), vs);
      frag.append(wrap);
    }
    varsEl.replaceChildren(frag);
  };
  return {
    setActiveLine: (n) => apply(n == null ? [] : [n]),
    setActiveLines: (arr) => apply(arr),
    clear: () => apply([]),
    setVars,
  };
}

// A native dynamic import the bundler never rewrites: the simulation/stepper
// module lives in the COURSE repo's public/ folder, so it must be fetched as a
// raw URL at runtime. A literal import() (even @vite-ignore) gets a `?import`
// query appended in dev, and fetching that on a public asset fails — the module
// then silently never mounts. Hiding import() inside a Function constructor keeps
// Vite's transform away entirely, in dev and in the build.
const nativeImport = new Function("u", "return import(u)") as (
  u: string,
) => Promise<Record<string, unknown>>;

/** Dynamically import a course-provided ES module from a public/ URL. */
export function importCourseModule<T = Record<string, unknown>>(
  src: string,
): Promise<T> {
  return nativeImport(src) as Promise<T>;
}

/**
 * Mount each matching element once it nears the viewport (then stop observing).
 * Already-mounted elements are skipped (idempotent). Pass a `signal` to
 * disconnect the observer on the next view-transition swap so it doesn't hold
 * detached nodes.
 */
export function lazyMountAll(
  els: ArrayLike<HTMLElement>,
  mount: (el: HTMLElement) => void,
  signal?: AbortSignal,
): void {
  const list = Array.from(els).filter((el) => !el.dataset.scMounted);
  if (!list.length) return;
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          obs.unobserve(e.target);
          const el = e.target as HTMLElement;
          if (el.dataset.scMounted) continue;
          el.dataset.scMounted = "1";
          mount(el);
        }
      }
    },
    { rootMargin: "200px" },
  );
  list.forEach((el) => io.observe(el));
  signal?.addEventListener("abort", () => io.disconnect());
}

/**
 * Run `cb` whenever the light/dark theme is toggled (so a sim can repaint). Pass
 * a `signal` to remove the listener on the next swap (otherwise a mounted widget
 * keeps repainting its detached canvas on every later theme toggle).
 */
export function onThemeChange(cb: () => void, signal?: AbortSignal): void {
  document.addEventListener(
    "sc:themechange",
    cb,
    signal ? { signal } : undefined,
  );
}

/**
 * Paint the accent progress fill on a `.sc-range` slider (primitives.css). WebKit
 * has no native progress pseudo-element, so the fill width rides a `--pct` (0–100%)
 * custom property that the mounting island refreshes whenever the value changes;
 * Firefox uses ::-moz-range-progress and ignores it. No-op on a null element.
 */
export function setRangePct(el: HTMLInputElement | null): void {
  if (!el) return;
  const min = Number(el.min) || 0;
  const span = (Number(el.max) || 0) - min || 1;
  el.style.setProperty("--pct", `${((Number(el.value) - min) / span) * 100}%`);
}
