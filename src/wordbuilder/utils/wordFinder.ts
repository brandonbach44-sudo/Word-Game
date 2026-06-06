import { VALID_WORDS } from '../../shared/words';
import { calculateWordScore } from './scoring';

export interface PossibleWord {
  word: string;
  score: number;
  found: boolean;
}

/**
 * Check if a word can be formed from the available letters
 */
const canFormWord = (word: string, availableLetters: string[]): boolean => {
  const letterPool = [...availableLetters.map(l => l.toLowerCase())];
  
  for (const char of word.toLowerCase()) {
    const index = letterPool.indexOf(char);
    if (index === -1) {
      return false;
    }
    letterPool.splice(index, 1);
  }
  
  return true;
};

/**
 * Find all valid words that can be formed from the given letters
 * Returns them sorted by score (highest first)
 */
export const findAllPossibleWords = (
  letters: string[],
  foundWords: string[] = []
): PossibleWord[] => {
  const possibleWords: PossibleWord[] = [];
  const foundWordsLower = foundWords.map(w => w.toLowerCase());
  
  // Check each word in the dictionary
  VALID_WORDS.forEach((word) => {
    // Only check words that are at least 2 letters and at most the number of available letters
    if (word.length >= 2 && word.length <= letters.length) {
      if (canFormWord(word, letters)) {
        possibleWords.push({
          word: word.toUpperCase(),
          score: calculateWordScore(word),
          found: foundWordsLower.includes(word.toLowerCase()),
        });
      }
    }
  });
  
  // Sort by score (highest first), then alphabetically for ties
  possibleWords.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.word.localeCompare(b.word);
  });
  
  return possibleWords;
};

/**
 * Get stats about possible words
 */
export const getPossibleWordsStats = (possibleWords: PossibleWord[]) => {
  const totalPossible = possibleWords.length;
  const totalFound = possibleWords.filter(w => w.found).length;
  const totalMissed = totalPossible - totalFound;
  const maxPossibleScore = possibleWords.reduce((sum, w) => sum + w.score, 0);
  const foundScore = possibleWords.filter(w => w.found).reduce((sum, w) => sum + w.score, 0);
  
  return {
    totalPossible,
    totalFound,
    totalMissed,
    maxPossibleScore,
    foundScore,
    percentFound: totalPossible > 0 ? Math.round((totalFound / totalPossible) * 100) : 0,
  };
};
