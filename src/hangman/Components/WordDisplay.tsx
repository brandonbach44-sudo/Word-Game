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

function smartWrapLetters(letters: string[], maxPerLine: number = 10): (string[])[] {
  if (letters.length === 0) return [];
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentWord: string[] = [];

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    if (char === ' ') {
      if (currentWord.length > 0) {
        const currentLineLetters = currentLine.filter(c => isLetter(c) || c === '_').length;
        const currentWordLetters = currentWord.filter(c => isLetter(c) || c === '_').length;
        if (currentLineLetters + currentWordLetters > maxPerLine && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = [...currentWord];
        } else {
          currentLine.push(...currentWord);
        }
        currentWord = [];
      }
      if (currentLine.length > 0) currentLine.push(' ');
    } else {
      currentWord.push(char);
    }
  }

  if (currentWord.length > 0) {
    const currentLineLetters = currentLine.filter(c => isLetter(c) || c === '_').length;
    const currentWordLetters = currentWord.filter(c => isLetter(c) || c === '_').length;
    if (currentLineLetters + currentWordLetters > maxPerLine && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [...currentWord];
    } else {
      currentLine.push(...currentWord);
    }
  }

  if (currentLine.length > 0) {
    if (currentLine[currentLine.length - 1] === ' ') currentLine.pop();
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
  const maxLettersPerLine = Math.max(6, Math.floor((SCREEN_WIDTH - 30) / 40));

  const getLetterColor = (char: string, originalIndex: number) => {
    if (isWon) return COLORS.accent;
    if (isLost) {
      if (displayWord[originalIndex] === '_') return COLORS.danger;
      return background.textColor;
    }
    return background.textColor;
  };

  const getDashColor = (originalIndex: number) => {
    if (isWon) return COLORS.accent;
    if (isLost && displayWord[originalIndex] === '_') return COLORS.danger;
    return background.borderColor;
  };

  const lettersToShow = isLost && actualWord ? actualWord.split('') : displayWord;
  const lines = smartWrapLetters(lettersToShow, maxLettersPerLine);

  let globalIndex = 0;

  return (
    <View style={styles.container}>
      {lines.map((line, lineIdx) => {
        const lineStartIndex = globalIndex;
        globalIndex += line.filter(c => c !== ' ').length;

        return (
          <View key={lineIdx} style={styles.lineWrapper}>
            {/* Letters row — fixed height, so dashes row Y is always the same */}
            <View style={styles.lettersRow}>
              {line.map((char, charIdx) => {
                const idx = lineStartIndex + line.slice(0, charIdx).filter(c => c !== ' ').length;
                if (char === ' ') {
                  return <View key={`l-space-${charIdx}`} style={styles.spaceGap} />;
                }
                if (isPunctuation(char)) {
                  return (
                    <Text key={`l-punc-${charIdx}`} style={[styles.letter, { color: background.textColor }]}>
                      {char}
                    </Text>
                  );
                }
                const revealed = char !== '_';
                return (
                  <Text
                    key={`l-${charIdx}`}
                    style={[
                      styles.letter,
                      { color: revealed ? getLetterColor(char, idx) : 'transparent' },
                    ]}
                  >
                    {revealed ? char : 'A'}
                  </Text>
                );
              })}
            </View>

            {/* Dashes row — completely independent */}
            <View style={styles.dashesRow}>
              {line.map((char, charIdx) => {
                const idx = lineStartIndex + line.slice(0, charIdx).filter(c => c !== ' ').length;
                if (char === ' ') {
                  return <View key={`d-space-${charIdx}`} style={styles.spaceGap} />;
                }
                if (isPunctuation(char)) {
                  return <View key={`d-punc-${charIdx}`} style={styles.dashSlot} />;
                }
                return (
                  <View key={`d-${charIdx}`} style={styles.dashSlot}>
                    <View style={[styles.underline, { backgroundColor: getDashColor(idx) }]} />
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  lineWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  lettersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 52,
  },
  dashesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 12,
    marginTop: 4,
  },
  letter: {
    fontSize: 36,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    width: 36,
    marginHorizontal: 4,
  },
  dashSlot: {
    width: 36,
    height: 12,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  underline: {
    height: 4,
    width: 28,
    borderRadius: 2,
  },
  spaceGap: {
    width: 20,
    marginHorizontal: 6,
  },
});

export default WordDisplay;
