// Daily Challenge Letter Generation
// Uses date as seed to ensure all users get the same letters each day

import { isPlayable } from './letterValidator';

// Simple seeded random number generator
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Convert date to numeric seed
function dateToSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // Create unique seed from date components
  return year * 10000 + month * 100 + day;
}

// Vowel weights — favors E and A (no J, Q, X, Z)
const VOWEL_WEIGHTS: Record<string, number> = {
  E: 14, A: 10, I: 9, O: 9, U: 4,
};

// Consonant weights — common letters only, no J, Q, X, Z
const CONSONANT_WEIGHTS: Record<string, number> = {
  T: 9, N: 8, S: 8, R: 9, L: 6,
  D: 5, H: 5, G: 4, M: 4, C: 4,
  P: 4, B: 3, F: 3, W: 3, Y: 3,
  K: 2, V: 2,
};

// Common anchor consonants — guarantee at least one of these
const ANCHOR_CONSONANTS = ['S', 'T', 'R', 'N', 'L'];

const VOWELS = ['A', 'E', 'I', 'O', 'U'];

function pickWeightedSeeded(
  weights: Record<string, number>,
  random: () => number
): string {
  const keys = Object.keys(weights);
  const vals = Object.values(weights);
  const total = vals.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < keys.length; i++) {
    r -= vals[i];
    if (r <= 0) return keys[i];
  }
  return keys[keys.length - 1];
}

const MAX_DAILY_RETRIES = 20;

// Core generation logic — extracted so we can retry with different seeds
function generateFromSeed(seed: number): string[] {
  const random = seededRandom(seed);

  const letters: string[] = [];

  // 3 vowels, avoiding 3 of the same
  const vowelBag: Record<string, number> = {};
  while (letters.length < 3) {
    let v: string;
    let attempts = 0;
    do {
      v = pickWeightedSeeded(VOWEL_WEIGHTS, random);
      attempts++;
    } while ((vowelBag[v] ?? 0) >= 2 && attempts < 10);
    vowelBag[v] = (vowelBag[v] ?? 0) + 1;
    letters.push(v);
  }

  // Anchor consonant — guaranteed common letter (S, T, R, N, or L)
  const anchor = ANCHOR_CONSONANTS[Math.floor(random() * ANCHOR_CONSONANTS.length)];
  letters.push(anchor);

  // Fill remaining 2 consonants — avoid duplicating rare ones
  const consonantBag: Record<string, number> = { [anchor]: 1 };
  while (letters.length < 6) {
    let c: string;
    let attempts = 0;
    do {
      c = pickWeightedSeeded(CONSONANT_WEIGHTS, random);
      attempts++;
      const isUncommon = !['S', 'T', 'R', 'N', 'L', 'D', 'H', 'G', 'M', 'C'].includes(c);
      const limit = isUncommon ? 1 : 2;
      if ((consonantBag[c] ?? 0) < limit) break;
    } while (attempts < 15);
    consonantBag[c] = (consonantBag[c] ?? 0) + 1;
    letters.push(c);
  }

  // Shuffle using seeded random
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return letters;
}

// Generate daily letters using date seed
// Retries with seed+1, seed+2, … until a playable set is found.
// Deterministic: same date always produces the same result for all users.
export function generateDailyLetters(date: Date = new Date()): string[] {
  const baseSeed = dateToSeed(date);

  for (let i = 0; i < MAX_DAILY_RETRIES; i++) {
    const letters = generateFromSeed(baseSeed + i);
    if (isPlayable(letters)) return letters;
  }

  // Fallback: return the base seed result even if below threshold
  return generateFromSeed(baseSeed);
}

// Get today's date string (for storage key)
export function getTodayDateString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Check if a date string is today
export function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}
