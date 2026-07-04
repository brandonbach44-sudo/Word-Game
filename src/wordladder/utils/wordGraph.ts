// src/wordladder/utils/wordGraph.ts
// Word-ladder graph utilities: builds a lazy, cached neighbor index over the
// shared dictionary (src/shared/words.ts) and finds shortest paths between
// two words of the same length using BFS. Two words are "neighbors" if they
// are the same length and differ in exactly one letter position.
//
// Instead of building a full O(n^2) adjacency list, we bucket words by
// wildcard pattern (e.g. "c_t" for a 3-letter word with the middle letter
// blanked) — words sharing a pattern are neighbors. This is O(n * length)
// to build and fast to query, which matters since the shared dictionary has
// ~41k words.

import { VALID_WORDS } from '../../shared/words';

type PatternMap = Map<string, string[]>;

const wordsByLengthCache = new Map<number, string[]>();
const patternCache = new Map<number, PatternMap>();
const neighborCache = new Map<string, string[]>();

const MIN_LENGTH = 3;
const MAX_LENGTH = 8;

function isPlainWord(word: string): boolean {
  return /^[a-z]+$/.test(word);
}

/** All dictionary words of a given length (lowercase, letters only). */
export function getWordsOfLength(length: number): string[] {
  const cached = wordsByLengthCache.get(length);
  if (cached) return cached;
  const words: string[] = [];
  VALID_WORDS.forEach((w) => {
    if (w.length === length && isPlainWord(w)) words.push(w);
  });
  wordsByLengthCache.set(length, words);
  return words;
}

function getPatternMap(length: number): PatternMap {
  const cached = patternCache.get(length);
  if (cached) return cached;
  const map: PatternMap = new Map();
  const words = getWordsOfLength(length);
  for (const word of words) {
    for (let i = 0; i < length; i++) {
      const pattern = word.slice(0, i) + '_' + word.slice(i + 1);
      const list = map.get(pattern);
      if (list) list.push(word);
      else map.set(pattern, [word]);
    }
  }
  patternCache.set(length, map);
  return map;
}

/** All words that differ from `word` by exactly one letter (same length, dictionary word). */
export function getNeighbors(word: string): string[] {
  const lower = word.toLowerCase();
  const cached = neighborCache.get(lower);
  if (cached) return cached;

  const map = getPatternMap(lower.length);
  const neighbors = new Set<string>();
  for (let i = 0; i < lower.length; i++) {
    const pattern = lower.slice(0, i) + '_' + lower.slice(i + 1);
    const list = map.get(pattern);
    if (list) {
      for (const w of list) if (w !== lower) neighbors.add(w);
    }
  }
  const result = Array.from(neighbors);
  neighborCache.set(lower, result);
  return result;
}

export function isValidWord(word: string): boolean {
  return VALID_WORDS.has(word.toLowerCase());
}

/** Exactly-one-letter-different check between two same-length words. */
export function isOneLetterOff(a: string, b: string): boolean {
  const wa = a.toLowerCase();
  const wb = b.toLowerCase();
  if (wa.length !== wb.length) return false;
  let diff = 0;
  for (let i = 0; i < wa.length; i++) {
    if (wa[i] !== wb[i]) diff++;
    if (diff > 1) return false;
  }
  return diff === 1;
}

/**
 * Shortest path between two same-length words via BFS over the neighbor graph.
 * Returns the full path (inclusive of start/end) or null if no path exists
 * within maxDepth steps.
 */
export function findShortestPath(
  start: string,
  end: string,
  maxDepth: number = 10
): string[] | null {
  const from = start.toLowerCase();
  const to = end.toLowerCase();
  if (from.length !== to.length) return null;
  if (from === to) return [from];

  const visited = new Set<string>([from]);
  let frontier: string[][] = [[from]];
  let depth = 0;

  while (frontier.length > 0 && depth < maxDepth) {
    const nextFrontier: string[][] = [];
    for (const path of frontier) {
      const word = path[path.length - 1];
      for (const neighbor of getNeighbors(word)) {
        if (visited.has(neighbor)) continue;
        if (neighbor === to) return [...path, neighbor];
        visited.add(neighbor);
        nextFrontier.push([...path, neighbor]);
      }
    }
    frontier = nextFrontier;
    depth++;
  }
  return null;
}

export function isSupportedLength(length: number): boolean {
  return length >= MIN_LENGTH && length <= MAX_LENGTH;
}
