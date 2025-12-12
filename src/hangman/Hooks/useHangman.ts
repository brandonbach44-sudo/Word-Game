import { useCallback, useState } from 'react';

// Game state types
type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

type GameState = {
  word:  string;
  guessedLetters: string[];
  incorrectGuesses: string[];
  correctGuesses: string[];
  remainingAttempts: number;
  status: GameStatus;
  category: string;
};

// Word categories with words
const WORD_CATEGORIES:  { [key: string]: string[] } = {
  'Animals':  [
    'elephant', 'giraffe', 'penguin', 'dolphin', 'kangaroo',
    'butterfly', 'alligator', 'hedgehog', 'flamingo', 'octopus',
    'cheetah', 'gorilla', 'raccoon', 'squirrel', 'armadillo',
    'zebra', 'leopard', 'pelican', 'hamster', 'parrot',
  ],
  'Countries': [
    'australia', 'brazil', 'canada', 'denmark', 'ethiopia',
    'france', 'germany', 'hungary', 'indonesia', 'jamaica',
    'kenya', 'luxembourg', 'mexico', 'netherlands', 'portugal',
    'spain', 'sweden', 'thailand', 'vietnam', 'argentina',
  ],
  'Foods':  [
    'hamburger', 'spaghetti', 'chocolate', 'pineapple', 'strawberry',
    'avocado', 'broccoli', 'mushroom', 'sandwich', 'pancakes',
    'croissant', 'burrito', 'lasagna', 'cheesecake', 'cucumber',
    'blueberry', 'watermelon', 'asparagus', 'cinnamon', 'macaroni',
  ],
  'Sports': [
    'basketball', 'football', 'swimming', 'volleyball', 'badminton',
    'gymnastics', 'wrestling', 'snowboard', 'surfing', 'baseball',
    'cricket', 'hockey', 'tennis', 'archery', 'cycling',
    'marathon', 'bowling', 'boxing', 'sailing', 'skiing',
  ],
  'Technology': [
    'computer', 'keyboard', 'smartphone', 'bluetooth', 'software',
    'internet', 'algorithm', 'database', 'hardware', 'encryption',
    'download', 'streaming', 'wireless', 'processor', 'interface',
    'monitor', 'browser', 'network', 'robotics', 'programming',
  ],
  'Movies': [
    'adventure', 'animation', 'thriller', 'documentary', 'fantasy',
    'romance', 'superhero', 'mystery', 'western', 'musical',
    'horror', 'science', 'action', 'drama', 'comedy',
    'biography', 'historical', 'detective', 'suspense', 'sequel',
  ],
  'Nature': [
    'mountain', 'waterfall', 'rainbow', 'volcano', 'hurricane',
    'lightning', 'earthquake', 'sunshine', 'blizzard', 'glacier',
    'desert', 'forest', 'island', 'canyon', 'meadow',
    'ocean', 'river', 'valley', 'jungle', 'prairie',
  ],
  'Professions': [
    'architect', 'scientist', 'engineer', 'musician', 'physician',
    'carpenter', 'detective', 'librarian', 'journalist', 'pharmacist',
    'accountant', 'electrician', 'professor', 'veterinarian', 'programmer',
    'firefighter', 'astronaut', 'chef', 'lawyer', 'dentist',
  ],
};

const MAX_ATTEMPTS = 6; // Head, body, left arm, right arm, left leg, right leg

const getRandomWord = (): { word: string; category:  string } => {
  const categories = Object.keys(WORD_CATEGORIES);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const words = WORD_CATEGORIES[randomCategory];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  return { word: randomWord.toUpperCase(), category: randomCategory };
};

const initialState: GameState = {
  word: '',
  guessedLetters: [],
  incorrectGuesses: [],
  correctGuesses: [],
  remainingAttempts: MAX_ATTEMPTS,
  status:  'idle',
  category:  '',
};

export const useHangman = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  // Start a new game
  const startGame = useCallback(() => {
    const { word, category } = getRandomWord();
    setGameState({
      word,
      guessedLetters: [],
      incorrectGuesses: [],
      correctGuesses: [],
      remainingAttempts: MAX_ATTEMPTS,
      status: 'playing',
      category,
    });
  }, []);

  // Reset game to idle state
  const resetGame = useCallback(() => {
    setGameState(initialState);
  }, []);

  // Guess a letter
  const guessLetter = useCallback((letter: string) => {
    const normalizedLetter = letter.toUpperCase();

    setGameState((prevState) => {
      // Don't allow guesses if game is not playing
      if (prevState.status !== 'playing') {
        return prevState;
      }

      // Don't allow duplicate guesses
      if (prevState.guessedLetters. includes(normalizedLetter)) {
        return prevState;
      }

      const newGuessedLetters = [... prevState.guessedLetters, normalizedLetter];
      const isCorrect = prevState. word.includes(normalizedLetter);

      let newCorrectGuesses = [...prevState.correctGuesses];
      let newIncorrectGuesses = [... prevState.incorrectGuesses];
      let newRemainingAttempts = prevState.remainingAttempts;

      if (isCorrect) {
        newCorrectGuesses = [...newCorrectGuesses, normalizedLetter];
      } else {
        newIncorrectGuesses = [... newIncorrectGuesses, normalizedLetter];
        newRemainingAttempts -= 1;
      }

      // Check win condition - all letters in word have been guessed
      const wordLetters = [... new Set(prevState.word. split(''))];
      const allLettersGuessed = wordLetters.every((char) =>
        newCorrectGuesses.includes(char)
      );

      // Check lose condition
      const hasLost = newRemainingAttempts === 0;

      let newStatus: GameStatus = 'playing';
      if (allLettersGuessed) {
        newStatus = 'won';
      } else if (hasLost) {
        newStatus = 'lost';
      }

      return {
        ...prevState,
        guessedLetters: newGuessedLetters,
        correctGuesses: newCorrectGuesses,
        incorrectGuesses: newIncorrectGuesses,
        remainingAttempts:  newRemainingAttempts,
        status: newStatus,
      };
    });
  }, []);

  // Get the word display with blanks for unguessed letters
  const getDisplayWord = useCallback((): string[] => {
    return gameState.word. split('').map((letter) =>
      gameState.correctGuesses.includes(letter) ? letter : '_'
    );
  }, [gameState.word, gameState.correctGuesses]);

  // Check if a letter has been guessed
  const isLetterGuessed = useCallback(
    (letter:  string): boolean => {
      return gameState.guessedLetters.includes(letter.toUpperCase());
    },
    [gameState.guessedLetters]
  );

  // Check if a guessed letter was correct
  const isLetterCorrect = useCallback(
    (letter: string): boolean => {
      return gameState.correctGuesses.includes(letter.toUpperCase());
    },
    [gameState.correctGuesses]
  );

  // Check if a guessed letter was incorrect
  const isLetterIncorrect = useCallback(
    (letter: string): boolean => {
      return gameState.incorrectGuesses.includes(letter.toUpperCase());
    },
    [gameState.incorrectGuesses]
  );

  // Get game statistics for display
  const getGameStats = useCallback(() => {
    const totalLetters = [... new Set(gameState.word. split(''))].length;
    const guessedCorrect = gameState.correctGuesses.length;
    const progress = totalLetters > 0 ? Math.round((guessedCorrect / totalLetters) * 100) : 0;

    return {
      totalLetters,
      guessedCorrect,
      guessedIncorrect: gameState.incorrectGuesses.length,
      totalGuesses: gameState.guessedLetters.length,
      progress,
    };
  }, [gameState]);

  return {
    // State
    word: gameState.word,
    category: gameState.category,
    guessedLetters: gameState.guessedLetters,
    correctGuesses: gameState. correctGuesses,
    incorrectGuesses: gameState.incorrectGuesses,
    remainingAttempts: gameState.remainingAttempts,
    maxAttempts: MAX_ATTEMPTS,
    status: gameState.status,
    isPlaying: gameState.status === 'playing',
    isWon: gameState.status === 'won',
    isLost: gameState. status === 'lost',
    isIdle: gameState.status === 'idle',

    // Actions
    startGame,
    resetGame,
    guessLetter,

    // Helpers
    getDisplayWord,
    isLetterGuessed,
    isLetterCorrect,
    isLetterIncorrect,
    getGameStats,
  };
};

export default useHangman;