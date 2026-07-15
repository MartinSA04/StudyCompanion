import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ogLocale,
  truncateDescription,
  stripInline,
  absoluteUrl,
  trimTrailingSlash,
  canonicalPathname,
} from "../src/lib/seo.ts";

test("ogLocale maps the schema languages, defaulting to nb_NO", () => {
  assert.equal(ogLocale("nb"), "nb_NO");
  assert.equal(ogLocale("nn"), "nn_NO");
  assert.equal(ogLocale("en"), "en_US");
  // Unknown / unset → the Norwegian-bokmål default (the schema default lang).
  assert.equal(ogLocale("xx"), "nb_NO");
});

test("truncateDescription collapses whitespace and leaves short text intact", () => {
  assert.equal(truncateDescription("  a   b\n c "), "a b c");
  assert.equal(truncateDescription(""), "");
  assert.equal(truncateDescription("   "), "");
});

test("truncateDescription soft-truncates at a word boundary with an ellipsis", () => {
  const long = "word ".repeat(60).trim(); // 60 words, well over 155 chars
  const out = truncateDescription(long, 40);
  assert.ok(out.length <= 41, `expected ≤41 chars, got ${out.length}`);
  assert.ok(out.endsWith("…"));
  assert.ok(!out.endsWith(" …")); // no dangling space before the ellipsis
  assert.ok(!/\bwor…$/.test(out)); // cut on a boundary, not mid-word
});

test("truncateDescription falls back to a hard cut when no near boundary", () => {
  const out = truncateDescription("supercalifragilisticexpialidocious", 10);
  assert.equal(out, "supercalif…");
});

test("stripInline removes tags and $math$ delimiters, keeping inner text", () => {
  assert.equal(stripInline("Energi <b>er</b> $E=mc^2$"), "Energi er E=mc^2");
  assert.equal(stripInline("<a href='x'>link</a>"), "link");
  assert.equal(stripInline("  spaced   out  "), "spaced out");
});

test("trimTrailingSlash drops a trailing slash but keeps the root", () => {
  assert.equal(trimTrailingSlash("/simulering/"), "/simulering");
  assert.equal(trimTrailingSlash("/simulering"), "/simulering");
  assert.equal(trimTrailingSlash("/"), "/");
  assert.equal(trimTrailingSlash("/a/b/"), "/a/b");
});

test("canonicalPathname strips the build.format:file .html and maps /index to root", () => {
  // build.format:"file" makes Astro.url.pathname carry ".html".
  assert.equal(canonicalPathname("/oversikt.html"), "/oversikt");
  assert.equal(canonicalPathname("/index.html"), "/");
  // Already-clean slug-less paths pass through untouched.
  assert.equal(canonicalPathname("/oversikt"), "/oversikt");
  assert.equal(canonicalPathname("/"), "/");
  // Trailing-slash backstop still applies (a host serving /slug/).
  assert.equal(canonicalPathname("/oversikt/"), "/oversikt");
});

test("canonicalPathname agrees byte-for-byte with the slug-derived URLs", () => {
  // The canonical/og:url (from the live pathname) and the sitemap <loc> /
  // JSON-LD `url` / internal hrefs (built from `/<slug>` via absoluteUrl) must
  // resolve to the identical absolute URL per page.
  const site = "https://demo.example.com";
  // A section served at /oversikt.html vs the slug-derived "/oversikt".
  assert.equal(
    absoluteUrl(canonicalPathname("/oversikt.html"), site),
    absoluteUrl("/oversikt", site),
  );
  // The home page: /index.html vs the advertised "/".
  assert.equal(
    absoluteUrl(canonicalPathname("/index.html"), site),
    absoluteUrl("/", site),
  );
});

test("absoluteUrl resolves against site, or returns the path when site is unset", () => {
  assert.equal(
    absoluteUrl("/foton", "https://demo.example.com"),
    "https://demo.example.com/foton",
  );
  assert.equal(
    absoluteUrl("/foton", new URL("https://demo.example.com/base/")),
    "https://demo.example.com/foton",
  );
  assert.equal(absoluteUrl("/foton"), "/foton");
  assert.equal(absoluteUrl("/foton", undefined), "/foton");
});
