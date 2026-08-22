/**
 * Build-time normaliser behind `<Video id="…">`.
 *
 * Authors paste whatever the YouTube share sheet gave them — a watch URL, a
 * youtu.be short link, an embed URL, any of them carrying a `?t=` timestamp and
 * a playlist tail. Taking only a bare id would push that cleanup onto every
 * author; taking the URL verbatim would mean shipping a `<Video>` whose iframe
 * src is whatever they pasted. So the framework parses it here, keeps the id
 * and the start offset, and throws on anything it cannot read — the same stance
 * as `<Figure>`'s missing-file guard, because a video link that resolves to
 * nothing ships a green build with a permanently dead widget.
 *
 * Deliberately no `start` prop on the component: the share sheet's "Copy link
 * at current time" already encodes the offset, and two ways to say the same
 * thing is one way to say it wrong.
 */

/** YouTube ids are 11 URL-safe base64 characters. */
const ID_RE = /^[\w-]{11}$/;

const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

/** `95`, `95s` and `1h2m3s` are all forms YouTube itself hands out. */
function seconds(raw: string | null): number | undefined {
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw) || undefined;
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
  if (!m || !m.slice(1).some(Boolean)) return undefined;
  const [h, min, s] = m.slice(1).map((v) => Number(v ?? 0));
  return h * 3600 + min * 60 + s || undefined;
}

export function parseYouTube(input: string): { id: string; start?: number } {
  const raw = input.trim();
  const fail = () => {
    throw new Error(
      `study-companion: <Video id="${input}"> — could not read a YouTube ` +
        `video id. Pass an 11-character video id or a youtube.com / ` +
        `youtu.be link.`,
    );
  };

  if (ID_RE.test(raw)) return { id: raw };

  let url: URL;
  try {
    // A pasted link may arrive without a scheme ("youtu.be/…"), which `new URL`
    // would read as a relative reference and reject.
    url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return fail();
  }
  if (!HOSTS.has(url.hostname)) fail();

  const [first, second] = url.pathname.split("/").filter(Boolean);
  const id = url.hostname.endsWith("youtu.be")
    ? first
    : first === "watch"
      ? (url.searchParams.get("v") ?? "")
      : ["embed", "shorts", "live", "v"].includes(first)
        ? second
        : "";

  if (!ID_RE.test(id ?? "")) fail();

  const start =
    seconds(url.searchParams.get("t")) ??
    seconds(url.searchParams.get("start"));
  return start ? { id, start } : { id };
}
