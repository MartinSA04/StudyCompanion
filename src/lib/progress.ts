/**
 * Reading-progress storage contract, backed by localStorage. Keys are
 * namespaced per course: `sc:progress:<course.code>`, value is a JSON array of
 * the section slugs the reader has marked done. Slugs — not `order` numbers —
 * because order is mutable editorial state: renumbering sections would shift
 * every done-mark onto the wrong module, while a slug follows its file.
 *
 * The layout and overview scripts read/write this key themselves (they need
 * the per-document key off `<body data-progress-key>` across view-transition
 * swaps), routing every read through `normalizeProgress` so the legacy
 * order-number records (pre-slug releases) migrate and stale entries prune on
 * first sight. Storage access stays try/catch-wrapped at the call sites so
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
