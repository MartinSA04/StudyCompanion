import { test } from "node:test";
import assert from "node:assert/strict";
import { texToPlain } from "../src/lib/texPlain.ts";

// The plain spelling of a symbol is what a reader would TYPE into the Symboler
// search box (or what a crawler should see as the DefinedTerm name): Greek
// commands become glyphs, font wrappers vanish, and the structural TeX
// punctuation (braces, ^, _) drops out.
test("subscripts and superscripts flatten to the bare letters", () => {
  assert.equal(texToPlain("N_c"), "Nc");
  assert.equal(texToPlain("m_n^*"), "mn*");
  assert.equal(texToPlain("k_B T"), "kBT");
  assert.equal(texToPlain("E_{F}"), "EF");
});

test("Greek and symbol commands become their glyphs", () => {
  assert.equal(texToPlain("\\mu_n"), "μn");
  assert.equal(texToPlain("\\tau_p"), "τp");
  assert.equal(texToPlain("\\hbar"), "ħ");
  assert.equal(texToPlain("\\varepsilon_r"), "εr");
  assert.equal(texToPlain("\\Delta n"), "Δn");
  assert.equal(texToPlain("\\langle v_x \\rangle"), "⟨vx⟩");
});

test("font wrappers are dropped so the letter itself remains", () => {
  assert.equal(texToPlain("\\mathcal{E}"), "E");
  assert.equal(texToPlain("\\mathcal{E}_x"), "Ex");
  assert.equal(texToPlain("\\mathbf{k}"), "k");
  assert.equal(texToPlain("\\mu_\\text{gitter}"), "μgitter");
  // Nested wrappers unwrap fully.
  assert.equal(texToPlain("\\mathbf{\\hat{x}}"), "x");
});

test("spacing commands and \\left/\\right vanish; unknown commands keep their name", () => {
  assert.equal(texToPlain("\\partial\\,\\delta p/\\partial t"), "∂δp/∂t");
  assert.equal(texToPlain("\\left( a \\right)"), "(a)");
  assert.equal(texToPlain("\\foo_1"), "foo1");
});
