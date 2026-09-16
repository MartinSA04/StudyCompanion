/**
 * The plain spelling of a symbol's TeX — what a reader would TYPE to find it
 * (`N_c` → "Nc", `\mu_n` → "μn", `\mathcal{E}_x` → "Ex") and what a crawler
 * should read as the DefinedTerm name on the Symboler page. Deliberately a
 * flattening, not a typesetting: sub/superscripts lose their level, font
 * wrappers drop to their bare letter, and unknown commands keep their name so
 * nothing silently disappears. Kept pure (no KaTeX) so it is unit-testable and
 * cheap to run per row at build time.
 */

/** Command → glyph for the symbols that appear in course notation. */
const GLYPHS: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  rho: "ρ",
  varrho: "ρ",
  sigma: "σ",
  varsigma: "ς",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  varphi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Upsilon: "Υ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
  hbar: "ħ",
  ell: "ℓ",
  infty: "∞",
  partial: "∂",
  nabla: "∇",
  langle: "⟨",
  rangle: "⟩",
  cdot: "·",
  times: "×",
  pm: "±",
  mp: "∓",
  to: "→",
  rightarrow: "→",
  leftarrow: "←",
  prime: "′",
  circ: "∘",
  degree: "°",
  approx: "≈",
  propto: "∝",
  // Sizing/fencing commands contribute no glyph of their own.
  left: "",
  right: "",
  big: "",
  Big: "",
  bigl: "",
  bigr: "",
  Bigl: "",
  Bigr: "",
};

/**
 * Font and accent wrappers whose argument IS the symbol: `\mathcal{E}` is the
 * letter E to a reader typing a search, not "mathcal".
 */
const WRAPPER =
  /\\(?:text|textrm|textit|textbf|mathrm|mathcal|mathbf|mathit|mathsf|mathbb|mathfrak|boldsymbol|bm|vec|hat|bar|tilde|dot|ddot|overline|underline|operatorname)\s*\{([^{}]*)\}/g;

export function texToPlain(tex: string): string {
  let s = tex;
  // Unwrap from the inside out — `\mathbf{\hat{x}}` needs two passes; a
  // bounded loop keeps a pathological input from spinning.
  for (let i = 0; i < 4; i++) {
    const next = s.replace(WRAPPER, "$1");
    if (next === s) break;
    s = next;
  }
  return (
    s
      // Named commands → glyph; anything unlisted keeps its name (`\foo` → "foo")
      // rather than vanishing, so a typo stays findable and visible.
      .replace(/\\([a-zA-Z]+)/g, (_, name: string) => GLYPHS[name] ?? name)
      // Spacing commands: `\,` `\;` `\:` `\!` `\ ` and `\quad`-family names are
      // already handled above (they keep their name — none are used in symbols).
      .replace(/\\[,;:! ]/g, "")
      // Structural punctuation carries no letters.
      .replace(/[{}^_]/g, "")
      .replace(/\s+/g, "")
  );
}
