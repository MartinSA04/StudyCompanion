import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYouTube } from "../src/lib/youtube.ts";

/**
 * `parseYouTube` is the build-time guard behind `<Video id="…">`. Authors paste
 * whatever the YouTube share sheet handed them — a watch URL, a youtu.be short
 * link, one of those with a `?t=` timestamp — so the component takes all of it
 * and normalises to `{ id, start }`. A link the parser cannot read fails the
 * build, because the alternative is a widget that ships green and plays nothing.
 */
const ID = "WUvTyaaNkzM";

test("parseYouTube: a bare video id passes through", () => {
  assert.deepEqual(parseYouTube(ID), { id: ID });
});

test("parseYouTube: reads the id from a standard watch URL", () => {
  assert.deepEqual(parseYouTube(`https://www.youtube.com/watch?v=${ID}`), {
    id: ID,
  });
});

test("parseYouTube: reads the id from a youtu.be short link", () => {
  assert.deepEqual(parseYouTube(`https://youtu.be/${ID}`), { id: ID });
});

test("parseYouTube: reads the id from an embed URL", () => {
  assert.deepEqual(
    parseYouTube(`https://www.youtube-nocookie.com/embed/${ID}`),
    { id: ID },
  );
});

test("parseYouTube: reads the id from a shorts URL", () => {
  assert.deepEqual(parseYouTube(`https://www.youtube.com/shorts/${ID}`), {
    id: ID,
  });
});

test("parseYouTube: accepts a URL with no scheme", () => {
  assert.deepEqual(parseYouTube(`youtu.be/${ID}`), { id: ID });
});

test("parseYouTube: trims surrounding whitespace", () => {
  assert.deepEqual(parseYouTube(`  ${ID}  `), { id: ID });
});

test("parseYouTube: drops playlist and tracking params", () => {
  assert.deepEqual(
    parseYouTube(`https://www.youtube.com/watch?v=${ID}&list=PL9&index=2&si=x`),
    { id: ID },
  );
});

test("parseYouTube: reads a plain-seconds ?t= timestamp as start", () => {
  assert.deepEqual(parseYouTube(`https://www.youtube.com/watch?v=${ID}&t=95`), {
    id: ID,
    start: 95,
  });
});

test("parseYouTube: reads a trailing-s ?t= timestamp from a youtu.be link", () => {
  assert.deepEqual(parseYouTube(`https://youtu.be/${ID}?t=95s`), {
    id: ID,
    start: 95,
  });
});

test("parseYouTube: reads an h/m/s ?t= timestamp as total seconds", () => {
  assert.deepEqual(parseYouTube(`https://youtu.be/${ID}?t=1h2m3s`), {
    id: ID,
    start: 3723,
  });
});

test("parseYouTube: reads the embed URL's ?start= timestamp", () => {
  assert.deepEqual(
    parseYouTube(`https://www.youtube.com/embed/${ID}?start=95`),
    {
      id: ID,
      start: 95,
    },
  );
});

test("parseYouTube: ignores a zero timestamp rather than reporting start: 0", () => {
  assert.deepEqual(parseYouTube(`https://www.youtube.com/watch?v=${ID}&t=0`), {
    id: ID,
  });
});

test("parseYouTube: a non-YouTube URL throws, naming the widget and the input", () => {
  assert.throws(
    () => parseYouTube("https://vimeo.com/123456789"),
    (err: Error) => {
      assert.ok(err instanceof Error);
      assert.equal(
        err.message,
        'study-companion: <Video id="https://vimeo.com/123456789"> — could ' +
          "not read a YouTube video id. Pass an 11-character video id or a " +
          "youtube.com / youtu.be link.",
      );
      return true;
    },
  );
});

test("parseYouTube: a watch URL with no v param throws", () => {
  assert.throws(
    () => parseYouTube("https://www.youtube.com/watch?list=PL9"),
    /could not read a YouTube video id/,
  );
});

test("parseYouTube: an id of the wrong length throws", () => {
  assert.throws(() => parseYouTube("abc123"), /could not read a YouTube/);
});

test("parseYouTube: an empty string throws", () => {
  assert.throws(() => parseYouTube("   "), /could not read a YouTube/);
});
