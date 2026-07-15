/**
 * Reading-progress storage contract, backed by localStorage. Keys are
 * namespaced per course: `sc:progress:<course.code>`, value is a JSON array of
 * the section slugs the reader has marked done. Slugs — not `order` numbers —
 * because order is mutable editorial state: renumbering sections would shift
 * every done-mark onto the wrong module, while a slug follows its file.
 *
 * The layout and overview scripts read/write this key through `readProgress` /
 * `writeProgress` (they need the per-document key off `<body data-progress-key>`
 * across view-transition swaps), routing every read through `normalizeProgress`
 * so the legacy order-number records (pre-slug releases) migrate and stale
 * entries prune on first sight. Storage access stays try/catch-wrapped so
 * private-mode / disabled storage degrades to a non-persistent (but still
 * functional) state rather than throwing.
 */

export function progressKey(code: string): string {
  return `sc:progress:${code}`;
}

/**
 * Normalize a raw stored record against the rendered nav (pure — the caller
 * reads storage and the DOM): keep string entries matching a rendered section
 * slug, map legacy number entries through `order` → slug (the pre-slug storage
 * shape), and drop everything else — duplicates, sections since removed,
 * corrupt values — so stale state can never outcount the rendered sections.
 * `dirty` flags any difference from the raw record, i.e. "rewrite storage
 * once so the migration/pruning sticks".
 */
export function normalizeProgress(
  raw: unknown,
  nav: { slug: string; order: number }[],
): { slugs: Set<string>; dirty: boolean } {
  const bySlug = new Set(nav.map((n) => n.slug));
  const byOrder = new Map(nav.map((n) => [n.order, n.slug]));
  const slugs = new Set<string>();
  // Anything non-array (bar "nothing stored") is corrupt: reset it.
  if (!Array.isArray(raw)) return { slugs, dirty: raw != null };
  let dirty = false;
  for (const entry of raw) {
    if (typeof entry === "string" && bySlug.has(entry) && !slugs.has(entry)) {
      slugs.add(entry);
    } else if (typeof entry === "number" && byOrder.has(entry)) {
      slugs.add(byOrder.get(entry)!);
      dirty = true;
    } else {
      dirty = true;
    }
  }
  return { slugs, dirty };
}

/**
 * Persist a done-set to a document's per-`<body>` progress key. No-op when the
 * body carries no key or storage throws (private mode / disabled storage), so
 * the caller degrades to a non-persistent state rather than crashing.
 * Parameterized on the document so the overview's `astro:before-swap` paint can
 * write the INCOMING page's storage. Browser-only (uses `localStorage`).
 */
export function writeProgress(doc: Document, slugs: Set<string>): void {
  const key = doc.body.dataset.progressKey;
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify([...slugs]));
  } catch {}
}

/**
 * Read the stored done-set for a document, routed through `normalizeProgress`
 * so a legacy order-number record migrates and stale entries prune on first
 * sight, then rewritten once (via `writeProgress`) when that made it `dirty`.
 * Rebuilds the nav from the rendered `[data-nav-slug]`/`[data-nav-order]` links
 * and reads the key off `<body>`, so it works on both the live and an incoming
 * (view-transition) document. Empty set when the body carries no key.
 * Browser-only (uses `localStorage`).
 */
export function readProgress(doc: Document): Set<string> {
  const key = doc.body.dataset.progressKey;
  if (!key) return new Set();
  let raw: unknown = null;
  try {
    raw = JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {}
  const nav = [...doc.querySelectorAll<HTMLElement>("[data-nav-slug]")].map(
    (a) => ({ slug: a.dataset.navSlug!, order: Number(a.dataset.navOrder) }),
  );
  const { slugs, dirty } = normalizeProgress(raw, nav);
  if (dirty) writeProgress(doc, slugs);
  return slugs;
}

/**
 * Paint a document's overview surface from the stored done-set: tile
 * done-marks (with their sr-only text companions), the hero "N av M fullført"
 * row and the continue pill. The count is the INTERSECTION of stored progress
 * with the rendered tiles — `readProgress` prunes/migrates stale state — so it
 * can never show "12 av 10". Idempotent and a no-op on any document without
 * tiles, which lets the overview's own page-load paint and the layout's
 * `astro:before-swap` pre-paint (targeting the INCOMING document) share it.
 * Browser-only.
 */
export function paintOverview(doc: Document): void {
  const tiles = [
    ...doc.querySelectorAll<HTMLAnchorElement>("[data-tile-slug]"),
  ];
  if (!doc.body.dataset.progressKey || !tiles.length) return;
  const done = readProgress(doc);
  let count = 0;
  tiles.forEach((t) => {
    const on = done.has(t.dataset.tileSlug!);
    if (on) count++;
    t.classList.toggle("done", on);
    // Keep the sr-only text companion (see the aria-hidden check icon beside
    // it) in lockstep with the visual .done class.
    const sr = t.querySelector("[data-done-sr]");
    if (sr) sr.textContent = on ? ", fullført" : "";
  });
  if (!count) return; // nothing done → the hero progress row stays hidden

  const row = doc.querySelector<HTMLElement>("[data-hero-progress-row]");
  if (row) {
    const doneEl = row.querySelector("[data-progress-done]");
    if (doneEl) doneEl.textContent = String(count);
    row.hidden = false;
  }

  // First not-yet-done tile in document order, or hide the pill when there is
  // nowhere left to continue to (all done, or only stale/pruned state).
  const continueLink = doc.querySelector<HTMLAnchorElement>(
    "[data-hero-continue]",
  );
  const firstUndone = tiles.find((t) => !t.classList.contains("done"));
  if (continueLink) {
    if (firstUndone) continueLink.href = firstUndone.href;
    continueLink.hidden = !firstUndone;
  }
}
