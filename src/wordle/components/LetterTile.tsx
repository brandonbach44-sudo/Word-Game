import React, { useEffect, useRef } from 'react';
import { Text, Animated, Easing } from 'react-native';
import { styles } from '../styles/gameStyles';

export type LetterState = 'default' | 'correct' | 'present' | 'absent';

interface LetterTileProps {
  letter: string;
  state: LetterState;
  isRevealed: boolean;
  flipDelay?: number;
}

export const LetterTile: React.FC<LetterTileProps> = ({
  letter,
  state,
  isRevealed,
  flipDelay = 0,
}) => {
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRevealed) {
      // Start flip animation after delay
      setTimeout(() => {
        Animated.sequence([
          // First half of flip (scale down slightly)
          Animated.timing(flipAnimation, {
            toValue: 0.5,
            duration: 75,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          // Second half of flip (scale back up with rotation)
          Animated.parallel([
            Animated.timing(flipAnimation, {
              toValue: 1,
              duration: 75,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 1,
              duration: 75,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, flipDelay);
    }
  }, [isRevealed, flipDelay, flipAnimation, scaleAnimation]);

  // Interpolate rotation for flip effect
  const rotateY = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  // Get tile style based on state
  const getTileStyle = () => {
    switch (state) {
      case 'correct':
        return styles.tileCorrect;
      case 'present':
        return styles.tilePresent;
      case 'absent':
        return styles.tileAbsent;
      default:
        return styles.tileDefault;
    }
  };

  // Get text style based on state
  const getTextStyle = () => {
    return isRevealed ? styles.tileTextRevealed : styles.tileTextDefault;
  };

  return (
    <Animated.View
      style={[
        styles.tile,
        getTileStyle(),
        {
          transform: [
            { rotateY },
            { scale: scaleAnimation },
          ],
        },
      ]}
    >
      <Text style={[styles.tileText, getTextStyle()]}>
        {letter.toUpperCase()}
      </Text>
    </Animated.View>
  );
};
