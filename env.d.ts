// Ambient declarations for the framework's own type-check (`pnpm typecheck`).
//
// Raw `tsc` doesn't parse `.astro` single-file components, so importing a widget
// from a `.ts` module (e.g. src/mdx-components.ts) would otherwise be TS2307.
// Declare the module shape so those imports resolve; real `.astro` prop typing
// is enforced by the Astro compiler at build time (and `astro check`).
//
// Kept at the repo root (not src/) so it is part of the typecheck program but is
// NOT published — `package.json#files` ships only `src`.
declare module "*.astro" {
  const Component: (props: Record<string, unknown>) => unknown;
  export default Component;
}
