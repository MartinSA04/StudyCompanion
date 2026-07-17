import { test } from "node:test";
import assert from "node:assert/strict";
import { saltedLoader } from "../src/lib/saltedLoader.ts";
import type { Loader, LoaderContext } from "astro/loaders";

/** Minimal fake context: a deterministic digest fn plus a passthrough field. */
function fakeCtx() {
  return {
    generateDigest: (data: unknown) => JSON.stringify(data),
    store: { marker: true },
  } as unknown as LoaderContext;
}

test("salts the digest so the same bytes hash differently per salt", async () => {
  let seen: LoaderContext | undefined;
  const inner: Loader = {
    name: "fake",
    load: async (ctx) => {
      seen = ctx;
    },
  };
  const ctx = fakeCtx();
  await saltedLoader(inner, "v1").load(ctx);
  const v1 = seen!.generateDigest("same-bytes");
  await saltedLoader(inner, "v2").load(ctx);
  const v2 = seen!.generateDigest("same-bytes");

  assert.notEqual(v1, v2);
  // The salted digest is the original digest fn over {salt, data} — stable
  // for a stable salt, so unchanged schema + unchanged bytes still cache-hit.
  assert.equal(v1, ctx.generateDigest({ salt: "v1", data: "same-bytes" }));
  assert.equal(v1, ctx.generateDigest({ salt: "v1", data: "same-bytes" }));
});

test("passes the rest of the context and loader shape through", async () => {
  let seen: LoaderContext | undefined;
  const inner: Loader = {
    name: "fake",
    load: async (ctx) => {
      seen = ctx;
    },
  };
  const wrapped = saltedLoader(inner, "s");
  assert.equal(wrapped.name, "fake");
  const ctx = fakeCtx();
  await wrapped.load(ctx);
  assert.equal((seen as unknown as { store: unknown }).store, ctx.store);
});
