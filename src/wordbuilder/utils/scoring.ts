// Word scoring system for Word Builder

// Base points per letter
const LETTER_VALUES: Record<string, number> = {
  A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
};

// Length bonus multipliers
const LENGTH_MULTIPLIERS: Record<number, number> = {
  2: 1,
  3: 1,
  4: 1.5,
  5: 2,
  6: 3,
  7: 4,
  8: 5,
};

/**
 * Calculate the score for a word (without all-letters bonus)
 */
export const calculateWordScore = (word: string): number => {
  const upperWord = word.toUpperCase();
  
  // Sum up letter values
  let baseScore = 0;
  for (const letter of upperWord) {
    baseScore += LETTER_VALUES[letter] || 0;
  }
  
  // Apply length multiplier
  const multiplier = LENGTH_MULTIPLIERS[word.length] || (word.length > 8 ? 6 : 1);
  
  return Math.round(baseScore * multiplier);
};

/**
 * Calculate the score for a word with potential all-letters bonus
 * Returns the score and whether the bonus was applied
 */
export const calculateWordScoreWithBonus = (
  word: string, 
  totalLetters: number
): { score: number; bonusApplied: boolean } => {
  const baseScore = calculateWordScore(word);
  
  // Check if word uses all available letters
  if (word.length === totalLetters) {
    return {
      score: baseScore * 2, // 2x bonus!
      bonusApplied: true,
    };
  }
  
  return {
    score: baseScore,
    bonusApplied: false,
  };
};

/**
 * Get the letter value for display purposes
 */
export const getLetterValue = (letter: string): number => {
  return LETTER_VALUES[letter.toUpperCase()] || 0;
};
