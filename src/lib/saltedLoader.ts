import type { Loader, LoaderContext } from "astro/loaders";

/**
 * Wrap a loader so its entry digests also change when `salt` does.
 *
 * Astro's content layer digests only the content FILE's bytes, so a framework
 * upgrade (or local schema edit) that changes schema behavior against
 * unchanged course.yaml/mdx bytes keeps serving the stale parse out of
 * node_modules/.astro — new fields come back undefined (a consumer bumping
 * past the field's introduction crashes) and changed ui-string defaults keep
 * their old values silently. content.ts salts every collection with a hash of
 * schema.ts, so any schema change re-parses everything; parses are cheap and
 * this kills the whole stale-cache class.
 */
export function saltedLoader(loader: Loader, salt: string): Loader {
  return {
    ...loader,
    load: (ctx: LoaderContext) =>
      loader.load({
        ...ctx,
        generateDigest: (data) => ctx.generateDigest({ salt, data }),
      }),
  };
}
