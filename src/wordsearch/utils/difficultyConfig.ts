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
  timeLimit: number;  // seconds
  hints: number;      // hints available per game (0 = none)
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    description: '10×10 · 8 words · Diagonals · No backwards · 3:00',
    rows: 10,
    cols: 10,
    wordsPerPuzzle: 8,
    allowBackwards: false,
    allowDiagonal: true,
    maxWordLength: 8,
    multiplier: 1,
    timeLimit: 180,
    hints: 3,
  },
  challenge: {
    label: 'Challenge',
    description: '12×12 · 10 words · All directions · 4:00',
    rows: 12,
    cols: 12,
    wordsPerPuzzle: 10,
    allowBackwards: true,
    allowDiagonal: true,
    maxWordLength: 10,
    multiplier: 2,
    timeLimit: 240,
    hints: 0,
  },
  extreme: {
    label: 'Extreme',
    description: '15×15 · 14 words · All 8 directions · 6:00',
    rows: 15,
    cols: 15,
    wordsPerPuzzle: 14,
    allowBackwards: true,
    allowDiagonal: true,
    maxWordLength: 12,
    multiplier: 3,
    timeLimit: 360,
    hints: 0,
  },
};
