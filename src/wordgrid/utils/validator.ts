// src/wordgrid/utils/validator.ts
import { VALID_WORDS } from '../../shared/words';

export function isValidWord(word: string): boolean {
  return word.length >= 3 && word.length <= 8 && VALID_WORDS.has(word.toLowerCase());
}
