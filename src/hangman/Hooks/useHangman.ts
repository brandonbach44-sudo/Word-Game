import { useCallback, useState } from 'react';
import {
  getPhraseFromCategory,
  getRandomWord,
  getWordFromCategory,
  MAX_ATTEMPTS
} from '../data/words';

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export const useHangman = () => {
  const [word, setWord] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [incorrectGuesses, setIncorrectGuesses] = useState<string[]>([]);
  const [correctGuesses, setCorrectGuesses] = useState<string[]>([]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [isPhrase, setIsPhrase] = useState<boolean>(false);

  const maxAttempts = MAX_ATTEMPTS;
  const remainingAttempts = maxAttempts - incorrectGuesses.length;

  const isPlaying = status === 'playing';
  const isWon = status === 'won';
  const isLost = status === 'lost';
  const isIdle = status === 'idle';

  // Start game with random word
  const startGame = useCallback(() => {
    const { word: newWord, category: newCategory } = getRandomWord();
    setWord(newWord);
    setCategory(newCategory);
    setGuessedLetters([]);
    setIncorrectGuesses([]);
    setCorrectGuesses([]);
    setStatus('playing');
    setIsPhrase(false);
  }, []);

  // Start game with specific category
  const startGameWithCategory = useCallback((categoryName: string, phraseMode: boolean = false) => {
    let result;
    if (phraseMode) {
      result = getPhraseFromCategory(categoryName);
      setIsPhrase(true);
    } else {
      result = getWordFromCategory(categoryName);
      setIsPhrase(false);
    }

    setWord(result.word);
    setCategory(result.category);
    setGuessedLetters([]);
    setIncorrectGuesses([]);
    setCorrectGuesses([]);
    setStatus('playing');
  }, []);

  // Guess a letter (case-insensitive, whitespace-safe)
  const guessLetter = useCallback(
    (letter: string) => {
      if (status !== 'playing') return;

      const normalizedLetter = letter.trim().toLowerCase();

      // Already guessed (case-insensitive)
      if (guessedLetters.map(l => l.toLowerCase()).includes(normalizedLetter)) return;

      const newGuessedLetters = [...guessedLetters, letter]; // Store as user input for UI
      setGuessedLetters(newGuessedLetters);

      // Normalize word (remove spaces & toLowerCase for comparison)
      const wordLetters = word.replace(/\s/g, '').toLowerCase();

      if (wordLetters.includes(normalizedLetter)) {
        const newCorrectGuesses = [...correctGuesses, letter];
        setCorrectGuesses(newCorrectGuesses);

        // Win check - all unique letters (lower) in word are in guessedLetters (lower)
        const uniqueLetters = [...new Set(wordLetters.split(''))];
        const guessedNormalized = newGuessedLetters.map(l => l.toLowerCase());
        const allGuessed = uniqueLetters.every((l) => guessedNormalized.includes(l));
        if (allGuessed) {
          setStatus('won');
        }
      } else {
        const newIncorrectGuesses = [...incorrectGuesses, letter];
        setIncorrectGuesses(newIncorrectGuesses);

        // Loss check
        if (newIncorrectGuesses.length >= maxAttempts) {
          setStatus('lost');
        }
      }
    },
    [status, word, guessedLetters, correctGuesses, incorrectGuesses, maxAttempts]
  );

  // Get display word (with blanks for unguessed letters, spaces shown as gaps)
  const getDisplayWord = useCallback(() => {
    const guessedNormalized = guessedLetters.map(l => l.toLowerCase());
    return word
      .split('')
      .map((letter) => {
        if (letter === ' ') return ' '; // Space for gap
        return guessedNormalized.includes(letter.toLowerCase()) ? letter : '_';
      });
  }, [word, guessedLetters]);

  // Check if a letter has been guessed (case-insensitive)
  const isLetterGuessed = useCallback(
    (letter: string) => guessedLetters.map(l => l.toLowerCase()).includes(letter.toLowerCase()),
    [guessedLetters]
  );

  // Check if a letter was correct (case-insensitive)
  const isLetterCorrect = useCallback(
    (letter: string) => correctGuesses.map(l => l.toLowerCase()).includes(letter.toLowerCase()),
    [correctGuesses]
  );

  // Check if a letter was incorrect (case-insensitive)
  const isLetterIncorrect = useCallback(
    (letter: string) => incorrectGuesses.map(l => l.toLowerCase()).includes(letter.toLowerCase()),
    [incorrectGuesses]
  );

  // Get game statistics
  const getGameStats = useCallback(() => {
    return {
      totalGuesses: guessedLetters.length,
      correctCount: correctGuesses.length,
      incorrectCount: incorrectGuesses.length,
      remainingAttempts,
    };
  }, [guessedLetters, correctGuesses, incorrectGuesses, remainingAttempts]);

  return {
    // State
    word,
    category,
    guessedLetters,
    incorrectGuesses,
    correctGuesses,
    remainingAttempts,
    maxAttempts,
    status,
    isPhrase,

    // Computed
    isPlaying,
    isWon,
    isLost,
    isIdle,

    // Actions
    startGame,
    startGameWithCategory,
    guessLetter,

    // Helpers
    getDisplayWord,
    isLetterGuessed,
    isLetterCorrect,
    isLetterIncorrect,
    getGameStats,
  };
};