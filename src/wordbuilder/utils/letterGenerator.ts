import { isPlayable } from './letterValidator';

const MAX_RETRIES = 20;

// Common consonants that appear in lots of real words
const COMMON_CONSONANTS = ['T', 'N', 'S', 'R', 'L', 'D', 'C', 'H', 'M', 'P'];

// Weighted vowel selection — favors E and A
const pickVowel = (): string => {
  const rand = Math.random() * 100;
  if (rand < 32) return 'E';
  if (rand < 58) return 'A';
  if (rand < 76) return 'I';
  if (rand < 91) return 'O';
  return 'U';
};

// Weighted consonant selection — no J, Q, X, Z; heavy weight on common letters
const pickConsonant = (excludeRare = false): string => {
  const rand = Math.random() * 100;
  if (rand < 14) return 'T';
  if (rand < 27) return 'N';
  if (rand < 40) return 'S';
  if (rand < 52) return 'R';
  if (rand < 62) return 'L';
  if (rand < 68) return 'D';
  if (rand < 73) return 'C';
  if (rand < 78) return 'H';
  if (rand < 82) return 'M';
  if (rand < 86) return 'P';
  if (rand < 89) return 'F';
  if (rand < 91) return 'G';
  if (rand < 93) return 'W';
  if (rand < 95) return 'B';
  if (rand < 97) return 'Y';
  if (rand < 99) return 'K';
  return excludeRare ? 'V' : 'V'; // V as the least-common allowed consonant
};

// Core generation logic — extracted so we can retry
const generateOnce = (count: number): string[] => {
  const letters: string[] = [];

  // Vowel counts — more generous so boards are playable
  let vowelCount: number;
  if (count === 6) {
    // 2 or 3 vowels, weighted toward 3 (60%)
    vowelCount = Math.random() < 0.6 ? 3 : 2;
  } else if (count === 7) {
    // 3 vowels always
    vowelCount = 3;
  } else {
    // 8 letters: 3 vowels (occasionally 4)
    vowelCount = Math.random() < 0.25 ? 4 : 3;
  }

  // Add vowels — avoid 3 of the same vowel
  const vowelBag: Record<string, number> = {};
  for (let i = 0; i < vowelCount; i++) {
    let v: string;
    let attempts = 0;
    do {
      v = pickVowel();
      attempts++;
    } while ((vowelBag[v] ?? 0) >= 2 && attempts < 10);
    vowelBag[v] = (vowelBag[v] ?? 0) + 1;
    letters.push(v);
  }

  const consonantCount = count - vowelCount;

  // Guarantee at least one very common consonant (S, T, R, N, or L)
  const anchor = COMMON_CONSONANTS[Math.floor(Math.random() * 5)]; // first 5 are S/T/R/N/L
  letters.push(anchor);

  // Fill remaining consonants — avoid duplicating rare ones
  const consonantBag: Record<string, number> = { [anchor]: 1 };
  for (let i = 1; i < consonantCount; i++) {
    let c: string;
    let attempts = 0;
    do {
      c = pickConsonant();
      attempts++;
      // Allow max 2 of any consonant, max 1 of uncommon ones
      const isUncommon = !COMMON_CONSONANTS.includes(c);
      const limit = isUncommon ? 1 : 2;
      if ((consonantBag[c] ?? 0) < limit) break;
    } while (attempts < 15);
    consonantBag[c] = (consonantBag[c] ?? 0) + 1;
    letters.push(c);
  }

  // Shuffle
  return letters.sort(() => Math.random() - 0.5);
};

// Generate random letters for the game — retries until playable
export const generateLetters = (count: number): string[] => {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const letters = generateOnce(count);
    if (isPlayable(letters)) return letters;
  }
  // Fallback: return whatever we get on the last try
  return generateOnce(count);
};
