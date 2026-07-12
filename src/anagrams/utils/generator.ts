// src/anagrams/utils/generator.ts
// Generates Anagrams puzzles: a set of 5 rounds with increasing word length
// (and therefore increasing difficulty), each round scrambling a common,
// recognizable word.
//
// Practice mode: fully random, generated fresh on-device each time.
// Daily mode: seeded by the calendar date so every player gets the exact
// same 5 words on a given day (no backend required).

import commonWords from '../../wordgrid/data/commonWords';
import { VALID_WORDS } from '../../shared/words';
import { AnagramsCategoryId, getCategoryWordsByLength } from '../data/categories';

// Progressive difficulty: 4 → 5 → 6 → 6 → 7 letters across the 5 rounds.
export const ROUND_LENGTHS: number[] = [4, 5, 6, 6, 7];
export const TOTAL_ROUNDS = ROUND_LENGTHS.length;

export interface AnagramRound {
  word: string; // intended target word (lowercase)
  scrambled: string[]; // shuffled letters, uppercase single chars
}

export interface AnagramPuzzle {
  rounds: AnagramRound[];
}

// Small deterministic PRNG (same technique used by Word Ladder / Word Search)
// so the daily puzzle is reproducible from a date seed.
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function dateToSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

const poolByLength = new Map<number, string[]>();
function getPool(length: number): string[] {
  const cached = poolByLength.get(length);
  if (cached) return cached;
  const pool = commonWords.filter((w) => w.length === length);
  poolByLength.set(length, pool);
  return pool;
}

// Category pools are lowercased here (category data is stored uppercase for
// display elsewhere) so they line up with commonWords/VALID_WORDS, which are
// lowercase throughout this file.
const categoryPoolByKey = new Map<string, string[]>();
function getCategoryPool(categoryId: AnagramsCategoryId, length: number): string[] {
  const key = `${categoryId}:${length}`;
  const cached = categoryPoolByKey.get(key);
  if (cached) return cached;
  const pool = getCategoryWordsByLength(categoryId, length).map((w) => w.toLowerCase());
  categoryPoolByKey.set(key, pool);
  return pool;
}

/** Shuffles a word's letters, guaranteeing the result differs from the original order. */
function scrambleWord(word: string, rand: () => number): string[] {
  const original = word.toUpperCase().split('');
  if (original.length <= 1) return original;

  let shuffled = [...original];
  let attempts = 0;
  do {
    shuffled = [...original];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (shuffled.join('') === original.join('') && attempts < 15);

  return shuffled;
}

function buildRound(length: number, rand: () => number, usedWords: Set<string>, pool: string[]): AnagramRound {
  let word = pickRandom(pool, rand);
  let tries = 0;
  while (usedWords.has(word) && tries < 50) {
    word = pickRandom(pool, rand);
    tries++;
  }
  usedWords.add(word);
  return { word, scrambled: scrambleWord(word, rand) };
}

function buildPuzzle(rand: () => number): AnagramPuzzle {
  const used = new Set<string>();
  const rounds = ROUND_LENGTHS.map((length) => buildRound(length, rand, used, getPool(length)));
  return { rounds };
}

export function generatePracticeAnagrams(): AnagramPuzzle {
  return buildPuzzle(Math.random);
}

export function generateDailyAnagrams(date: Date = new Date()): AnagramPuzzle {
  const seed = dateToSeed(date);
  return buildPuzzle(createSeededRandom(seed));
}

/**
 * Categories Quick Play — same progressive 5-round structure as Classic,
 * but every round's word is pulled only from the chosen category's list
 * (src/anagrams/data/categories.ts) instead of the general commonWords
 * pool. Always randomized (no daily/seeded variant — categories are a
 * Quick Play-only mode per the Anagrams entry screen's Classic/Categories
 * split).
 */
export function generateCategoryAnagrams(categoryId: AnagramsCategoryId): AnagramPuzzle {
  const used = new Set<string>();
  const rounds = ROUND_LENGTHS.map((length) =>
    buildRound(length, Math.random, used, getCategoryPool(categoryId, length))
  );
  return { rounds };
}

/**
 * A guess is correct if it uses exactly the scrambled letters for this round
 * AND is either a real dictionary word (any valid anagram of the letter set
 * is accepted, not just the one intended word — more forgiving, occasionally
 * rewards a sharp-eyed player who spots an alternate answer) OR, when
 * playing a Categories round, one of that category's own words — several
 * category entries (country names, star/planet names, etc.) are proper
 * nouns that won't appear in the general English dictionary, so the
 * category's own word list is consulted as a second source of truth.
 * Passing categoryId is optional and has no effect on Classic/Daily mode.
 */
export function isValidAnagramGuess(
  guess: string,
  scrambledLetters: string[],
  categoryId?: AnagramsCategoryId
): boolean {
  const g = guess.trim().toLowerCase();
  if (g.length !== scrambledLetters.length) return false;

  const inDictionary = VALID_WORDS.has(g);
  const inCategory = categoryId != null && getCategoryPool(categoryId, g.length).includes(g);
  if (!inDictionary && !inCategory) return false;

  const sortLetters = (s: string) => s.split('').sort().join('');
  return sortLetters(g) === sortLetters(scrambledLetters.join('').toLowerCase());
}

/** Reveals one correct letter position for a hint (first blank/incorrect slot). */
export function getHintLetter(word: string, currentGuessSlots: string[]): { index: number; letter: string } | null {
  const target = word.toUpperCase();
  for (let i = 0; i < target.length; i++) {
    if (currentGuessSlots[i] !== target[i]) {
      return { index: i, letter: target[i] };
    }
  }
  return null;
}
