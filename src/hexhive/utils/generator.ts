// src/hexhive/utils/generator.ts
// Picks the daily letter-set (deterministic, same for every player on a given
// date — mirrors how Wordle indexes into a fixed word list by day number)
// and computes the full solution set for a puzzle.

import { PUZZLES, type HexHivePuzzle } from '../data/puzzles';
import { HEXHIVE_WORDS } from './dictionary';
import { scoreWordForPuzzle } from './scoring';

export function dateToSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** Deterministic daily puzzle: same letters for every player on the same date. */
export function getDailyPuzzle(date: Date = new Date()): HexHivePuzzle {
  const seed = dateToSeed(date);
  const index = seed % PUZZLES.length;
  return PUZZLES[index];
}

/** Random puzzle for untimed practice play (not tied to date or streaks). */
export function getRandomPuzzle(excludeIndex?: number): HexHivePuzzle {
  let index = Math.floor(Math.random() * PUZZLES.length);
  if (excludeIndex !== undefined && PUZZLES.length > 1) {
    while (index === excludeIndex) {
      index = Math.floor(Math.random() * PUZZLES.length);
    }
  }
  return PUZZLES[index];
}

export function shuffleLetters(letters: string[]): string[] {
  const arr = [...letters];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface PuzzleSolution {
  words: string[]; // all valid words, sorted
  pangrams: string[];
  maxScore: number;
  wordsByFirstLetter: Record<string, number[]>; // letter -> counts per length, for the hint grid
}

const solutionCache = new Map<string, PuzzleSolution>();

function puzzleKey(puzzle: HexHivePuzzle): string {
  return `${puzzle.letters.join('')}-${puzzle.center}`;
}

/**
 * Computes every valid word for a puzzle by scanning the combined dictionary
 * once. Cached per letter-set so repeated screen visits don't rescan.
 */
export function getPuzzleSolution(puzzle: HexHivePuzzle): PuzzleSolution {
  const key = puzzleKey(puzzle);
  const cached = solutionCache.get(key);
  if (cached) return cached;

  const letterSet = new Set(puzzle.letters);
  const words: string[] = [];
  const pangrams: string[] = [];
  let maxScore = 0;
  const wordsByFirstLetter: Record<string, number[]> = {};

  for (const word of HEXHIVE_WORDS) {
    if (word.length < 4) continue;
    if (!word.includes(puzzle.center)) continue;

    let inSet = true;
    for (const ch of word) {
      if (!letterSet.has(ch)) {
        inSet = false;
        break;
      }
    }
    if (!inSet) continue;

    words.push(word);
    const isPangram = puzzle.letters.every((l) => word.includes(l));
    if (isPangram) pangrams.push(word);
    maxScore += scoreWordForPuzzle(word, isPangram);

    const first = word[0];
    if (!wordsByFirstLetter[first]) wordsByFirstLetter[first] = [];
    wordsByFirstLetter[first][word.length] = (wordsByFirstLetter[first][word.length] || 0) + 1;
  }

  words.sort();
  pangrams.sort();

  const solution: PuzzleSolution = { words, pangrams, maxScore, wordsByFirstLetter };
  solutionCache.set(key, solution);
  return solution;
}
