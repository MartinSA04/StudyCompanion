/**
 * Reading-progress storage contract, backed by localStorage. Keys are
 * namespaced per course: `sc:progress:<course.code>`, value is a JSON array of
 * the section `order` numbers the reader has marked done.
 *
 * CourseLayout's inline progress script reads/writes this same key+shape; these
 * typed helpers exist for any island that needs the data server-safely. All
 * access is wrapped in try/catch so private-mode / disabled storage degrades to
 * a non-persistent (but still functional) state rather than throwing.
 */

export function progressKey(code: string): string {
  return `sc:progress:${code}`;
}

/** The set of section `order` numbers the reader has marked as read. */
export function readSections(code: string): Set<number> {
  try {
    const raw = localStorage.getItem(progressKey(code));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.map(Number)) : new Set();
  } catch {
    return new Set();
  }
}

export function writeSections(code: string, set: Set<number>): void {
  try {
    localStorage.setItem(progressKey(code), JSON.stringify([...set]));
  } catch {
    /* storage unavailable — progress simply won't persist */
  }
}

export function resetProgress(code: string): void {
  try {
    localStorage.removeItem(progressKey(code));
  } catch {
    /* no-op */
  }
}
