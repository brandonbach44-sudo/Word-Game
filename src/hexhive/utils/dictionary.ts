// src/hexhive/utils/dictionary.ts
// Combined word list for Hex Hive: the shared 3-8 letter dictionary plus the
// supplementary 9-15 letter list (needed since pangrams and other long words
// are common in this game mode).
import { VALID_WORDS } from '../../shared/words';
import { LONG_VALID_WORDS } from '../../shared/words_long';

export const HEXHIVE_WORDS: Set<string> = new Set([
  ...VALID_WORDS,
  ...LONG_VALID_WORDS,
]);
