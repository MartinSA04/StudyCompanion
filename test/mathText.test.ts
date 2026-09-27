import { test } from "node:test";
import assert from "node:assert/strict";
import { mathStringToText, texToText } from "../src/lib/mathText.ts";

/**
 * `texToText` / `mathStringToText` build the accessible names of controls whose
 * visible text is math (a math-only <FormulaRef>, <Quiz> options, math in a
 * <Callout>/<Derivation> title): Chrome leaves KaTeX's MathML out of a
 * control's name, so without these the math is simply not announced. The
 * output must keep the formula's STRUCTURE — a flattened "dfrachp" (what the
 * symbol-search spelling texToPlain gives) is not an accurate name.
 */

test("fractions become a/b, parenthesised where a part is a sum or quotient", () => {
  assert.equal(texToText("\\lambda = \\dfrac{h}{p}"), "λ = h/p");
  assert.equal(
    texToText("\\langle n \\rangle = \\dfrac{1}{e^{\\hbar\\omega/k_BT} - 1}"),
    "⟨n⟩ = 1/(e^(ℏω/kBT) − 1)",
  );
  assert.equal(texToText("\\dfrac{a}{\\sqrt{h^2 + k^2}}"), "a/√(h^2 + k^2)");
});

test("a fraction something is juxtaposed after is parenthesised", () => {
  assert.equal(texToText("\\frac{1}{2}mv^2"), "(1/2)mv^2");
  assert.equal(texToText("\\left|\\sin\\dfrac{ka}{2}\\right|"), "|sin (ka/2)|");
  // Before it, the reading is the same either way.
  assert.equal(texToText("-\\dfrac{hcR}{n^2}"), "−hcR/n^2");
});

test("relations and binary operators are spaced; unary signs are not", () => {
  assert.equal(texToText("E_{\\text{kin}} = h\\nu - W"), "Ekin = hν − W");
  assert.equal(texToText("m = 0, \\pm1, \\pm2"), "m = 0, ±1, ±2");
});

test("superscripts keep their ^, subscripts run on, primes attach", () => {
  assert.equal(texToText("x^{-1/2}"), "x^(−1/2)");
  assert.equal(texToText("k_B T"), "kBT");
  assert.equal(texToText("m_n^*"), "mn∗");
  assert.equal(texToText("L'"), "L′");
});

test("functions and large operators are spaced off their arguments", () => {
  assert.equal(texToText("2d\\sin\\theta = n\\lambda"), "2d sin θ = nλ");
  assert.equal(texToText("\\sin^2\\theta"), "sin^2 θ");
  assert.equal(texToText("\\sum_j f_j"), "∑j fj");
});

test("meaning-bearing accents stay; vector arrows and spacing hints go", () => {
  assert.equal(texToText("\\dot q"), "q̇");
  assert.equal(texToText("\\hat F"), "F̂");
  assert.equal(texToText("\\vec{a}_1"), "a1");
  assert.equal(texToText("a \\allowbreak + b"), "a + b");
});

test("aligned rows split by a semicolon", () => {
  assert.equal(
    texToText("\\begin{aligned} k &= 2\\pi m \\\\ m &= 0 \\end{aligned}"),
    "k = 2πm; m = 0",
  );
});

test("a TeX error falls back to the symbol spelling, never markup", () => {
  assert.equal(texToText("\\badcommand{x"), "badcommandx");
});

test("mathStringToText: prose kept, math linearised, inline tags dropped", () => {
  assert.equal(
    mathStringToText("Bølgelengden $\\lambda$ blir kortere"),
    "Bølgelengden λ blir kortere",
  );
  assert.equal(mathStringToText("$H$ er ikke energien"), "H er ikke energien");
  assert.equal(
    mathStringToText("<b>Snells lov</b> for H<sub>2</sub>O<br>linje"),
    "Snells lov for H2O linje",
  );
  assert.equal(mathStringToText("$$\\int_0^1 x\\,dx$$"), "∫0^1 x dx");
  // Soft hyphens are display-only (lib/text.ts plain()).
  assert.equal(mathStringToText("Halv­leder"), "Halvleder");
  // A lone $ is prose, exactly as renderMathString treats it.
  assert.equal(mathStringToText("koster $5"), "koster $5");
});
