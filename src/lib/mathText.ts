import katex from "katex";
import { plain } from "./text.ts";
import { texToPlain } from "./texPlain.ts";

/**
 * One line of plain text for a formula, or for an author string carrying
 * `$…$` math — what an `aria-label` needs where the MathML can't reach.
 *
 * Chrome leaves KaTeX's MathML out of a control's accessible name, so a link or
 * button whose visible text is (or contains) a formula is announced without it:
 * a math-only `<FormulaRef>` is named "", and a quiz option "Bølgelengden
 * $\lambda$ blir kortere" reads "Bølgelengden blir kortere". Those widgets set
 * their name from this instead.
 *
 * `texToPlain` (lib/texPlain.ts) is the wrong tool here: it spells a SYMBOL the
 * way a reader would type it into a search box, so it drops all structure
 * (`\dfrac{h}{p}` → "dfrachp"). This linearises KaTeX's own MathML instead —
 * KaTeX has already parsed every macro, environment and `\left…\right`, and its
 * MathML marks what is a fraction, a script, an operator — into the usual
 * plain-text math notation: `h/p`, `1/(e^(hν/kBT) − 1)`, `√(x^2 + 1)`, spaces
 * around relations and binary operators, subscripts run on (`kB`, the way the
 * MathML reads in body copy), superscripts behind a `^`. Juxtaposition binds
 * tighter than `/` (`ℏ^2k^2/2m∗`), as physics writes it. Build-time only.
 */

/** A parsed MathML element; text nodes are plain strings. */
type MNode = { tag: string; attrs: string; children: (MNode | string)[] };

/** How an atom sits in a row — decides spacing and fraction parentheses. */
type Kind =
  | "ord"
  | "fn" // a function name (sin, ln): spaced off what precedes it
  | "op" // a large operator with its limits (∑j, ∫0^1): spaced off what follows
  | "frac"
  | "rel"
  | "bin"
  | "punct"
  | "open"
  | "close"
  | "fence" // | or ‖ from \left/\right: opens or closes by position
  | "space";
/** `n` counts the atoms a row was built from, so a part that is ONE atom
    (√(x+1), a^2) never gets a second pair of parentheses around it. */
type Atom = { text: string; kind: Kind; n?: number };

const REL = new Set("=<>≤≥≈≠≡∝∼≃≅≪≫∈∉⊂⊆⊃⊇→←↔⇒⇐⇔↦:≔");
const BIN = new Set("+−±∓×·÷∗∘∪∩⊕⊗");
const OPEN = new Set("([{⟨⌊⌈");
const CLOSE = new Set(")]}⟩⌋⌉");
const LARGE_OP = new Set("∑∏∐∫∬∭∮⋃⋂⨁⨂");
/** Accents that change what the symbol means (q̇, Ĥ) keep a combining mark;
    the vector arrow is dropped — its combining form reads as noise. */
const ACCENTS: Record<string, string> = {
  "˙": "̇",
  "¨": "̈",
  "^": "̂",
  ˆ: "̂",
  "~": "̃",
  "˜": "̃",
  ˉ: "̄",
  "¯": "̄",
  "‾": "̄",
};
/** Superscripts that attach as glyphs, not behind a `^`: L′, m*, A†. */
const RAISED = /^[′″‴*∗†‡]+$/;

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/ /g, " ")
    .replace(/∣/g, "|")
    .replace(/⋅/g, "·");

/** KaTeX's MathML is regular, self-closing-aware markup; a tag walk suffices. */
function parse(mathml: string): MNode {
  const root: MNode = { tag: "#root", attrs: "", children: [] };
  const stack = [root];
  const re = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mathml))) {
    const top = stack[stack.length - 1];
    if (m[5] != null) {
      top.children.push(decode(m[5]));
    } else if (m[1]) {
      if (stack.length > 1) stack.pop();
    } else {
      const node: MNode = { tag: m[2], attrs: m[3], children: [] };
      top.children.push(node);
      if (!m[4]) stack.push(node);
    }
  }
  return root;
}

const textOf = (n: MNode | string): string =>
  typeof n === "string" ? n : n.children.map(textOf).join("");
const elements = (n: MNode) =>
  n.children.filter((c): c is MNode => typeof c !== "string");
const attr = (n: MNode, name: string) =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(n.attrs)?.[1];

/** Already one parenthesised group: "(a + b)", but not "(a)(b)". */
function isWrapped(s: string): boolean {
  if (!s.startsWith("(") || !s.endsWith(")")) return false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")" && --depth === 0 && i < s.length - 1) return false;
  }
  return true;
}
const paren = (s: string) => (isWrapped(s) ? s : `(${s})`);

/** A numerator/denominator needs parentheses when it is a quotient itself, or
    a row holding a sum, a spaced product or a list. */
function fracPart(a: Atom): string {
  const t = a.text.trim();
  if (a.kind === "frac") return paren(t);
  if ((a.n ?? 1) === 1) return t;
  return /[\s+\-−±∓=<>≤≥≈≠/·×,;]/.test(t) ? paren(t) : t;
}
/** A superscript or radicand stays bare only as one number or one letter. */
const scriptPart = (s: string) =>
  /^(\p{N}+|\p{L}|∞)$/u.test(s) ? s : paren(s);
/** A subscript runs on (kB, dhkl) unless it is itself a phrase (x → 0). */
const subPart = (s: string) => (/\s/.test(s) ? `_(${s})` : s);

function render(n: MNode | string): Atom {
  if (typeof n === "string") return { text: n, kind: "ord" };
  const kids = elements(n);
  switch (n.tag) {
    case "annotation":
    case "mphantom":
      return { text: "", kind: "ord" };
    case "mi": {
      const t = textOf(n);
      // A multi-letter identifier is a function name (sin, ln, lim).
      return { text: t, kind: t.length > 1 ? "fn" : "ord" };
    }
    case "mn":
      return { text: textOf(n), kind: "ord" };
    case "mtext": {
      const t = textOf(n);
      return t.trim() ? { text: t, kind: "ord" } : { text: " ", kind: "space" };
    }
    case "mspace": {
      const w = attr(n, "width");
      const gap = attr(n, "linebreak") || (w && !w.startsWith("-"));
      return { text: gap ? " " : "", kind: "space" };
    }
    case "mo": {
      const t = textOf(n);
      if (t === "⁡") return { text: " ", kind: "space" }; // function application
      if (t === "⁢" || t === "⁣") return { text: "", kind: "space" };
      if (attr(n, "separator") === "true" || t === "," || t === ";")
        return { text: t, kind: "punct" };
      if (REL.has(t)) return { text: t, kind: "rel" };
      if (BIN.has(t)) return { text: t, kind: "bin" };
      if (OPEN.has(t)) return { text: t, kind: "open" };
      if (CLOSE.has(t)) return { text: t, kind: "close" };
      if (LARGE_OP.has(t)) return { text: t, kind: "op" };
      if (attr(n, "fence") === "true") return { text: t, kind: "fence" };
      return { text: t, kind: "ord" };
    }
    case "mfrac": {
      const [num, den] = kids.map(render);
      return { text: `${fracPart(num)}/${fracPart(den)}`, kind: "frac" };
    }
    case "msup":
    case "msub":
    case "msubsup":
    case "munder":
    case "mover":
    case "munderover": {
      const base = render(kids[0]);
      if (n.tag === "mover" && attr(n, "accent") === "true") {
        const mark = ACCENTS[textOf(kids[1]).trim()];
        const single = [...base.text].length === 1;
        return { text: base.text + (mark && single ? mark : ""), kind: "ord" };
      }
      // Limits (∑ under/over, \lim) read like sub/superscripts.
      const lower = ["msub", "msubsup", "munder", "munderover"].includes(n.tag);
      const upper = ["msup", "msubsup", "mover", "munderover"].includes(n.tag);
      const sub = lower ? render(kids[1]).text.trim() : "";
      const sup = upper ? render(kids[kids.length - 1]).text.trim() : "";
      const raised = !sup ? "" : RAISED.test(sup) ? sup : `^${scriptPart(sup)}`;
      // `\sin^2` nests the function-application gap inside the base; move it
      // behind the exponent (sin^2 θ, not sin ^2θ).
      const gap = /\s$/.test(base.text) ? " " : "";
      return {
        text: base.text.trimEnd() + (sub ? subPart(sub) : "") + raised + gap,
        kind: base.kind === "fn" || base.kind === "op" ? base.kind : "ord",
      };
    }
    case "msqrt":
      return { text: `√${scriptPart(row(kids).text.trim())}`, kind: "ord" };
    case "mroot": {
      const [radicand, index] = kids.map((k) => render(k).text.trim());
      const sign = index === "3" ? "∛" : index === "4" ? "∜" : `${index}√`;
      return { text: sign + scriptPart(radicand), kind: "ord" };
    }
    case "mtable":
      // aligned/cases/matrices: cells run on, rows split by a semicolon.
      return {
        text: kids
          .map((tr) =>
            elements(tr)
              .map((td) => row(elements(td)).text)
              .join(" "),
          )
          .join("; "),
        kind: "ord",
      };
    default:
      // math, semantics, mrow, mstyle, mpadded, menclose…: a row.
      return row(n.children);
  }
}

/** A row of atoms. One that holds a single atom keeps that atom's kind, so an
    \dfrac inside an mstyle still parenthesises like a bare fraction. */
function row(nodes: (MNode | string)[]): Atom {
  const atoms = nodes.map(render).filter((a) => a.text !== "");
  const solid = atoms.filter((a) => a.kind !== "space");
  const text = join(atoms);
  return solid.length === 1
    ? { ...solid[0], text }
    : { text, kind: "ord", n: solid.length };
}

/** Space a row the way it reads: `a = b`, `x + 1`, `−x`, `f(x), g`, `2 sin θ`. */
function join(atoms: Atom[]): string {
  let out = "";
  let prev: Kind | null = null;
  const leading = (k: Kind | null) =>
    k == null || k === "rel" || k === "bin" || k === "punct" || k === "open";
  atoms.forEach((a, i) => {
    let kind = a.kind;
    switch (kind) {
      case "space":
        out += a.text;
        return;
      case "rel":
        out += ` ${a.text} `;
        break;
      case "bin":
        // Unary at the start, after an operator or an opening bracket: −x, (±1.
        out += leading(prev) ? a.text : ` ${a.text} `;
        break;
      case "punct":
        out = out.trimEnd() + `${a.text} `;
        break;
      case "fn":
        out += leading(prev) ? a.text : ` ${a.text}`;
        break;
      case "op":
        out += `${leading(prev) ? "" : " "}${a.text} `;
        break;
      case "fence":
        // \left| … \right|: the first one opens, the next one closes.
        kind = leading(prev) ? "open" : "close";
        out += a.text;
        break;
      case "frac": {
        // Parenthesise a fraction something is juxtaposed AFTER, (1/2)mv^2,
        // or a function applies to, sin (ka/2). One juxtaposed before reads
        // the same either way (2π x/y).
        const next = atoms.slice(i + 1).find((b) => b.kind !== "space");
        const glued =
          prev === "fn" ||
          (next != null &&
            ["ord", "fn", "op", "frac", "open"].includes(next.kind));
        out += glued ? paren(a.text) : a.text;
        break;
      }
      default:
        out += a.text;
    }
    prev = kind;
  });
  return out;
}

const tidy = (s: string) =>
  s
    .replace(/\s+/g, " ")
    .replace(/([([{⟨]) /g, "$1")
    .replace(/ ([)\]}⟩,;])/g, "$1")
    .trim();

/** A TeX formula as one line of plain text: `\dfrac{h}{p}` → "h/p". */
export function texToText(tex: string): string {
  const html = katex.renderToString(tex, {
    output: "mathml",
    throwOnError: false,
  });
  // A TeX error renders KaTeX's red source span, not MathML: fall back to the
  // symbol spelling rather than announce markup.
  if (!html.includes("<math")) return texToPlain(tex);
  return tidy(row(parse(html).children).text);
}

/** The simple-inline-HTML tags renderMathString lets through (lib/katex.ts);
    a <br> separates words, the rest only wrap them. */
const INLINE_TAG = /<\/?(?:b|i|em|strong|sub|sup|code)>/g;
const BREAK_TAG = /<\/?br>/g;

/**
 * An author string in the renderMathString contract (`$…$` / `$$…$$` math,
 * simple inline tags) as one line of plain text: each math span through
 * `texToText`, the whitelisted tags dropped, soft hyphens removed.
 */
export function mathStringToText(text: string): string {
  return tidy(
    plain(text)
      .split(/(\$\$[^$]*\$\$|\$[^$]+\$)/g)
      .map((part) => {
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4)
          return texToText(part.slice(2, -2));
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2)
          return texToText(part.slice(1, -1));
        return part.replace(BREAK_TAG, " ").replace(INLINE_TAG, "");
      })
      .join(""),
  );
}
