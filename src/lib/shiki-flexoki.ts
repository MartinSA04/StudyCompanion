import type { ShikiConfig } from "astro";

type ShikiTheme = NonNullable<ShikiConfig["theme"]>;

/**
 * A compact Flexoki-dark textmate theme (palette: stephango.com/flexoki) for the
 * code blocks. Astro's default Shiki theme is github-dark — a cool slate that
 * clashes with the warm-paper palette. Code stays ALWAYS dark (see CodeBlock),
 * so this is a warm Flexoki-dark surface with the Flexoki accent hues mapped onto
 * the usual syntax roles. Passed to markdown.shikiConfig.theme in src/index.ts.
 *
 * Surface base-950 #1c1b1a / ink base-200 #cecdc3; hues are the dark 400s.
 */
export const flexokiDark: ShikiTheme = {
  name: "flexoki-dark",
  type: "dark",
  bg: "#1c1b1a",
  fg: "#cecdc3",
  colors: {
    "editor.background": "#1c1b1a",
    "editor.foreground": "#cecdc3",
  },
  settings: [
    { settings: { background: "#1c1b1a", foreground: "#cecdc3" } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#878580", fontStyle: "italic" },
    },
    {
      scope: ["string", "string.quoted", "string.template", "markup.inline.raw", "markup.raw"],
      settings: { foreground: "#879a39" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.language.boolean", "constant.other"],
      settings: { foreground: "#8b7ec8" },
    },
    {
      scope: ["keyword", "keyword.control", "storage", "storage.type", "storage.modifier", "keyword.other"],
      settings: { foreground: "#d14d41" },
    },
    {
      scope: ["keyword.operator", "punctuation.accessor"],
      settings: { foreground: "#ce5d97" },
    },
    {
      // `.generic` is the called NAME; the broad `meta.function-call` also wraps
      // the arguments, which tinted plain variables (e.g. theta1) orange.
      scope: ["entity.name.function", "support.function", "meta.function-call.generic", "variable.function"],
      settings: { foreground: "#da702c" },
    },
    {
      scope: ["entity.name.type", "support.type", "entity.name.class", "support.class", "entity.other.inherited-class"],
      settings: { foreground: "#d0a215" },
    },
    {
      scope: ["variable", "variable.other.readwrite", "meta.definition.variable"],
      settings: { foreground: "#cecdc3" },
    },
    {
      scope: [
        "variable.parameter",
        "variable.other.object.property",
        "support.variable.property",
        "meta.object-literal.key",
        "support.type.property-name",
        "entity.name.tag.yaml",
      ],
      settings: { foreground: "#4385be" },
    },
    {
      scope: ["entity.name.tag", "punctuation.definition.tag"],
      settings: { foreground: "#d14d41" },
    },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#d0a215" } },
    {
      scope: ["punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator", "punctuation.definition"],
      settings: { foreground: "#9f9d96" },
    },
    {
      scope: ["constant.character.escape", "constant.other.placeholder", "string.regexp"],
      settings: { foreground: "#3aa99f" },
    },
    { scope: ["markup.heading", "markup.heading entity.name"], settings: { foreground: "#da702c", fontStyle: "bold" } },
    { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
    { scope: ["markup.inserted"], settings: { foreground: "#879a39" } },
    { scope: ["markup.deleted"], settings: { foreground: "#d14d41" } },
  ],
};
