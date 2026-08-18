// src/wordsearch/utils/generator.ts

import { PROFANITY_BLOCKLIST } from '../../shared/profanityBlocklist';
import type { WordSearchTheme } from '../data/themes';

export type Direction = 'RIGHT' | 'LEFT' | 'DOWN' | 'UP' | 'DOWNRIGHT' | 'DOWNLEFT' | 'UPRIGHT' | 'UPLEFT';

export interface PlacedWord {
  word: string;
  row: number;
  col: number;
  direction: Direction;
  length: number;
}

export interface WordSearchPuzzle {
  grid: string[][];
  words: PlacedWord[];
  themeId: string;
}

export const DIRECTION_VECTORS: Record<Direction, { dr: number; dc: number }> = {
  RIGHT: { dr: 0, dc: 1 },
  LEFT: { dr: 0, dc: -1 },
  DOWN: { dr: 1, dc: 0 },
  UP: { dr: -1, dc: 0 },
  DOWNRIGHT: { dr: 1, dc: 1 },
  DOWNLEFT: { dr: 1, dc: -1 },
  UPRIGHT: { dr: -1, dc: 1 },
  UPLEFT: { dr: -1, dc: -1 },
};

export interface GenerateOptions {
  rows?: number;
  cols?: number;
  wordsPerPuzzle?: number;
  allowBackwards?: boolean;
  allowDiagonal?: boolean;
  maxWordLength?: number;
}

export function generatePuzzle(
  theme: WordSearchTheme,
  options: GenerateOptions = {}
): WordSearchPuzzle {
  const rows = options.rows ?? 12;
  const cols = options.cols ?? 12;
  const wordsPerPuzzle = options.wordsPerPuzzle ?? 12;
  const allowBackwards = options.allowBackwards ?? true;
  const allowDiagonal = options.allowDiagonal ?? true;
  const maxWordLength = options.maxWordLength ?? Math.max(rows, cols);

  const cleanedWords = Array.from(new Set(
    theme.words
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length >= 3 && w.length <= maxWordLength)
      // Never hide a profane word in a grid — system-chosen answer.
      .filter(w => !PROFANITY_BLOCKLIST.has(w.toLowerCase()))
  ));

  const candidateWords =
    cleanedWords.length > 0 ? cleanedWords : ['WORD', 'GAME', 'PUZZLE', 'SEARCH'];

  const selected = shuffleArray(candidateWords.slice()).slice(
    0,
    Math.min(wordsPerPuzzle, candidateWords.length)
  );

  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => '')
  );

  const placedWords: PlacedWord[] = [];
  const directions: Direction[] = getAllowedDirections(allowBackwards, allowDiagonal);
  const diagonalDirections: Direction[] = ['DOWNRIGHT', 'DOWNLEFT', 'UPRIGHT', 'UPLEFT'];

  selected.forEach((word, i) => {
    // A small slice of words try diagonal placement first (falling back to
    // any allowed direction if the grid won't cooperate) so a puzzle isn't
    // left to pure chance for whether any diagonal words show up at all —
    // with fully random direction picks, a meaningful fraction of puzzles
    // ended up with zero diagonal words purely by luck. This preferential
    // pass almost always succeeds once tried, so it's kept to 1-in-6 words;
    // combined with the reweighted base pool above, diagonals land around a
    // third of placed words overall instead of the ~65% they were before.
    const preferDiagonal = allowDiagonal && i % 6 === 0;
    placeWordInGrid(word, grid, directions, placedWords, preferDiagonal ? diagonalDirections : undefined);
  });

  fillEmptyCells(grid);

  return {
    grid,
    words: placedWords,
    themeId: theme.id,
  };
}

export function generatePuzzleWithSeed(
  theme: WordSearchTheme,
  seed: number,
  options: GenerateOptions = {}
): WordSearchPuzzle {
  const rows = options.rows ?? 12;
  const cols = options.cols ?? 12;
  const wordsPerPuzzle = options.wordsPerPuzzle ?? 12;
  const allowBackwards = options.allowBackwards ?? true;
  const allowDiagonal = options.allowDiagonal ?? true;
  const maxWordLength = options.maxWordLength ?? Math.max(rows, cols);

  const cleanedWords = Array.from(new Set(
    theme.words
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length >= 3 && w.length <= maxWordLength)
      // Never hide a profane word in a grid — system-chosen answer.
      .filter(w => !PROFANITY_BLOCKLIST.has(w.toLowerCase()))
  ));

  const candidateWords =
    cleanedWords.length > 0 ? cleanedWords : ['WORD', 'GAME', 'PUZZLE', 'SEARCH'];

  const seededRandom = createSeededRandom(seed);
  const selected = shuffleArraySeeded(candidateWords.slice(), seededRandom).slice(
    0,
    Math.min(wordsPerPuzzle, candidateWords.length)
  );

  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => '')
  );

  const placedWords: PlacedWord[] = [];
  const directions: Direction[] = getAllowedDirections(allowBackwards, allowDiagonal);
  const diagonalDirections: Direction[] = ['DOWNRIGHT', 'DOWNLEFT', 'UPRIGHT', 'UPLEFT'];

  selected.forEach((word, i) => {
    // Same reasoning as the non-seeded generator above: bias a small slice
    // of words (1-in-6) toward diagonal placement so the Daily puzzle
    // reliably has some diagonal words most days instead of it being a
    // coin flip, without dominating the puzzle the way 1-in-3 did.
    const preferDiagonal = allowDiagonal && i % 6 === 0;
    placeWordInGridSeeded(word, grid, directions, placedWords, seededRandom, preferDiagonal ? diagonalDirections : undefined);
  });

  fillEmptyCellsSeeded(grid, seededRandom);

  return {
    grid,
    words: placedWords,
    themeId: theme.id,
  };
}

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function getAllowedDirections(allowBackwards: boolean, allowDiagonal: boolean): Direction[] {
  const dirs: Direction[] = [];
  // Cardinal directions are listed 3x so they're weighted more heavily than
  // diagonals in this pool. With every direction listed once, diagonals made
  // up 4 of 8 (or 4 of 6) entries — a 50%+ base rate before any of the extra
  // diagonal-preference logic even kicks in, which is what made diagonals
  // show up so often. Weighting cardinals 3:1 against diagonals brings that
  // base rate down to roughly a quarter.
  dirs.push('RIGHT', 'RIGHT', 'RIGHT', 'DOWN', 'DOWN', 'DOWN');

  if (allowDiagonal) {
    // All 4 diagonal directions are available whenever diagonals are on,
    // regardless of allowBackwards (diagonals aren't purely "backwards").
    dirs.push('DOWNRIGHT', 'DOWNLEFT', 'UPRIGHT', 'UPLEFT');
  }

  if (allowBackwards) {
    dirs.push('LEFT', 'LEFT', 'LEFT', 'UP', 'UP', 'UP');
  }

  return dirs;
}

// Looks for a spot where this word can cross through a letter that's
// already on the grid from a previously placed word (i.e. the new word and
// an old word share a cell, like a real word search / crossword). Without
// this, words only ever overlap by pure chance of a random start position
// happening to line up with an existing letter, which is rare enough that
// it can go entire puzzles without ever happening. Returns null if no
// intersection is possible, in which case callers fall back to random
// placement as before.
function findIntersectionPlacement(
  word: string,
  grid: string[][],
  dirsToTry: Direction[],
  randomFn: () => number
): { row: number; col: number; dr: number; dc: number; direction: Direction } | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const candidates: { row: number; col: number; dr: number; dc: number; direction: Direction }[] = [];

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== letter) continue;
        for (const direction of dirsToTry) {
          const { dr, dc } = DIRECTION_VECTORS[direction];
          const startRow = r - dr * i;
          const startCol = c - dc * i;
          if (canPlaceWord(word, grid, startRow, startCol, dr, dc)) {
            candidates.push({ row: startRow, col: startCol, dr, dc, direction });
          }
        }
      }
    }
  }

  if (candidates.length === 0) return null;
  const idx = Math.floor(randomFn() * candidates.length);
  return candidates[idx];
}

function placeWordInGrid(
  word: string,
  grid: string[][],
  directions: Direction[],
  placedWords: PlacedWord[],
  preferredDirections?: Direction[]
): void {
  const rows = grid.length;
  const cols = grid[0].length;

  // Try to cross through an already-placed word first, before falling back
  // to the preferred/random placement attempts below.
  const intersectionDirs = preferredDirections && preferredDirections.length > 0 ? preferredDirections : directions;
  const intersection = findIntersectionPlacement(word, grid, intersectionDirs, Math.random);
  if (intersection) {
    actuallyPlaceWord(word, grid, intersection.row, intersection.col, intersection.dr, intersection.dc);
    placedWords.push({
      word,
      row: intersection.row,
      col: intersection.col,
      direction: intersection.direction,
      length: word.length,
    });
    return;
  }

  // If this word is biased toward a preferred subset (e.g. diagonals), spend
  // the first half of the attempt budget trying only those directions
  // before falling back to the full set — guarantees a real, repeated shot
  // at the preferred directions rather than a 1-in-N chance per attempt.
  if (preferredDirections && preferredDirections.length > 0) {
    const shuffledPreferred = shuffleArray(preferredDirections.slice());
    for (let attempt = 0; attempt < 100; attempt++) {
      const direction = shuffledPreferred[attempt % shuffledPreferred.length];
      const vec = DIRECTION_VECTORS[direction];
      const startRow = randomInt(0, rows - 1);
      const startCol = randomInt(0, cols - 1);
      if (canPlaceWord(word, grid, startRow, startCol, vec.dr, vec.dc)) {
        actuallyPlaceWord(word, grid, startRow, startCol, vec.dr, vec.dc);
        placedWords.push({ word, row: startRow, col: startCol, direction, length: word.length });
        return;
      }
    }
  }

  const shuffledDirections = shuffleArray(directions.slice());

  for (let attempt = 0; attempt < 200; attempt++) {
    const direction = shuffledDirections[attempt % shuffledDirections.length];
    const vec = DIRECTION_VECTORS[direction];
    const startRow = randomInt(0, rows - 1);
    const startCol = randomInt(0, cols - 1);

    if (canPlaceWord(word, grid, startRow, startCol, vec.dr, vec.dc)) {
      actuallyPlaceWord(word, grid, startRow, startCol, vec.dr, vec.dc);
      placedWords.push({
        word,
        row: startRow,
        col: startCol,
        direction,
        length: word.length,
      });
      return;
    }
  }
}

function placeWordInGridSeeded(
  word: string,
  grid: string[][],
  directions: Direction[],
  placedWords: PlacedWord[],
  random: () => number,
  preferredDirections?: Direction[]
): void {
  const rows = grid.length;
  const cols = grid[0].length;

  // Same reasoning as placeWordInGrid — cross through an already-placed
  // word first before falling back to preferred/random placement.
  const intersectionDirs = preferredDirections && preferredDirections.length > 0 ? preferredDirections : directions;
  const intersection = findIntersectionPlacement(word, grid, intersectionDirs, random);
  if (intersection) {
    actuallyPlaceWord(word, grid, intersection.row, intersection.col, intersection.dr, intersection.dc);
    placedWords.push({
      word,
      row: intersection.row,
      col: intersection.col,
      direction: intersection.direction,
      length: word.length,
    });
    return;
  }

  // Same reasoning as placeWordInGrid — give preferred (diagonal) directions
  // a dedicated first pass before falling back to the full direction set.
  if (preferredDirections && preferredDirections.length > 0) {
    const shuffledPreferred = shuffleArraySeeded(preferredDirections.slice(), random);
    for (let attempt = 0; attempt < 100; attempt++) {
      const direction = shuffledPreferred[attempt % shuffledPreferred.length];
      const vec = DIRECTION_VECTORS[direction];
      const startRow = Math.floor(random() * rows);
      const startCol = Math.floor(random() * cols);
      if (canPlaceWord(word, grid, startRow, startCol, vec.dr, vec.dc)) {
        actuallyPlaceWord(word, grid, startRow, startCol, vec.dr, vec.dc);
        placedWords.push({ word, row: startRow, col: startCol, direction, length: word.length });
        return;
      }
    }
  }

  const shuffledDirections = shuffleArraySeeded(directions.slice(), random);

  for (let attempt = 0; attempt < 200; attempt++) {
    const direction = shuffledDirections[attempt % shuffledDirections.length];
    const vec = DIRECTION_VECTORS[direction];
    const startRow = Math.floor(random() * rows);
    const startCol = Math.floor(random() * cols);

    if (canPlaceWord(word, grid, startRow, startCol, vec.dr, vec.dc)) {
      actuallyPlaceWord(word, grid, startRow, startCol, vec.dr, vec.dc);
      placedWords.push({
        word,
        row: startRow,
        col: startCol,
        direction,
        length: word.length,
      });
      return;
    }
  }
}

function canPlaceWord(
  word: string,
  grid: string[][],
  row: number,
  col: number,
  dr: number,
  dc: number
): boolean {
  const rows = grid.length;
  const cols = grid[0].length;

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;

    if (r < 0 || r >= rows || c < 0 || c >= cols) {
      return false;
    }

    const current = grid[r][c];
    if (current !== '' && current !== word[i]) {
      return false;
    }
  }

  return true;
}

function actuallyPlaceWord(
  word: string,
  grid: string[][],
  row: number,
  col: number,
  dr: number,
  dc: number
): void {
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = word[i];
  }
}

function fillEmptyCells(grid: string[][]): void {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === '') {
        const index = randomInt(0, alphabet.length - 1);
        grid[r][c] = alphabet[index];
      }
    }
  }
}

function fillEmptyCellsSeeded(grid: string[][], random: () => number): void {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === '') {
        const index = Math.floor(random() * alphabet.length);
        grid[r][c] = alphabet[index];
      }
    }
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleArraySeeded<T>(arr: T[], random: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
