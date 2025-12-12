import { useState } from 'react';

type GameState = 'playing' | 'won' | 'lost';

type GuessState = {
  correctGuesses: string[];
  incorrectGuesses: string[];
};

const DEFAULT_ATTEMPTS = 6; // Default number of attempts before the game is lost
const PHRASES = [
  'hello world',
  'javascript',
  'react native',
  'hangman game',
  'expo framework',
  'open source',
  'mobile development',
]; // Example phrases for the game

export const useHangman = () => {
  const [phrase, setPhrase] = useState(''); // The word/phrase to guess
  const [guesses, setGuesses] = useState<GuessState>({
    correctGuesses: [],
    incorrectGuesses: [],
  }); // Tracks correct and incorrect guesses
  const [remainingAttempts, setRemainingAttempts] = useState(DEFAULT_ATTEMPTS); // How many attempts are left
  const [gameState, setGameState] = useState<GameState>('playing'); // Current game state

  // Function to start a new game
  const startNewGame = () => {
    const randomPhrase =
      PHRASES[Math.floor(Math.random() * PHRASES.length)]; // Pick a phrase randomly
    setPhrase(randomPhrase);
    setGuesses({ correctGuesses: [], incorrectGuesses: [] });
    setRemainingAttempts(DEFAULT_ATTEMPTS);
    setGameState('playing');
  };

  // Function to guess a letter
  const guessLetter = (letter: string) => {
    if (gameState !== 'playing') return; // Ignore guesses if the game is over

    // Normalize letter to lowercase
    letter = letter.toLowerCase();

    // Prevent repeated guesses
    if (
      guesses.correctGuesses.includes(letter) ||
      guesses.incorrectGuesses.includes(letter)
    ) {
      return;
    }

    if (phrase.includes(letter)) {
      // Correct guess
      setGuesses((prevGuesses) => ({
        ...prevGuesses,
        correctGuesses: [...prevGuesses.correctGuesses, letter], // Add the correct letter
      }));

      // Check if the player has guessed all the letters
      const allLettersGuessed = phrase
        .split('')
        .every(
          (char) =>
            char === ' ' || // Ignore spaces
            [...guesses.correctGuesses, letter].includes(char) // Check guessed letters
        );

      if (allLettersGuessed) {
        setGameState('won'); // Player wins
      }
    } else {
      // Incorrect guess
      setGuesses((prevGuesses) => ({
        ...prevGuesses,
        incorrectGuesses: [...prevGuesses.incorrectGuesses, letter], // Add incorrect letter
      }));

      setRemainingAttempts((prevAttempts) => prevAttempts - 1); // Reduce remaining attempts

      // Check if the player has run out of attempts
      setRemainingAttempts((prevAttempts) => {
        const newAttempts = prevAttempts - 1;
        if (newAttempts === 0) {
          setGameState('lost'); // Player loses
        }
        return newAttempts;
      });
    }
  };

  // Function to display the partially guessed phrase
  const getRevealedPhrase = () => {
    return phrase
      .split('')
      .map((char) =>
        char === ' ' // Spaces are revealed immediately
          ? ' '
          : guesses.correctGuesses.includes(char) // Show guessed letters
          ? char
          : '_' // For unguessed letters, show an underscore
      )
      .join(' ');
  };

  return {
    phrase, // The current phrase/word
    guesses, // Object with the current correct and incorrect guesses
    remainingAttempts, // Number of attempts remaining
    gameState, // The current state of the game ('playing', 'won', 'lost')
    guessLetter, // Function to guess a letter
    getRevealedPhrase, // Function to get the revealed word/phrase
    startNewGame, // Function to reset and start a new game
  };
};