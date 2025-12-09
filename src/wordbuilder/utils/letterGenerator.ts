// Weighted vowel selection
const pickVowel = (): string => {
  const rand = Math.random() * 100;
  if (rand < 30) return 'E';      // 30%
  if (rand < 55) return 'A';      // 25%
  if (rand < 75) return 'I';      // 20%
  if (rand < 90) return 'O';      // 15%
  return 'U';                      // 10%
};

// Weighted consonant selection
const pickConsonant = (): string => {
  const rand = Math.random() * 100;
  // Common: T, N, S, R, L (~12% each = 60% total)
  if (rand < 12) return 'T';
  if (rand < 24) return 'N';
  if (rand < 36) return 'S';
  if (rand < 48) return 'R';
  if (rand < 60) return 'L';
  // Medium: D, C, H, M, P, F, G, W, B, Y (~4% each = 40% total)
  if (rand < 64) return 'D';
  if (rand < 68) return 'C';
  if (rand < 72) return 'H';
  if (rand < 76) return 'M';
  if (rand < 80) return 'P';
  if (rand < 84) return 'F';
  if (rand < 88) return 'G';
  if (rand < 92) return 'W';
  if (rand < 95) return 'B';
  if (rand < 98) return 'Y';
  // Rare: K, V (~1% each)
  if (rand < 99) return 'K';
  if (rand < 99.5) return 'V';
  // Very Rare: J, X, Q, Z (~0.5% total)
  if (rand < 99.6) return 'J';
  if (rand < 99.7) return 'X';
  if (rand < 99.85) return 'Q';
  return 'Z';
};

// Generate random letters for the game
export const generateLetters = (count: number): string[] => {
  const letters: string[] = [];
  
  // Determine vowel count based on tile count
  let vowelCount: number;
  if (count === 6) {
    vowelCount = 2;
  } else if (count === 7) {
    vowelCount = Math.random() < 0.5 ? 2 : 3;
  } else {
    vowelCount = Math.random() < 0.5 ? 2 : 3;
  }
  
  // Add vowels
  for (let i = 0; i < vowelCount; i++) {
    letters.push(pickVowel());
  }
  
  // Add consonants
  for (let i = 0; i < count - vowelCount; i++) {
    letters.push(pickConsonant());
  }
  
  // Shuffle
  return letters.sort(() => Math.random() - 0.5);
};
