import { FIVE_LETTER_WORDS } from '../data/wordList';

/**
 * Get a deterministic daily word based on the current date
 * This ensures all players get the same word for a given day
 */
export function getDailyWord(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // Create a seed based on the date
  const seed = year * 10000 + month * 100 + day;

  // Use a simple but consistent hash function
  const hash = simpleHash(seed.toString());

  // Use the hash to select a word from the list
  const index = Math.abs(hash) % FIVE_LETTER_WORDS.length;

  return FIVE_LETTER_WORDS[index];
}

/**
 * Get a random word for practice mode
 */
export function getRandomWord(): string {
  const randomIndex = Math.floor(Math.random() * FIVE_LETTER_WORDS.length);
  return FIVE_LETTER_WORDS[randomIndex];
}

/**
 * Simple hash function for deterministic word selection
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Check if a word is valid (exists in our word list)
 */
export function isValidWord(word: string): boolean {
  return FIVE_LETTER_WORDS.includes(word.toLowerCase());
}
