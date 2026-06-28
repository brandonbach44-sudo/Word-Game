// src/wordsearch/utils/generator.ts

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

const DIRECTION_VECTORS: Record<Direction, { dr: number; dc: number }> = {
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

  const cleanedWords = theme.words
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length >= 3 && w.length <= maxWordLength);

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

  for (const word of selected) {
    placeWordInGrid(word, grid, directions, placedWords);
  }

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

  const cleanedWords = theme.words
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length >= 3 && w.length <= maxWordLength);

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

  for (const word of selected) {
    placeWordInGridSeeded(word, grid, directions, placedWords, seededRandom);
  }

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
  dirs.push('RIGHT', 'DOWN');

  if (allowDiagonal) {
    // All 4 diagonal directions are available whenever diagonals are on,
    // regardless of allowBackwards (diagonals aren't purely "backwards").
    dirs.push('DOWNRIGHT', 'DOWNLEFT', 'UPRIGHT', 'UPLEFT');
  }

  if (allowBackwards) {
    dirs.push('LEFT', 'UP');
  }

  return dirs;
}

function placeWordInGrid(
  word: string,
  grid: string[][],
  directions: Direction[],
  placedWords: PlacedWord[]
): void {
  const rows = grid.length;
  const cols = grid[0].length;
  const maxAttempts = 200;
  const shuffledDirections = shuffleArray(directions.slice());

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
  random: () => number
): void {
  const rows = grid.length;
  const cols = grid[0].length;
  const maxAttempts = 200;
  const shuffledDirections = shuffleArraySeeded(directions.slice(), random);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
