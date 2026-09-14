import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/**
 * Guards the GoatCounter view-transition bridge in CourseLayout.astro.
 *
 * count.js counts the initial document load itself, but ClientRouter swaps
 * pages without a load event, so every module reached by clicking has to be
 * counted by an `astro:page-load` listener. That listener is an `is:inline`
 * script without `define:vars`, and Astro ships such bodies to the browser
 * byte-for-byte — so the source text below IS the program the browser runs
 * (the live sites served it verbatim). The test executes that text against a
 * stub document instead of grepping it: the bug this guards against was a
 * script that looked right in a snapshot and parsed fine, yet registered no
 * listener because a JSX `{`…`}` wrapper had been emitted as-is.
 */
const root = fileURLToPath(new URL("../", import.meta.url));
const layout = readFileSync(
  join(root, "src/layouts/CourseLayout.astro"),
  "utf8",
);

// Line-anchored so a tag mentioned mid-line in a comment cannot swallow the
// real block that follows it.
const SCRIPT_RE = /^\s*<script\b([^>]*?)(?<!\/)>([\s\S]*?)<\/script>/gm;

function inlineScripts(src: string): { attrs: string; body: string }[] {
  return [...src.matchAll(SCRIPT_RE)]
    .map((m) => ({ attrs: m[1], body: m[2] }))
    .filter((s) => /\bis:inline\b/.test(s.attrs));
}

const bridge = inlineScripts(layout).find(
  (s) => /astro:page-load/.test(s.body) && /goatcounter/.test(s.body),
);

/** Runs an inline-script body against a minimal browser stub. */
function run(body: string) {
  const listeners = new Map<string, ((e?: unknown) => void)[]>();
  const counted: unknown[] = [];
  const location = { href: "https://algdat.test/", pathname: "/", search: "" };
  const document = {
    addEventListener(type: string, fn: (e?: unknown) => void) {
      listeners.set(type, [...(listeners.get(type) ?? []), fn]);
    },
  };
  const window = {
    goatcounter: {
      count(vars: unknown) {
        counted.push(vars);
      },
    },
  };
  new Function("document", "window", "location", body)(
    document,
    window,
    location,
  );
  const fire = (type: string) => listeners.get(type)?.forEach((fn) => fn());
  /** Simulates a ClientRouter swap: the URL changes, the document does not. */
  const goTo = (path: string) => {
    const u = new URL(path, "https://algdat.test");
    location.pathname = u.pathname;
    location.search = u.search;
    location.href = u.href;
  };
  const paths = () => counted.map((v) => (v as { path: string }).path);
  const referrers = () =>
    counted.map((v) => (v as { referrer: string }).referrer);
  return { listeners, counted, fire, goTo, paths, referrers };
}

test("the analytics bridge is an is:inline script in the layout", () => {
  assert.ok(bridge, "no is:inline script mentioning astro:page-load found");
});

test("the emitted bridge registers exactly one astro:page-load listener", () => {
  const { listeners } = run(bridge!.body);
  assert.equal(listeners.get("astro:page-load")?.length ?? 0, 1);
});

test("the bridge skips the initial load and counts each later navigation", () => {
  const { counted, fire, goTo, paths } = run(bridge!.body);

  // Initial document load: count.js already counted it, so the bridge must not.
  fire("astro:page-load");
  assert.deepEqual(counted, []);

  goTo("/datastrukturer");
  fire("astro:page-load");
  assert.deepEqual(paths(), ["/datastrukturer"]);

  goTo("/begreper?q=heap");
  fire("astro:page-load");
  assert.deepEqual(paths(), ["/datastrukturer", "/begreper?q=heap"]);
});

test("the bridge names the page navigated from as the referrer", () => {
  // document.referrer is fixed when the document is created and ClientRouter
  // never creates a new one, so left to count.js every swapped-in view would
  // repeat the landing page's referrer: a bookmark landing followed by five
  // module views is six "(unknown)" pageviews. The bridge must say where the
  // reader actually came from.
  const { fire, goTo, referrers } = run(bridge!.body);

  fire("astro:page-load");
  goTo("/datastrukturer");
  fire("astro:page-load");
  goTo("/begreper?q=heap");
  fire("astro:page-load");

  assert.deepEqual(referrers(), [
    "https://algdat.test/",
    "https://algdat.test/datastrukturer",
  ]);
});

/**
 * Class-level guard: Astro does not evaluate expressions inside <script> or
 * <style>, so a body written as `{`…`}` (or `{"…"}`) reaches the browser with
 * the braces intact — a block statement holding an unused literal, i.e. a
 * silent no-op. JSON-LD blocks legitimately start with `{"`, so they are
 * excluded by their type.
 */
function astroFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : astroFiles(p);
    return e.name.endsWith(".astro") ? [p] : [];
  });
}

const BLOCK_RE = /^\s*<(script|style)\b([^>]*?)(?<!\/)>([\s\S]*?)<\/\1>/gm;

test("no <script> or <style> body is wrapped in a JSX expression", () => {
  const offenders: string[] = [];
  for (const dir of ["src", "hub"]) {
    for (const file of astroFiles(join(root, dir))) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(BLOCK_RE)) {
        const [, , attrs, body] = m;
        if (/type\s*=\s*["']application\/ld\+json["']/.test(attrs)) continue;
        const t = body.trim();
        if (/^\{\s*[`"']/.test(t) || /[`"']\s*\}$/.test(t)) {
          const line = src.slice(0, m.index).split("\n").length;
          offenders.push(`${file.slice(root.length)}:${line}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, []);
});
