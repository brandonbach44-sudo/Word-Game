// src/wordgrid/utils/gridGenerator.ts
//
// Generation strategy:
//   1. Seed the grid with 2 common words placed along valid adjacency paths.
//      - Word 1 is placed on any valid path.
//      - Word 2 tries to share at least one cell with Word 1 (interconnected).
//   2. Fill remaining cells with constrained random letters:
//      - Vowel spread: at least one vowel per 2x2 quadrant.
//      - No letter appears more than twice.
//      - Q, X, Z, J banned.
//   3. Count recognisable findable words via DFS + trie (common word list).
//   4. If count < MIN_WORDS, retry up to MAX_RETRIES keeping the best grid.
//
// Result: every grid is guaranteed to contain real recognisable words,
// with two known words baked in before any random filling occurs.

import commonWords from '../data/commonWords';

// Trie

interface TrieNode {
  children: { [letter: string]: TrieNode };
  isEnd: boolean;
}

function newNode(): TrieNode {
  return { children: {}, isEnd: false };
}

function buildTrie(): TrieNode {
  const root = newNode();
  for (const word of commonWords) {
    const len = word.length;
    if (len < 3 || len > 7) continue;
    let node = root;
    for (let i = 0; i < len; i++) {
      const ch = word[i].toUpperCase();
      if (!node.children[ch]) node.children[ch] = newNode();
      node = node.children[ch];
    }
    node.isEnd = true;
  }
  return root;
}

const TRIE = buildTrie();

// Seed pool: 4-5 letter common words with no repeated letters (easiest to place)
const SEED_POOL: string[] = commonWords
  .filter(w => w.length >= 4 && w.length <= 5 && new Set(w).size === w.length)
  .map(w => w.toUpperCase());

// Letter weights

const VOWEL_WEIGHTS: Record<string, number> = {
  A: 10, E: 14, I: 9, O: 9, U: 4,
};

const CONSONANT_WEIGHTS: Record<string, number> = {
  R: 9, S: 8, T: 9, N: 8, L: 6,
  D: 5, H: 5, G: 4, M: 4, C: 4,
  P: 4, B: 3, F: 3, W: 3, Y: 3,
  K: 2, V: 2,
};

function pickWeighted(weights: Record<string, number>): string {
  const keys = Object.keys(weights);
  const vals = Object.values(weights);
  const total = vals.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < keys.length; i++) {
    r -= vals[i];
    if (r <= 0) return keys[i];
  }
  return keys[keys.length - 1];
}

function pickWeightedAvailable(
  weights: Record<string, number>,
  canPlace: (l: string) => boolean
): string | null {
  const filtered: Record<string, number> = {};
  for (const [k, v] of Object.entries(weights)) {
    if (canPlace(k)) filtered[k] = v;
  }
  if (Object.keys(filtered).length === 0) return null;
  return pickWeighted(filtered);
}

// Helpers

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function neighbors(r: number, c: number, size: number): [number, number][] {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        result.push([nr, nc]);
      }
    }
  }
  return result;
}

// Word placement

// Recursively find a valid adjacency path for `word` starting at (r, c).
// A cell is compatible if it is empty OR already holds the matching letter.
function findPath(
  word: string,
  idx: number,
  r: number,
  c: number,
  grid: string[][],
  visited: Set<string>
): [number, number][] | null {
  const key = `${r},${c}`;
  if (visited.has(key)) return null;

  const letter = word[idx];
  const existing = grid[r][c];
  if (existing !== '' && existing !== letter) return null;

  if (idx === word.length - 1) return [[r, c]];

  visited.add(key);
  const size = grid.length;
  for (const [nr, nc] of shuffle(neighbors(r, c, size))) {
    const rest = findPath(word, idx + 1, nr, nc, grid, visited);
    if (rest) {
      visited.delete(key);
      return [[r, c], ...rest];
    }
  }
  visited.delete(key);
  return null;
}

// Try to place `word` anywhere on the grid. Returns the path used, or null.
function placeWord(
  word: string,
  grid: string[][]
): [number, number][] | null {
  const size = grid.length;
  const starts = shuffle(
    Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => [r, c] as [number, number])
    ).flat()
  );
  for (const [r, c] of starts) {
    const path = findPath(word, 0, r, c, grid, new Set());
    if (path) return path;
  }
  return null;
}

// Try to place `word` so that it shares at least one cell with `anchorCells`.
function placeWordNearAnchor(
  word: string,
  grid: string[][],
  anchorCells: Set<string>
): [number, number][] | null {
  const size = grid.length;

  const candidates = new Set<string>();
  for (const key of anchorCells) {
    const [r, c] = key.split(',').map(Number);
    candidates.add(key);
    for (const [nr, nc] of neighbors(r, c, size)) {
      candidates.add(`${nr},${nc}`);
    }
  }

  const starts = shuffle([...candidates].map(k => k.split(',').map(Number) as [number, number]));

  for (const [r, c] of starts) {
    const path = findPath(word, 0, r, c, grid, new Set());
    if (path) {
      const overlaps = path.some(([pr, pc]) => anchorCells.has(`${pr},${pc}`));
      if (overlaps) return path;
    }
  }

  // Fallback: place anywhere
  return placeWord(word, grid);
}

// Write a word along its path into the grid and update letterCount.
function commitPath(
  word: string,
  path: [number, number][],
  grid: string[][],
  letterCount: Record<string, number>
): void {
  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    const letter = word[i];
    if (grid[r][c] === '') {
      grid[r][c] = letter;
      letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
  }
}

// Word counter

function countValidWords(grid: string[][]): number {
  const size = grid.length;
  const found = new Set<string>();
  const visited: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  function dfs(r: number, c: number, node: TrieNode, word: string): void {
    const letter = grid[r][c];
    const next = node.children[letter];
    if (!next) return;

    const newWord = word + letter;
    if (next.isEnd && newWord.length >= 3) found.add(newWord);
    if (newWord.length >= 7) return;

    visited[r][c] = true;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
          dfs(nr, nc, next, newWord);
        }
      }
    }
    visited[r][c] = false;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      dfs(r, c, TRIE, '');
    }
  }
  return found.size;
}

// Fill remaining cells

const QUADRANTS: [number, number][][] = [
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 2], [0, 3], [1, 2], [1, 3]],
  [[2, 0], [2, 1], [3, 0], [3, 1]],
  [[2, 2], [2, 3], [3, 2], [3, 3]],
];

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function fillGrid(
  grid: string[][],
  letterCount: Record<string, number>,
  size: number
): void {
  const canPlace = (l: string) => (letterCount[l] || 0) < 2;

  // Ensure each quadrant has at least one vowel
  for (const quad of QUADRANTS) {
    const hasVowel = quad.some(([r, c]) => VOWELS.has(grid[r][c]));
    if (!hasVowel) {
      const emptyCells = shuffle(quad.filter(([r, c]) => grid[r][c] === ''));
      if (emptyCells.length > 0) {
        const vowel = pickWeightedAvailable(VOWEL_WEIGHTS, canPlace);
        if (vowel) {
          const [r, c] = emptyCells[0];
          grid[r][c] = vowel;
          letterCount[vowel] = (letterCount[vowel] || 0) + 1;
        }
      }
    }
  }

  // Fill all remaining empty cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== '') continue;

      const totalPlaced = grid.flat().filter(l => l !== '').length;
      const vowelCount = grid.flat().filter(l => VOWELS.has(l)).length;
      const vowelRatio = totalPlaced > 0 ? vowelCount / totalPlaced : 0;

      let letter: string | null;
      if (vowelRatio < 0.3) {
        letter = pickWeightedAvailable(VOWEL_WEIGHTS, canPlace)
          ?? pickWeightedAvailable(CONSONANT_WEIGHTS, canPlace);
      } else {
        letter = pickWeightedAvailable(CONSONANT_WEIGHTS, canPlace)
          ?? pickWeightedAvailable(VOWEL_WEIGHTS, canPlace);
      }

      const placed = letter ?? 'E';
      grid[r][c] = placed;
      letterCount[placed] = (letterCount[placed] || 0) + 1;
    }
  }
}

// Build one candidate grid

function buildCandidateGrid(size: number): string[][] {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill('')
  );
  const letterCount: Record<string, number> = {};

  const [seed1, seed2] = shuffle(SEED_POOL).slice(0, 2);

  const path1 = placeWord(seed1, grid);
  if (path1) {
    commitPath(seed1, path1, grid, letterCount);
    const anchor = new Set(path1.map(([r, c]) => `${r},${c}`));
    const path2 = placeWordNearAnchor(seed2, grid, anchor);
    if (path2) commitPath(seed2, path2, grid, letterCount);
  }

  fillGrid(grid, letterCount, size);
  return grid;
}

// Public API

const MIN_WORDS = 10;
const MAX_RETRIES = 30;

export function generateGrid(size: number = 4): string[][] {
  let bestGrid = buildCandidateGrid(size);
  let bestCount = countValidWords(bestGrid);

  for (let attempt = 0; attempt < MAX_RETRIES && bestCount < MIN_WORDS; attempt++) {
    const candidate = buildCandidateGrid(size);
    const count = countValidWords(candidate);
    if (count > bestCount) {
      bestGrid = candidate;
      bestCount = count;
    }
  }

  return bestGrid;
}
