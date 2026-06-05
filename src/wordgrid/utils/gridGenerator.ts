// src/wordgrid/utils/gridGenerator.ts
//
// Approach:
//   1. Build a trie from commonWords (~4,700 everyday words) once at module load.
//      Using commonWords instead of the full 80k dictionary means the MIN_WORDS
//      threshold is met by words players will actually recognise, not obscure ones.
//   2. Generate a candidate grid with hard constraints:
//        - Exactly one vowel placed in each 2x2 quadrant (spread guarantee).
//        - 1-2 extra vowels added at random, for 5-6 total.
//        - No letter appears more than twice (kills "4 I in a row" bug).
//        - Q, X, Z, J are banned (near-impossible to use in a 4x4 grid).
//   3. Count recognisable findable words via DFS + trie on the candidate grid.
//   4. If count < MIN_WORDS, retry up to MAX_RETRIES, keeping the best grid found.

import commonWords from '../data/commonWords';

// --- Trie -------------------------------------------------------------------

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

// Built once when the module is first imported.
const TRIE = buildTrie();

// --- Letter weights ---------------------------------------------------------
// Q, X, Z, J excluded — they are dead weight in a small grid.

const VOWEL_WEIGHTS: Record<string, number> = {
  A: 10,
  E: 14,
  I: 9,
  O: 9,
  U: 4,
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

// --- Word counter -----------------------------------------------------------

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
        const nr = r + dr;
        const nc = c + dc;
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

// --- Constrained candidate grid ---------------------------------------------

// The four 2x2 quadrants of a 4x4 grid.
const QUADRANTS: [number, number][][] = [
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 2], [0, 3], [1, 2], [1, 3]],
  [[2, 0], [2, 1], [3, 0], [3, 1]],
  [[2, 2], [2, 3], [3, 2], [3, 3]],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCandidateGrid(size: number): string[][] {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill('')
  );
  const letterCount: Record<string, number> = {};
  const placed = new Set<string>();

  const inc = (l: string) => {
    letterCount[l] = (letterCount[l] || 0) + 1;
  };
  const canPlace = (l: string) => (letterCount[l] || 0) < 2;

  // Step 1: one vowel per quadrant
  for (const quad of QUADRANTS) {
    const cells = shuffle(quad);
    let vowel = pickWeightedAvailable(VOWEL_WEIGHTS, canPlace);
    if (!vowel) vowel = 'E';
    const [r, c] = cells[0];
    grid[r][c] = vowel;
    inc(vowel);
    placed.add(`${r},${c}`);
  }

  // Step 2: 1-2 extra vowels scattered in remaining cells
  const extraCount = Math.random() < 0.5 ? 1 : 2;
  const emptyCells = shuffle(
    Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => [r, c] as [number, number])
    ).flat().filter(([r, c]) => !placed.has(`${r},${c}`))
  );

  let added = 0;
  for (const [r, c] of emptyCells) {
    if (added >= extraCount) break;
    const vowel = pickWeightedAvailable(VOWEL_WEIGHTS, canPlace);
    if (!vowel) break;
    grid[r][c] = vowel;
    inc(vowel);
    placed.add(`${r},${c}`);
    added++;
  }

  // Step 3: fill remaining with consonants (cap at 2 each)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) continue;
      const letter = pickWeightedAvailable(CONSONANT_WEIGHTS, canPlace) ?? 'R';
      grid[r][c] = letter;
      inc(letter);
    }
  }

  return grid;
}

// --- Public API -------------------------------------------------------------

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
