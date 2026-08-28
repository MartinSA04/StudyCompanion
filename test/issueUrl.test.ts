import { test } from "node:test";
import assert from "node:assert/strict";
import { sectionIssueUrl } from "../src/lib/issueUrl.ts";

const opts = {
  repoUrl: "https://github.com/msa/tfy4345-companion",
  branch: "main",
  filePath: "content/modules/03-lagrange.mdx",
  index: "03",
  title: "Lagrangeformalismen",
  pageUrl: "https://tfy4345.example.no/lagrangeformalismen",
};

test("sectionIssueUrl targets the repo's new-issue route", () => {
  const url = new URL(sectionIssueUrl(opts));
  assert.equal(url.origin + url.pathname, `${opts.repoUrl}/issues/new`);
});

test("sectionIssueUrl prefills the title with the module's folio + name", () => {
  const url = new URL(sectionIssueUrl(opts));
  assert.equal(url.searchParams.get("title"), "[03 · Lagrangeformalismen] ");
});

test("sectionIssueUrl body links the page and the source file", () => {
  const body = new URL(sectionIssueUrl(opts)).searchParams.get("body")!;
  assert.match(
    body,
    /Gjelder: \[03 · Lagrangeformalismen\]\(https:\/\/tfy4345\.example\.no\/lagrangeformalismen\)/,
  );
  assert.ok(
    body.includes(
      "Kilde: https://github.com/msa/tfy4345-companion/blob/main/content/modules/03-lagrange.mdx",
    ),
  );
  assert.match(body, /Hva er feil, eller hva foreslår du\?/);
});

test("sectionIssueUrl without a page URL names the module as plain text", () => {
  const { pageUrl: _, ...rest } = opts;
  const body = new URL(sectionIssueUrl(rest)).searchParams.get("body")!;
  assert.match(body, /Gjelder: 03 · Lagrangeformalismen\n/);
  assert.ok(!body.includes("]("));
});

test("sectionIssueUrl strips soft hyphens — the title as spelled, not as wrapped", () => {
  const url = new URL(
    sectionIssueUrl({ ...opts, title: "Lagrange­formalismen" }),
  );
  assert.equal(url.searchParams.get("title"), "[03 · Lagrangeformalismen] ");
  assert.ok(!url.searchParams.get("body")!.includes("­"));
});

test("sectionIssueUrl trims trailing slashes off repoUrl", () => {
  const url = sectionIssueUrl({ ...opts, repoUrl: `${opts.repoUrl}//` });
  assert.ok(url.startsWith(`${opts.repoUrl}/issues/new?`));
  assert.ok(
    new URL(url).searchParams
      .get("body")!
      .includes(`${opts.repoUrl}/blob/main/`),
  );
});
