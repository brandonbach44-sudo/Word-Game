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

  // Guess a letter
  const guessLetter = useCallback(
    (letter: string) => {
      if (status !== 'playing') return;

      const upperLetter = letter.toUpperCase();

      // Already guessed
      if (guessedLetters.includes(upperLetter)) return;

      const newGuessedLetters = [... guessedLetters, upperLetter];
      setGuessedLetters(newGuessedLetters);

      // Check if letter is in word (ignore spaces for phrases)
      const wordLetters = word.replace(/\s/g, '');
      if (wordLetters.includes(upperLetter)) {
        const newCorrectGuesses = [...correctGuesses, upperLetter];
        setCorrectGuesses(newCorrectGuesses);

        // Check for win - all letters guessed (excluding spaces)
        const uniqueLetters = [...new Set(wordLetters. split(''))];
        const allGuessed = uniqueLetters. every((l) => newGuessedLetters.includes(l));
        if (allGuessed) {
          setStatus('won');
        }
      } else {
        const newIncorrectGuesses = [... incorrectGuesses, upperLetter];
        setIncorrectGuesses(newIncorrectGuesses);

        // Check for loss
        if (newIncorrectGuesses.length >= maxAttempts) {
          setStatus('lost');
        }
      }
    },
    [status, word, guessedLetters, correctGuesses, incorrectGuesses, maxAttempts]
  );

  // Get display word (with blanks for unguessed letters, spaces shown as gaps)
  const getDisplayWord = useCallback(() => {
    return word
      .split('')
      .map((letter) => {
        if (letter === ' ') return ' '; // Space for gap
        return guessedLetters.includes(letter) ? letter : '_';
      });
  }, [word, guessedLetters]);

  // Check if a letter has been guessed
  const isLetterGuessed = useCallback(
    (letter: string) => guessedLetters.includes(letter. toUpperCase()),
    [guessedLetters]
  );

  // Check if a letter was correct
  const isLetterCorrect = useCallback(
    (letter: string) => correctGuesses.includes(letter.toUpperCase()),
    [correctGuesses]
  );

  // Check if a letter was incorrect
  const isLetterIncorrect = useCallback(
    (letter: string) => incorrectGuesses.includes(letter.toUpperCase()),
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