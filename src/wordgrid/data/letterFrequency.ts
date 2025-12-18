// src/wordgrid/data/letterFrequency.ts
// Gameplay-tuned weights for a 4×4 word grid.
// Higher numbers increase the chance a letter appears.
// Vowels are boosted slightly for playability.

export const letterFrequency: Record<string, number> = {
  // Vowels (boosted)
  A: 10,
  E: 12,
  I: 9,
  O: 9,
  U: 4,

  // Common consonants
  R: 7,
  S: 6,
  T: 7,
  N: 7,
  L: 5,

  // Mid-frequency consonants
  D: 4,
  G: 3,
  M: 3,
  P: 3,
  B: 2,
  C: 3,
  H: 3,
  F: 2,
  V: 2,
  W: 2,
  Y: 2,
  K: 1,

  // Rare consonants (keep low for spice)
  J: 1,
  X: 1,
  Q: 1,
  Z: 1,
};
