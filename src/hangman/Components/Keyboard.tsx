import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { getSemanticColors } from '../../shared/semanticColors';
import { HapticManager } from '../../shared/HapticManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Sizing matches Word Ladder's keyboard exactly (the standard for every
// game with an on-screen keyboard) — only the extra buttons around it
// (Guess the Word, Enter) are game-specific.
const HORIZONTAL_PADDING = 6;
const KEY_GAP = 6;

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
  const { background, colorBlindMode } = useTheme();

  const themeBg = background. backgroundColor ??  '#f5f0e6';
  const themeText = background.textColor;
  const themeBorder = background.borderColor;
  const isDark = background.isDark;

  // Shared with every other game via semanticColors.ts -- same values as
  // before, one source instead of a per-file copy.
  const semantic = getSemanticColors(colorBlindMode);
  const correctBg = semantic.correct;
  const correctBorder = semantic.correctBorder;

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
    // Correct guess
    if (isLetterCorrect(letter)) {
      return {
        backgroundColor: correctBg,
        borderColor: correctBorder,
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
          // Weighted sizing (BACK counts as 1.6 keys) — same formula as
          // Word Ladder/Furdle, so BACK is wider without the row overflowing
          // past the available width.
          const weights = row.map((k) => (k === 'BACK' ? 1.6 : 1));
          const totalWeight = weights.reduce((a, b) => a + b, 0);
          const totalGaps = KEY_GAP * (row.length - 1);
          const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - totalGaps;
          const unit = availableWidth / totalWeight;

          return (
            <View key={rowIndex} style={styles. keyRow}>
              {row.map((key, idx) => {
                const keyWidth = unit * weights[idx];
                if (key === 'BACK') {
                  return (
                    <Pressable
                      key={`back-${rowIndex}`}
                      onPress={onBack}
                      disabled={disabled || ! selectedLetter}
                      style={({ pressed }) => [
                        styles.key,
                        {
                          width: keyWidth,
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
                    onPress={() => {
                      // Letter selection only. Enter deliberately has no tick —
                      // the correct/wrong feedback fires on commit instead, and
                      // two pulses for one action is the pattern to avoid.
                      HapticManager.hangman.letterTap();
                      onKeyPress(key);
                    }}
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
    marginVertical: 3,
  },
  key: {
    height: 52,
    borderRadius: 8,
    justifyContent:  'center',
    alignItems: 'center',
    marginHorizontal: KEY_GAP / 2,
    borderWidth: 1,
  },
  backKey: {
    minWidth: 60,
  },
  keyLabel:  {
    fontSize: 17,
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