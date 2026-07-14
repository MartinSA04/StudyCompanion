/**
 * Build-time guard for enum-ish component props. MDX authoring isn't
 * type-checked, so a misspelled `type`/`kind`/`tone` reaches the component as
 * an arbitrary string — and a lookup table then either crashes the build with
 * an opaque "Cannot read properties of undefined" or ships a blank badge with
 * `aria-label={undefined}`. Throwing here names the component, the prop and
 * the allowed values instead.
 */
export function assertOneOf(
  value: string,
  allowed: readonly string[],
  component: string,
  prop: string,
): void {
  if (!allowed.includes(value)) {
    throw new Error(
      `study-companion: <${component} ${prop}="${value}"> — ${prop} must be ` +
        `one of ${allowed.map((v) => `"${v}"`).join(", ")}.`,
    );
  }
}
