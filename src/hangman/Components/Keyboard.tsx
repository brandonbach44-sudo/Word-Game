import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_PADDING = 16;
const KEY_GAP = 4;

// Keyboard layout matching Wordle (with BACK key)
const KEYBOARD_ROWS: string[][] = [
  'QWERTYUIOP'. split(''),
  'ASDFGHJKL'.split(''),
  [...'ZXCVBNM'.split(''), 'BACK'],
];

type KeyboardProps = {
  selectedLetter:  string | null;
  onKeyPress: (letter: string) => void;
  onEnter: () => void;
  onBack: () => void;
  isLetterGuessed: (letter: string) => boolean;
  isLetterCorrect: (letter: string) => boolean;
  isLetterIncorrect: (letter: string) => boolean;
  disabled?: boolean;
};

export const Keyboard: React.FC<KeyboardProps> = ({
  selectedLetter,
  onKeyPress,
  onEnter,
  onBack,
  isLetterGuessed,
  isLetterCorrect,
  isLetterIncorrect,
  disabled = false,
}) => {
  const { background } = useTheme();

  const themeBg = background. backgroundColor ??  '#f5f0e6';
  const themeText = background.textColor;
  const themeBorder = background.borderColor;
  const isDark = background.isDark;

  // Matching Wordle's subtle colors
  const subtleBorder = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)';
  const softKeyBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const getKeyStyle = (letter: string) => {
    // Selected letter highlight
    if (selectedLetter === letter) {
      return {
        backgroundColor: themeBorder,
        borderColor: themeBorder,
      };
    }
    // Correct guess (green)
    if (isLetterCorrect(letter)) {
      return {
        backgroundColor: '#22c55e',
        borderColor: '#16a34a',
      };
    }
    // Incorrect guess (gray)
    if (isLetterIncorrect(letter)) {
      return {
        backgroundColor: '#9ca3af',
        borderColor: '#6b7280',
      };
    }
    // Default unused key
    return {
      backgroundColor: softKeyBg,
      borderColor: subtleBorder,
    };
  };

  const getKeyTextColor = (letter: string) => {
    if (selectedLetter === letter) {
      return themeBg;
    }
    if (isLetterGuessed(letter)) {
      return '#f9fafb';
    }
    return themeText;
  };

  return (
    <View style={styles.container}>
      {/* Keyboard Rows */}
      <View style={styles.keyboardContainer}>
        {KEYBOARD_ROWS.map((row, rowIndex) => {
          const rowLength = row.length;
          const totalGaps = KEY_GAP * (rowLength - 1);
          const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - totalGaps;
          const keyWidth = availableWidth / rowLength;

          return (
            <View key={rowIndex} style={styles. keyRow}>
              {row. map((key) => {
                if (key === 'BACK') {
                  return (
                    <Pressable
                      key={`back-${rowIndex}`}
                      onPress={onBack}
                      disabled={disabled || ! selectedLetter}
                      style={({ pressed }) => [
                        styles.key,
                        styles.backKey,
                        {
                          width: keyWidth * 1.6,
                          opacity: pressed ? 0.72 : disabled || !selectedLetter ? 0.5 : 1,
                          backgroundColor: softKeyBg,
                          borderColor: subtleBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.keyLabel, { color: themeText }]}>⌫</Text>
                    </Pressable>
                  );
                }

                const isGuessed = isLetterGuessed(key);
                const keyStyle = getKeyStyle(key);
                const keyTextColor = getKeyTextColor(key);

                return (
                  <Pressable
                    key={key}
                    onPress={() => onKeyPress(key)}
                    disabled={disabled || isGuessed}
                    style={({ pressed }) => [
                      styles.key,
                      {
                        width: keyWidth,
                        backgroundColor: keyStyle.backgroundColor,
                        borderColor: keyStyle.borderColor,
                        transform: [{ scale: pressed ? 0.94 : 1 }],
                        opacity: isGuessed && selectedLetter !== key ? 0.9 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.keyLabel, { color: keyTextColor }]}>{key}</Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Enter Button */}
      <View style={styles.enterContainer}>
        <Pressable
          onPress={onEnter}
          disabled={disabled || !selectedLetter}
          style={({ pressed }) => [
            styles.enterButton,
            {
              borderColor: themeBorder,
              backgroundColor: themeBg,
              opacity: pressed ? 0.75 : disabled || !selectedLetter ? 0.5 : 1,
            },
          ]}
        >
          <Text style={[styles.enterLabel, { color: themeBorder }]}>ENTER</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  keyboardContainer: {
    marginTop: 4,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 2,
  },
  key: {
    minHeight: 44,
    borderRadius: 8,
    justifyContent:  'center',
    alignItems: 'center',
    marginHorizontal: KEY_GAP / 2,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  backKey: {
    minWidth: 60,
  },
  keyLabel:  {
    fontSize: 16,
    fontWeight: '900',
  },
  enterContainer:  {
    marginTop: 6,
    alignItems: 'center',
  },
  enterButton: {
    borderRadius: 999,
    paddingVertical: 10,
    borderWidth: 2,
    width: '100%',
    alignItems: 'center',
  },
  enterLabel:  {
    fontSize: 16,
    fontWeight: '900',
  },
});

export default Keyboard;