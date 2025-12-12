import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';

const { width } = Dimensions. get('window');

// Keyboard layout
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

type KeyboardProps = {
  onKeyPress: (letter: string) => void;
  isLetterGuessed: (letter: string) => boolean;
  isLetterCorrect: (letter: string) => boolean;
  isLetterIncorrect: (letter:  string) => boolean;
  disabled?: boolean;
};

export const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  isLetterGuessed,
  isLetterCorrect,
  isLetterIncorrect,
  disabled = false,
}) => {
  const { background } = useTheme();

  const getKeyStyle = (letter: string) => {
    if (isLetterCorrect(letter)) {
      return {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
      };
    }
    if (isLetterIncorrect(letter)) {
      // Light grey for incorrect guesses (matches Wordle)
      return {
        backgroundColor: '#787c7e',
        borderColor:  '#787c7e',
      };
    }
    return {
      backgroundColor: background. cardColor,
      borderColor:  background.borderColor,
    };
  };

  const getKeyTextStyle = (letter: string) => {
    if (isLetterGuessed(letter)) {
      return { color: '#fff' };
    }
    return { color: background.textColor };
  };

  return (
    <View style={styles.container}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row. map((letter) => {
            const isGuessed = isLetterGuessed(letter);
            return (
              <TouchableOpacity
                key={letter}
                style={[
                  styles. key,
                  getKeyStyle(letter),
                  isGuessed && styles.keyGuessed,
                ]}
                onPress={() => onKeyPress(letter)}
                disabled={disabled || isGuessed}
                activeOpacity={0.7}
              >
                <Text style={[styles. keyText, getKeyTextStyle(letter)]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const KEY_MARGIN = 4;
const KEY_WIDTH = (width - 20 - KEY_MARGIN * 20) / 10; // 10 keys in first row

const styles = StyleSheet. create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  key:  {
    width: KEY_WIDTH,
    height: KEY_WIDTH * 1.3,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal:  KEY_MARGIN / 2,
  },
  keyGuessed: {
    opacity: 0.9,
  },
  keyText: {
    fontSize:  16,
    fontWeight:  'bold',
  },
});

export default Keyboard;