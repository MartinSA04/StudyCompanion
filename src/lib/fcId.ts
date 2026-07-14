/**
 * Stable content id for a flashcard, computed at build time from the card's
 * RAW front text (pre-KaTeX, so a renderer upgrade can't shift ids).
 * <Flashcards> persists ratings keyed by this id instead of the card's
 * position, so editing a deck — inserting, removing or reordering cards —
 * leaves every rating attached to the card it was given for. Positional keys,
 * the legacy scheme, silently misattach all ratings after any edit.
 */

/**
 * FNV-1a over UTF-16 code units, folded to base36 (≤7 chars). Not
 * cryptographic — just cheap, dependency-free and stable across platforms.
 * A collision only makes two identical-front cards share a rating, which is
 * the right behaviour anyway.
 */
export function fcId(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0: fold the signed imul result into an unsigned 32-bit value so the
  // base36 form never carries a "-".
  return (h >>> 0).toString(36);
}
