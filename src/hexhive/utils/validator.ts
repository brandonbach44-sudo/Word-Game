// src/hexhive/utils/validator.ts
import type { HexHivePuzzle } from '../data/puzzles';
import { HEXHIVE_WORDS } from './dictionary';

export type GuessResult =
  | { status: 'valid'; isPangram: boolean }
  | { status: 'already_found' }
  | { status: 'too_short' }
  | { status: 'missing_center' }
  | { status: 'invalid_letters' }
  | { status: 'not_a_word' };

export function isPangram(word: string, puzzle: HexHivePuzzle): boolean {
  const w = word.toLowerCase();
  return puzzle.letters.every((l) => w.includes(l));
}

export function checkGuess(
  rawWord: string,
  puzzle: HexHivePuzzle,
  alreadyFound: Set<string>
): GuessResult {
  const word = rawWord.trim().toLowerCase();
  const letterSet = new Set(puzzle.letters);

  if (word.length < 4) return { status: 'too_short' };
  if (!word.includes(puzzle.center)) return { status: 'missing_center' };
  for (const ch of word) {
    if (!letterSet.has(ch)) return { status: 'invalid_letters' };
  }
  if (alreadyFound.has(word)) return { status: 'already_found' };
  if (!HEXHIVE_WORDS.has(word)) return { status: 'not_a_word' };

  return { status: 'valid', isPangram: isPangram(word, puzzle) };
}
