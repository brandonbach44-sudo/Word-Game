import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_SLOT_WIDTH = 38;
const DEFAULT_SLOT_MARGIN = 4; // marginHorizontal each side
const DEFAULT_SLOT_TOTAL = DEFAULT_SLOT_WIDTH + DEFAULT_SLOT_MARGIN * 2; // 46
const DEFAULT_FONT_SIZE = 26;
const MIN_SLOT_WIDTH = 18;
const MIN_SLOT_MARGIN = 1;
const MIN_FONT_SIZE = 12;

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
    // Break a single word that's longer than maxPerLine across multiple lines
    let remaining = [...currentWordIndices];
    while (remaining.length > 0) {
      const lineCount = currentLine.filter(i => i !== -1).length;
      const spaceLeft = maxPerLine - lineCount;
      const chunk = remaining.splice(0, spaceLeft);
      currentLine.push(...chunk);
      if (remaining.length > 0) {
        lines.push(currentLine);
        currentLine = [];
      }
    }
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

  const availableWidth = SCREEN_WIDTH - 32; // paddingHorizontal 16 each side
  const maxPerLine = Math.max(5, Math.floor(availableWidth / DEFAULT_SLOT_TOTAL));

  // Always use actualWord characters so text content never changes — only color changes
  const source = actualWord || displayWord.map(c => (c === '_' ? 'W' : c)).join('');
  const sourceChars = source.split('');

  const lines = buildLines(sourceChars, maxPerLine);

  // Scale slot size down if the longest line is too wide to fit at default size
  const longestLineLength = lines.reduce(
    (max, line) => Math.max(max, line.filter(i => i !== -1).length),
    0
  );
  const fitsDefault = longestLineLength * DEFAULT_SLOT_TOTAL <= availableWidth;
  const slotTotal = fitsDefault
    ? DEFAULT_SLOT_TOTAL
    : Math.max(MIN_SLOT_WIDTH + MIN_SLOT_MARGIN * 2, availableWidth / longestLineLength);
  const ratio = slotTotal / DEFAULT_SLOT_TOTAL;
  const slotWidth = Math.max(MIN_SLOT_WIDTH, Math.floor(DEFAULT_SLOT_WIDTH * ratio));
  const slotMargin = Math.max(MIN_SLOT_MARGIN, Math.floor(DEFAULT_SLOT_MARGIN * ratio));
  const fontSize = Math.max(MIN_FONT_SIZE, Math.floor(DEFAULT_FONT_SIZE * ratio));

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
                <View key={`pu${posIdx}`} style={[styles.slot, { width: slotWidth, marginHorizontal: slotMargin, borderBottomColor: 'transparent' }]}>
                  <Text style={[styles.letter, { fontSize, color: background.textColor }]}>{char}</Text>
                </View>
              );
            }

            // The letter is ALWAYS rendered — only the color changes, never the content.
            // This means no text layout change occurs when a letter is revealed.
            const revealed = isRevealed(charIdx);
            return (
              <View
                key={`sl${posIdx}`}
                style={[styles.slot, { width: slotWidth, marginHorizontal: slotMargin, borderBottomColor: dashColor(charIdx) }]}
              >
                <Text
                  style={[
                    styles.letter,
                    { fontSize, color: revealed ? letterColor(charIdx) : 'transparent' },
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
    height: 54,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 7,
    borderBottomWidth: 3,
  },
  letter: {
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
