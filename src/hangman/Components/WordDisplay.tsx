import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Slot dimensions — everything is derived from these two constants
const SLOT_WIDTH = 32;
const SLOT_H_MARGIN = 4;
const SLOT_TOTAL = SLOT_WIDTH + SLOT_H_MARGIN * 2; // 40px per slot
const LETTERS_ROW_HEIGHT = 50;
const DASH_HEIGHT = 4;
const DASH_GAP = 5; // gap between letter row and dash row

type WordDisplayProps = {
  displayWord: string[];
  isWon?: boolean;
  isLost?: boolean;
  actualWord?: string;
};

const isLetter = (char: string) => /[a-zA-Z]/.test(char);
const isPunctuation = (char: string) => char !== ' ' && !isLetter(char);

function smartWrapLetters(letters: string[], maxPerLine: number): (string[])[] {
  if (letters.length === 0) return [];
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentWord: string[] = [];

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    if (char === ' ') {
      if (currentWord.length > 0) {
        const lineLetterCount = currentLine.filter(c => isLetter(c) || c === '_').length;
        const wordLetterCount = currentWord.filter(c => isLetter(c) || c === '_').length;
        if (lineLetterCount + wordLetterCount > maxPerLine && currentLine.length > 0) {
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
    const lineLetterCount = currentLine.filter(c => isLetter(c) || c === '_').length;
    const wordLetterCount = currentWord.filter(c => isLetter(c) || c === '_').length;
    if (lineLetterCount + wordLetterCount > maxPerLine && currentLine.length > 0) {
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

  // Available width minus container padding (15px each side)
  const availableWidth = SCREEN_WIDTH - 30;
  const maxLettersPerLine = Math.max(5, Math.floor(availableWidth / SLOT_TOTAL));

  const getLetterColor = (char: string, originalIndex: number): string => {
    if (isWon) return COLORS.accent;
    if (isLost) {
      if (displayWord[originalIndex] === '_') return COLORS.danger;
      return background.textColor;
    }
    return background.textColor;
  };

  const getDashColor = (originalIndex: number): string => {
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
            {/*
              Single row of slots. Each slot has a fixed width and height.
              Inside each slot, the letter and dash are both absolutely
              positioned — so neither can ever affect the other's position.
            */}
            <View style={styles.wordRow}>
              {line.map((char, charIdx) => {
                const idx =
                  lineStartIndex +
                  line.slice(0, charIdx).filter(c => c !== ' ').length;

                if (char === ' ') {
                  return (
                    <View key={`sp-${charIdx}`} style={styles.spaceGap} />
                  );
                }

                if (isPunctuation(char)) {
                  return (
                    <View key={`pu-${charIdx}`} style={styles.slot}>
                      <Text style={[styles.letter, { color: background.textColor }]}>
                        {char}
                      </Text>
                    </View>
                  );
                }

                const revealed = char !== '_';
                return (
                  <View key={`sl-${charIdx}`} style={styles.slot}>
                    {/* Dash — absolutely pinned to bottom of slot */}
                    <View
                      style={[
                        styles.dash,
                        {
                          backgroundColor: isWon
                            ? COLORS.accent
                            : isLost && displayWord[idx] === '_'
                            ? COLORS.danger
                            : background.borderColor,
                        },
                      ]}
                    />
                    {/* Letter — absolutely positioned above dash, invisible when unrevealed */}
                    <Text
                      style={[
                        styles.letter,
                        {
                          color: revealed
                            ? getLetterColor(char, idx)
                            : 'transparent',
                        },
                      ]}
                    >
                      {revealed ? char : 'A'}
                    </Text>
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
    marginBottom: 12,
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  slot: {
    width: SLOT_WIDTH,
    height: LETTERS_ROW_HEIGHT + DASH_GAP + DASH_HEIGHT,
    marginHorizontal: SLOT_H_MARGIN,
  },
  letter: {
    position: 'absolute',
    bottom: DASH_GAP + DASH_HEIGHT,
    left: 0,
    right: 0,
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    height: LETTERS_ROW_HEIGHT,
    textAlignVertical: 'bottom',
  },
  dash: {
    position: 'absolute',
    bottom: 0,
    left: 2,
    right: 2,
    height: DASH_HEIGHT,
    borderRadius: 2,
  },
  spaceGap: {
    width: 16,
    marginHorizontal: 4,
  },
});

export default WordDisplay;
