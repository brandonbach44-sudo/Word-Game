import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { LetterTile, LetterState } from './LetterTile';
import { styles } from '../styles/gameStyles';

export interface GuessResult {
  word: string;
  letterStates: LetterState[];
}

interface GameGridProps {
  guesses: GuessResult[];
  currentGuess: string;
  targetWord: string;
  shakeRow?: number; // Index of row to shake (for invalid word animation)
}

export const GameGrid: React.FC<GameGridProps> = ({
  guesses,
  currentGuess,
  targetWord,
  shakeRow,
}) => {
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shakeRow !== undefined) {
      // Shake animation for invalid word
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shakeRow, shakeAnimation]);

  // Create 6 rows
  const rows = Array.from({ length: 6 }, (_, rowIndex) => {
    const guess = guesses[rowIndex];
    const isCurrentRow = rowIndex === guesses.length;
    const isRevealed = guess !== undefined;

    // Create 5 tiles for each row
    const tiles = Array.from({ length: 5 }, (_, colIndex) => {
      let letter = '';
      let state: LetterState = 'default';
      let flipDelay = 0;

      if (isRevealed) {
        // Show completed guess
        letter = guess.word[colIndex] || '';
        state = guess.letterStates[colIndex] || 'default';
        flipDelay = colIndex * 150; // Stagger flip animation
      } else if (isCurrentRow) {
        // Show current input
        letter = currentGuess[colIndex] || '';
      }

      return (
        <LetterTile
          key={`tile-${rowIndex}-${colIndex}`}
          letter={letter}
          state={state}
          isRevealed={isRevealed}
          flipDelay={flipDelay}
        />
      );
    });

    const isShakingRow = shakeRow === rowIndex;

    return (
      <Animated.View
        key={`row-${rowIndex}`}
        style={[
          styles.gridRow,
          isShakingRow && {
            transform: [{
              translateX: shakeAnimation.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-10, 0, 10],
              }),
            }],
          },
        ]}
      >
        {tiles}
      </Animated.View>
    );
  });

  return (
    <View style={styles.gridContainer}>
      {rows}
    </View>
  );
};
