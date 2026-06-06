// Lightweight playability check for generated letter sets.
// Scans the dictionary for words formable from the given letters
// and returns true once MIN_WORDS unique words are found.
// Using VALID_WORDS (a Set) directly rather than findAllPossibleWords
// so we avoid sorting overhead during generation retries.

import { VALID_WORDS } from '../../shared/words';

const MIN_WORDS = 8; // minimum number of valid words required to accept a letter set

/**
 * Returns true if the letter set can form at least MIN_WORDS valid words.
 * Bails out early once the threshold is met for speed.
 */
export function isPlayable(letters: string[]): boolean {
  const pool = letters.map(l => l.toLowerCase());
  let count = 0;

  for (const word of VALID_WORDS) {
    if (word.length < 3 || word.length > letters.length) continue;

    // Check if word is formable from pool
    const remaining = [...pool];
    let formable = true;
    for (const ch of word) {
      const idx = remaining.indexOf(ch);
      if (idx === -1) { formable = false; break; }
      remaining.splice(idx, 1);
    }

    if (formable) {
      count++;
      if (count >= MIN_WORDS) return true;
    }
  }

  return false;
}
