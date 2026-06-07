import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type WordDisplayProps = {
  displayWord: string[];
  isWon?: boolean;
  isLost?: boolean;
  actualWord?: string;
};

const isLetter = (char: string) => /[a-zA-Z]/.test(char);
const isPunctuation = (char: string) => char !== ' ' && !isLetter(char);

function buildLines(letters: string[], maxPerLine: number): string[][] {
  if (letters.length === 0) return [];
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentWord: string[] = [];

  const flushWord = () => {
    if (currentWord.length === 0) return;
    const lineCount = currentLine.filter(c => c !== ' ').length;
    const wordCount = currentWord.length;
    if (lineCount + wordCount > maxPerLine && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentLine.push(...currentWord);
    currentWord = [];
  };

  for (const char of letters) {
    if (char === ' ') {
      flushWord();
      if (currentLine.length > 0) currentLine.push(' ');
    } else {
      // Break long single words mid-word if needed
      if (currentWord.length + currentLine.filter(c => c !== ' ').length >= maxPerLine && currentLine.length > 0) {
        flushWord();
      }
      currentWord.push(char);
    }
  }
  flushWord();

  if (currentLine.length > 0) {
    while (currentLine[currentLine.length - 1] === ' ') currentLine.pop();
    lines.push(currentLine);
  }

  return lines;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({
  displayWord,
  isWon = false,
  isLost = false,
  actualWord = '',
}) => {
  const { background } = useTheme();

  // Each slot: 34px wide + 8px total margin = 42px per slot
  const SLOT_W = 34;
  const SLOT_MARGIN = 4; // each side
  const SLOT_TOTAL = SLOT_W + SLOT_MARGIN * 2;
  const maxLettersPerLine = Math.max(5, Math.floor((SCREEN_WIDTH - 32) / SLOT_TOTAL));

  const getLetterColor = (originalIndex: number): string => {
    if (isWon) return COLORS.accent;
    if (isLost && displayWord[originalIndex] === '_') return COLORS.danger;
    return background.textColor;
  };

  const getDashColor = (originalIndex: number): string => {
    if (isWon) return COLORS.accent;
    if (isLost && displayWord[originalIndex] === '_') return COLORS.danger;
    return background.borderColor;
  };

  const lettersToShow = isLost && actualWord ? actualWord.split('') : displayWord;
  const lines = buildLines(lettersToShow, maxLettersPerLine);

  let globalIndex = 0;

  return (
    <View style={styles.container}>
      {lines.map((line, lineIdx) => {
        const lineStartIdx = globalIndex;
        globalIndex += line.filter(c => c !== ' ').length;

        return (
          <View key={lineIdx} style={styles.lineRow}>
            {line.map((char, charIdx) => {
              const idx = lineStartIdx + line.slice(0, charIdx).filter(c => c !== ' ').length;

              if (char === ' ') {
                return <View key={`s${charIdx}`} style={[styles.slot, styles.spaceSlot]} />;
              }

              if (isPunctuation(char)) {
                return (
                  <View key={`p${charIdx}`} style={[styles.slot, { borderBottomColor: 'transparent' }]}>
                    <Text style={[styles.letter, { color: background.textColor }]}>{char}</Text>
                  </View>
                );
              }

              const revealed = char !== '_';
              return (
                // The border IS the dash — part of the box, mathematically fixed
                <View
                  key={`c${charIdx}`}
                  style={[styles.slot, { borderBottomColor: getDashColor(idx) }]}
                >
                  <Text
                    style={[
                      styles.letter,
                      { color: revealed ? getLetterColor(idx) : 'transparent' },
                    ]}
                  >
                    {revealed ? char : 'A'}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  slot: {
    width: 34,
    height: 52,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'gray',
  },
  spaceSlot: {
    width: 14,
    borderBottomColor: 'transparent',
  },
  letter: {
    fontSize: 26,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default WordDisplay;
