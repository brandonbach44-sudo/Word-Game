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

function buildLines(letters: string[], maxPerLine: number): number[][] {
  // Returns arrays of indices into `letters`
  const lines: number[][] = [];
  let currentLine: number[] = [];
  let currentWordIndices: number[] = [];

  const flush = () => {
    if (currentWordIndices.length === 0) return;
    const lineLetters = currentLine.filter(i => i !== -1).length; // -1 = space
    if (lineLetters + currentWordIndices.length > maxPerLine && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentLine.push(...currentWordIndices);
    currentWordIndices = [];
  };

  for (let i = 0; i < letters.length; i++) {
    if (letters[i] === ' ') {
      flush();
      if (currentLine.length > 0) currentLine.push(-1); // -1 = space marker
    } else {
      currentWordIndices.push(i);
    }
  }
  flush();
  if (currentLine.length > 0) {
    while (currentLine[currentLine.length - 1] === -1) currentLine.pop();
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

  // 38px slot + 8px margin = 46px per slot
  const maxPerLine = Math.max(5, Math.floor((SCREEN_WIDTH - 32) / 46));

  // Always use actualWord characters so text content never changes — only color changes
  const source = actualWord || displayWord.map(c => (c === '_' ? 'W' : c)).join('');
  const sourceChars = source.split('');

  const lines = buildLines(sourceChars, maxPerLine);

  const letterColor = (idx: number): string => {
    if (isWon) return COLORS.accent;
    if (isLost && displayWord[idx] === '_') return COLORS.danger;
    return background.textColor;
  };

  const dashColor = (idx: number): string => {
    if (isWon) return COLORS.accent;
    if (isLost && displayWord[idx] === '_') return COLORS.danger;
    return background.borderColor;
  };

  const isRevealed = (idx: number): boolean => displayWord[idx] !== '_';

  return (
    <View style={styles.container}>
      {lines.map((lineIndices, lineIdx) => (
        <View key={lineIdx} style={styles.lineRow}>
          {lineIndices.map((charIdx, posIdx) => {
            // Space between words
            if (charIdx === -1) {
              return <View key={`sp${posIdx}`} style={styles.spaceGap} />;
            }

            const char = sourceChars[charIdx];

            if (isPunctuation(char)) {
              return (
                <View key={`pu${posIdx}`} style={[styles.slot, { borderBottomColor: 'transparent' }]}>
                  <Text style={[styles.letter, { color: background.textColor }]}>{char}</Text>
                </View>
              );
            }

            // The letter is ALWAYS rendered — only the color changes, never the content.
            // This means no text layout change occurs when a letter is revealed.
            const revealed = isRevealed(charIdx);
            return (
              <View
                key={`sl${posIdx}`}
                style={[styles.slot, { borderBottomColor: dashColor(charIdx) }]}
              >
                <Text
                  style={[
                    styles.letter,
                    { color: revealed ? letterColor(charIdx) : 'transparent' },
                  ]}
                >
                  {char}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
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
    marginBottom: 16,
  },
  slot: {
    width: 38,
    height: 54,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 7,
    borderBottomWidth: 3,
  },
  letter: {
    fontSize: 26,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  spaceGap: {
    width: 16,
    marginHorizontal: 4,
  },
});

export default WordDisplay;
