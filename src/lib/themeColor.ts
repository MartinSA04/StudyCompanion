/**
 * Single source of truth for the browser-chrome / install-splash colours — the
 * page --bg per theme, verbatim from tokens.css. Both CourseLayout's
 * `<meta name="theme-color">` pair AND the injected manifest.webmanifest read
 * these, so an installed PWA's splash can never drift from the page ground the
 * way a second hardcoded literal once did.
 *
 * Kept as literal hex (not imported from a parsed tokens.css) because these feed
 * static <meta>/manifest output at build time; if the values here ever diverge
 * from tokens.css the Accent-Ink guardrail's own LIGHT_BG/DARK_* grounds (which
 * mirror them) are the backstop, and DESIGN.md's Literal-Swatch contract already
 * expects theme grounds to appear as explicit hex where CSS custom properties
 * can't reach.
 */
export const THEME_COLOR_LIGHT = "#fffcf0"; // --bg (light, Flexoki paper)
export const THEME_COLOR_DARK = "#100f0f"; // --bg (dark, Flexoki black)
