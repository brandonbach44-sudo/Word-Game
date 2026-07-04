// src/wordladder/utils/generator.ts
// Generates Word Ladder puzzles.
//
// Practice mode: fully random, generated fresh on-device each time.
// Daily mode: seeded by the calendar date so every player gets the exact
// same start/end pair on a given day (no backend required — the dictionary
// and algorithm are identical for everyone, so a date seed is enough).

import { findShortestPath, getNeighbors, getWordsOfLength } from './wordGraph';

export type LadderDifficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  wordLength: number;
  minSteps: number;
  maxSteps: number;
  label: string;
}

export const DIFFICULTY_CONFIG: Record<LadderDifficulty, DifficultyConfig> = {
  easy: { wordLength: 4, minSteps: 2, maxSteps: 4, label: 'Easy' },
  medium: { wordLength: 5, minSteps: 3, maxSteps: 5, label: 'Medium' },
  hard: { wordLength: 6, minSteps: 4, maxSteps: 7, label: 'Hard' },
};

export const DIFFICULTY_ORDER: LadderDifficulty[] = ['easy', 'medium', 'hard'];

export interface LadderPuzzle {
  start: string;
  end: string;
  par: number; // shortest possible number of steps
  wordLength: number;
  difficulty: LadderDifficulty;
  solutionPath: string[]; // one valid shortest path, used for hints/give-up
}

// Small deterministic PRNG (same technique used by the Word Search generator)
// so the daily puzzle is reproducible from a date seed.
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

// Words with zero neighbors can never appear in a ladder — filter once per length.
const connectedPoolCache = new Map<number, string[]>();
function getConnectedPool(length: number): string[] {
  const cached = connectedPoolCache.get(length);
  if (cached) return cached;
  const pool = getWordsOfLength(length).filter((w) => getNeighbors(w).length > 0);
  connectedPoolCache.set(length, pool);
  return pool;
}

function buildPuzzle(
  config: DifficultyConfig,
  difficulty: LadderDifficulty,
  rand: () => number
): LadderPuzzle {
  const pool = getConnectedPool(config.wordLength);
  const maxAttempts = 400;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const start = pickRandom(pool, rand);
    const end = pickRandom(pool, rand);
    if (start === end) continue;
    const path = findShortestPath(start, end, config.maxSteps + 2);
    if (!path) continue;
    const steps = path.length - 1;
    if (steps >= config.minSteps && steps <= config.maxSteps) {
      return {
        start,
        end,
        par: steps,
        wordLength: config.wordLength,
        difficulty,
        solutionPath: path,
      };
    }
  }

  // Fallback: random-walk from a starting word to guarantee a solvable pair
  // even if random start/end sampling didn't land in the target step range.
  const targetSteps = Math.round((config.minSteps + config.maxSteps) / 2);
  let current = pickRandom(pool, rand);
  const walk = [current];
  for (let i = 0; i < targetSteps; i++) {
    const neighbors = getNeighbors(current).filter((n) => !walk.includes(n));
    if (neighbors.length === 0) break;
    current = pickRandom(neighbors, rand);
    walk.push(current);
  }
  const verifiedPath = findShortestPath(walk[0], current, 12) || walk;
  return {
    start: walk[0],
    end: current,
    par: verifiedPath.length - 1,
    wordLength: config.wordLength,
    difficulty,
    solutionPath: verifiedPath,
  };
}

export function generatePracticeLadder(difficulty: LadderDifficulty): LadderPuzzle {
  return buildPuzzle(DIFFICULTY_CONFIG[difficulty], difficulty, Math.random);
}

export function dateToSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

/** Daily puzzles always use medium (5-letter) difficulty — mirrors Wordle's fixed length. */
export function generateDailyLadder(date: Date = new Date()): LadderPuzzle {
  const seed = dateToSeed(date);
  const rand = createSeededRandom(seed);
  return buildPuzzle(DIFFICULTY_CONFIG.medium, 'medium', rand);
}

/** Re-derives a fresh shortest path from wherever the player currently is to the target. */
export function getHintPath(currentWord: string, target: string): string[] | null {
  return findShortestPath(currentWord, target, 12);
}
