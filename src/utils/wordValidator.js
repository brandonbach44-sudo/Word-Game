// src/utils/wordValidator.js
import { VALID_WORDS } from "../../data/words";
const WORD_SET = VALID_WORDS;
export const isValidWord = (word) => {
  if (!word) return false;
  return WORD_SET.has(word.toLowerCase());
};
