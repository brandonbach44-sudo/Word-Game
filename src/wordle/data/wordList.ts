import { VALID_WORDS } from '../../wordbuilder/data/words';

// Filter VALID_WORDS to only include 5-letter words
export const FIVE_LETTER_WORDS = Array.from(VALID_WORDS).filter(word => word.length === 5);

// Create a Set for fast lookups
export const FIVE_LETTER_WORDS_SET = new Set(FIVE_LETTER_WORDS);

// For debugging/testing purposes
console.log(`Found ${FIVE_LETTER_WORDS.length} five-letter words`);
