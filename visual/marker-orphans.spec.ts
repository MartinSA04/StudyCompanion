import { test, expect } from "@playwright/test";

/**
 * Deep-link markers and leading dots must never take a row of their own.
 *
 * Three components put a small marker beside a piece of text — <Statement>'s "#"
 * anchor, <Simulation>/<Stepper>'s accent dot, and the glossary row's "#". Each
 * one is a sibling of the text inside a `flex-wrap: wrap` row, so when the text
 * grew long the TEXT wrapped to the next flex line and left the marker stranded
 * on the first one (or the marker itself dropped to a line below). Reported in
 * the wild as "Fulle bånd leder ikke" at 400px.
 *
 * The rule that fixes the two flex rows is the same, and it is structural rather
 * than a flex tweak: the leading mark and the text live in ONE inline box (a
 * `.panel-lead` / `.statement-lead` wrapper) which takes a zero flex basis, so
 * it drops out of the row's line-packing entirely. The mark cannot be stranded
 * because it is part of the text's own inline run, not a sibling competing for
 * a flex line. The second, equally load-bearing property of that box is tested
 * separately below: the text hangs no indent. `.prose` headings solve the same
 * problem with a grid column and are covered by heading-anchor.spec.ts.
 *
 * The glossary case is here as a characterisation guard, not a fixed bug: its
 * "#" is an inline box in a block `<dt>` — the shape that DID break in prose
 * headings — but it was measured across 320–700px with an unbreakable compound
 * term and never orphaned, so its markup was deliberately left alone. If a
 * future change to the term column breaks it, this catches it.
 *
 * Labels are lengthened at runtime rather than in the demo content, so the
 * kitchen-sink baselines keep their own copy and this stays a pure layout test.
 */

type Case = {
  name: string;
  path: string;
  row: string;
  text: string;
  marker: string;
  /** Replacement label — taken from real course content, where these broke. */
  long: string;
};

const CASES: Case[] = [
  {
    name: "<Statement> anchor",
    path: "/sammenligning",
    row: ".statement-head",
    text: ".statement-name",
    marker: ".statement-anchor",
    // TFE4146, reported orphaned at 400px.
    long: "Fulle bånd leder ikke",
  },
  {
    name: "<Simulation> dot",
    path: "/simulering",
    row: ".panel-head",
    text: ".panel-title",
    marker: ".panel-dot",
    // TDT4120: long hyphenated tokens, stranded the dot up to 450px.
    long: "Ford-Fulkerson / Edmonds-Karp",
  },
  {
    name: "glossary anchor",
    path: "/begreper",
    row: ".gloss-term",
    text: ".gloss-term > span",
    marker: ".gloss-anchor",
    // A single unbreakable compound, which is what fills a term column and
    // leaves the "#" nowhere to go.
    long: "Ladningsbærerkonsentrasjon",
  },
];

for (const c of CASES) {
  test(`${c.name} stays beside its text when the text wraps`, async ({
    page,
  }) => {
    await page.goto(c.path);
    // The markers are hover affordances; force them visible so they are
    // measurable at rest.
    await page.addStyleTag({
      content: `${c.marker} { opacity: 1 !important; }`,
    });

    const measure = async () =>
      page.evaluate((c) => {
        const out: {
          text: string;
          orphaned: boolean;
          lines: number;
          rowWrapped: boolean;
        }[] = [];
        for (const row of document.querySelectorAll<HTMLElement>(c.row)) {
          const marker = row.querySelector<HTMLElement>(c.marker);
          const text = row.querySelector<HTMLElement>(c.text);
          if (!marker || !text || !marker.getBoundingClientRect().height) {
            continue;
          }
          const mr = marker.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(text);
          const lines = [...range.getClientRects()].filter((r) => r.width > 0);
          if (!lines.length) continue;
          const first = lines[0];
          const block = text.getBoundingClientRect();
          out.push({
            text: (text.textContent ?? "").trim().slice(0, 30),
            // Stranded when the marker shares no vertical band with the text at
            // all. Measured against the text's whole block, not its first line:
            // these markers are centre-aligned by design, so on a label that
            // wraps to three lines the marker sits beside the middle one and
            // touching line 1 is not required. Symmetric on purpose —
            // <Statement> dropped its anchor below the name, <Simulation> kept
            // the dot up top and wrapped the title beneath it, and both are the
            // same defect.
            orphaned: !(mr.bottom > block.top + 1 && mr.top < block.bottom - 1),
            lines: lines.length,
            // Proof the layout was actually under pressure. Not "the text
            // wrapped": in the broken state the text does NOT wrap — the whole
            // flex item jumps to the next line intact — so a text-wrap guard
            // would report nothing while the bug is at its worst.
            rowWrapped: row.getBoundingClientRect().height > first.height * 1.4,
          });
        }
        return out;
      }, c);

    // The label that broke in the wild, so this measures the real case.
    await page.evaluate((c) => {
      for (const row of document.querySelectorAll(c.row)) {
        const text = row.querySelector(c.text);
        if (text) text.textContent = c.long;
      }
    }, c);

    const offenders: string[] = [];
    let sawWrap = false;
    for (let w = 320; w <= 700; w += 10) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const r of await measure()) {
        if (r.rowWrapped) sawWrap = true;
        if (r.orphaned)
          offenders.push(`@${w}px — "${r.text}" (${r.lines} lines)`);
      }
    }

    // Guards the guard: if nothing ever wrapped, the test proved nothing.
    expect(sawWrap, "the row never had to wrap — nothing was proven").toBe(
      true,
    );
    expect(offenders).toEqual([]);
  });
}

/**
 * The other half of the lead contract: a title that wraps must NOT hang an
 * indent under its mark.
 *
 * Keeping the mark beside the text is easy to over-solve. Giving the text its
 * own flex column does it — and turns the header into two columns, a narrow
 * badge on the left and a stack of short lines on the right ("Regneeksempel"
 * over a three-line title in a 400px panel). The mark stops reading as the
 * first word of the title and starts reading as an icon in a gutter.
 *
 * So the fix is an inline run, not a column: line 2 onwards must start at the
 * lead's own left edge, level with the mark, not indented past it. Measured with
 * a Range because the wrapping text is inline — one border box, many line rects.
 */
const LEADS = [
  {
    name: "<Example> kicker",
    path: "/eksempler",
    lead: ".panel-lead",
    text: ".panel-title",
    long: "Brytning ved overgangen vann–luft ved total refleksjon",
  },
  {
    name: "<Simulation> dot",
    path: "/simulering",
    lead: ".panel-lead",
    text: ".panel-title",
    long: "Ford-Fulkerson / Edmonds-Karp maksimal flyt",
  },
  {
    name: "<Statement> badge",
    path: "/sammenligning",
    lead: ".statement-lead",
    text: ".statement-name",
    long: "Fulle bånd leder ikke til strømtransport",
  },
  {
    name: "admonition kicker",
    path: "/mer",
    lead: ".adm-kicker",
    text: ".adm-label",
    long: "Merk grensetilfellet ved total refleksjon her",
  },
];

for (const c of LEADS) {
  test(`${c.name} — a wrapped title starts flush, not in a column`, async ({
    page,
  }) => {
    await page.goto(c.path);
    await page.evaluate((c) => {
      for (const lead of document.querySelectorAll(c.lead)) {
        const t = lead.querySelector(c.text);
        if (t) t.textContent = c.long;
      }
    }, c);

    const offenders: string[] = [];
    let sawWrap = false;
    for (let w = 320; w <= 700; w += 10) {
      await page.setViewportSize({ width: w, height: 900 });
      const rows = await page.evaluate((c) => {
        const out: { lines: number; indent: number }[] = [];
        for (const lead of document.querySelectorAll<HTMLElement>(c.lead)) {
          const text = lead.querySelector<HTMLElement>(c.text);
          if (!text) continue;
          const range = document.createRange();
          range.selectNodeContents(text);
          const lines = [...range.getClientRects()].filter((r) => r.width > 0);
          if (lines.length < 2) continue;
          // How far the LAST line starts to the right of the lead's own content
          // edge. Zero is flush; a hanging indent shows up as roughly the mark's
          // width plus its gap.
          out.push({
            lines: lines.length,
            indent:
              lines[lines.length - 1].left - lead.getBoundingClientRect().left,
          });
        }
        return out;
      }, c);
      for (const r of rows) {
        sawWrap = true;
        // 1px of tolerance for subpixel line-box rounding; a real hanging indent
        // is the mark's width (a 9px dot at the very least, plus the gap).
        if (r.indent > 1)
          offenders.push(`@${w}px — indented ${r.indent.toFixed(1)}px`);
      }
    }

    expect(sawWrap, "the title never wrapped — nothing was proven").toBe(true);
    expect(offenders).toEqual([]);
  });
}
