/**
 * Prefilled GitHub new-issue deep-link for a module page's «Foreslå endring»
 * action. `/issues/new?title=…&body=…` needs no template file in the course
 * repo and no fork — GitHub's `/edit/` route walls non-collaborators behind a
 * fork prompt, which is a dead end for most readers. The body anchors the
 * report to the page (reader-facing URL) and the source file (`blob/` link,
 * where the branch matters), so the maintainer never has to ask "which page?".
 */
import { plain } from "./text.ts";

export function sectionIssueUrl(opts: {
  repoUrl: string;
  branch: string;
  filePath: string;
  /** Folio number as rendered in the module header, e.g. "03". */
  index: string;
  title: string;
  /** Absolute reader-facing URL; omitted when the build has no `site`. */
  pageUrl?: string;
}): string {
  const repo = opts.repoUrl.replace(/\/+$/, "");
  // A machine-read boundary: the title leaves the page as data (see text.ts).
  const name = `${opts.index} · ${plain(opts.title)}`;
  const subject = opts.pageUrl ? `[${name}](${opts.pageUrl})` : name;
  const body = [
    `Gjelder: ${subject}`,
    `Kilde: ${repo}/blob/${opts.branch}/${opts.filePath}`,
    "",
    "**Hva er feil, eller hva foreslår du?**",
    "",
  ].join("\n");
  const params = new URLSearchParams({ title: `[${name}] `, body });
  return `${repo}/issues/new?${params}`;
}
