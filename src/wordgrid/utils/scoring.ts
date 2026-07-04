// src/wordgrid/utils/scoring.ts

// Define rare letters for bonus scoring
const RARE_LETTERS = new Set(['Q', 'Z', 'J', 'X']);

// Points awarded for the longest word of the round. This is applied
// retroactively at game end (see GameScreen's gameOver effect) to whichever
// word(s) end up tied for longest, so it can't depend on the order words
// were found in. Keep this in sync with the `isLongestWord` branch below.
export const LONGEST_WORD_BONUS = 10 * 50;

// Base scoring curve by word length
function baseScore(length: number): number {
  if (length <= 4) return 1;
  if (length <= 6) return 2;
  if (length <= 8) return 4;
  if (length <= 12) return 8;
  return 12; // 13–15 letters
}

// Calculate rare letter bonus
function rareLetterBonus(word: string): number {
  let bonus = 0;
  for (const char of word.toUpperCase()) {
    if (RARE_LETTERS.has(char)) {
      bonus += 2; // +2 points per rare letter
    }
  }
  return bonus;
}

// Main scoring function
export function calculateWordScore(
  word: string,
  options?: {
    isStreak?: boolean;      // 3 words in 8 seconds
    isAllTile?: boolean;     // word uses all tiles in grid
    isLongestWord?: boolean; // longest word of round — must be decided once
                             // the round is over (see LONGEST_WORD_BONUS),
                             // never live while words are still being found
  }
): number {
  const length = word.length;
  let score = baseScore(length);

  // Rare letters
  score += rareLetterBonus(word);

  // Streak bonus
  if (options?.isStreak) {
    score += 5;
  }

  // All-tile bonus
  if (options?.isAllTile) {
    score += 20;
  }

  // Longest word bonus
  if (options?.isLongestWord) {
    score += 10;
  }

  // Multiply to scale average scores higher
  return score * 50;
}
