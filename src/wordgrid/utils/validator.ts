// src/wordgrid/utils/validator.ts
import wordList from '../data/wordlist';

const dictionary = new Set(wordList.map(w => w.toLowerCase()));

export function isValidWord(word: string): boolean {
  return word.length >= 3 && word.length <= 8 && dictionary.has(word.toLowerCase());
}
