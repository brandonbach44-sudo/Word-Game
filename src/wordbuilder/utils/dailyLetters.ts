// Daily Challenge Letter Generation
// Uses date as seed to ensure all users get the same letters each day

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

// Letter frequencies (same as regular letter generator)
const LETTER_WEIGHTS: Record<string, number> = {
  E: 12, T: 9, A: 8, O: 8, I: 7, N: 7, S: 6, H: 6, R: 6,
  D: 4, L: 4, C: 3, U: 3, M: 3, W: 2, F: 2, G: 2, Y: 2,
  P: 2, B: 1.5, V: 1, K: 0.8, J: 0.15, X: 0.15, Q: 0.1, Z: 0.07,
};

const VOWELS = ['A', 'E', 'I', 'O', 'U'];

// Generate daily letters using date seed
export function generateDailyLetters(date: Date = new Date()): string[] {
  const seed = dateToSeed(date);
  const random = seededRandom(seed);
  
  // Build weighted letter pool
  const letterPool: string[] = [];
  for (const [letter, weight] of Object.entries(LETTER_WEIGHTS)) {
    const count = Math.round(weight * 10);
    for (let i = 0; i < count; i++) {
      letterPool.push(letter);
    }
  }
  
  // Shuffle using seeded random
  for (let i = letterPool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [letterPool[i], letterPool[j]] = [letterPool[j], letterPool[i]];
  }
  
  // Pick 6 letters
  const letters: string[] = [];
  const used = new Set<number>();
  
  while (letters.length < 6) {
    const idx = Math.floor(random() * letterPool.length);
    if (!used.has(idx)) {
      used.add(idx);
      letters.push(letterPool[idx]);
    }
  }
  
  // Ensure at least 2 vowels
  const vowelCount = letters.filter(l => VOWELS.includes(l)).length;
  if (vowelCount < 2) {
    // Replace some consonants with vowels using seeded random
    const consonantIndices = letters
      .map((l, i) => VOWELS.includes(l) ? -1 : i)
      .filter(i => i !== -1);
    
    const needed = 2 - vowelCount;
    for (let i = 0; i < needed && i < consonantIndices.length; i++) {
      const vowelIdx = Math.floor(random() * VOWELS.length);
      letters[consonantIndices[i]] = VOWELS[vowelIdx];
    }
  }
  
  return letters;
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
