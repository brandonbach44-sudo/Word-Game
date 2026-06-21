// src/wordsearch/utils/difficultyConfig.ts
// Shared difficulty config used by both the category/difficulty picker and the game screen.

export type Difficulty = 'easy' | 'challenge' | 'extreme';

export interface DifficultyConfig {
  label: string;
  description: string;
  rows: number;
  cols: number;
  wordsPerPuzzle: number;
  allowBackwards: boolean;
  allowDiagonal: boolean;
  maxWordLength: number;
  multiplier: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    description: '10×10 · 8 words · Left & Down only',
    rows: 10,
    cols: 10,
    wordsPerPuzzle: 8,
    allowBackwards: false,
    allowDiagonal: false,
    maxWordLength: 8,
    multiplier: 1,
  },
  challenge: {
    label: 'Challenge',
    description: '12×12 · 10 words · All directions, no diagonals',
    rows: 12,
    cols: 12,
    wordsPerPuzzle: 10,
    allowBackwards: true,
    allowDiagonal: false,
    maxWordLength: 10,
    multiplier: 2,
  },
  extreme: {
    label: 'Extreme',
    description: '15×15 · 14 words · All 8 directions',
    rows: 15,
    cols: 15,
    wordsPerPuzzle: 14,
    allowBackwards: true,
    allowDiagonal: true,
    maxWordLength: 12,
    multiplier: 3,
  },
};
