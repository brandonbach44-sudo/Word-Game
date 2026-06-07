import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type WordDisplayProps = {
  displayWord: string[]; // Array of letters, '_' for unguessed, or punctuation
  isWon?: boolean;
  isLost?: boolean;
  actualWord?: string; // Show the actual word when game is lost
};

// Check if character is a letter
const isLetter = (char: string) => /[a-zA-Z]/.test(char);

// Check if character is punctuation (not letter, not space)
const isPunctuation = (char: string) => char !== ' ' && !isLetter(char);

// Smart word wrapper: breaks at word boundaries, handles long phrases
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
      if (currentLine.length > 0) {
        currentLine.push(' ');
      }
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
    if (currentLine[currentLine.length - 1] === ' ') {
      currentLine.pop();
    }
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

  const getLetterStyle = (letter: string, originalIndex: number) => {
    if (isWon) {
      return { color: COLORS.accent };
    }
    if (isLost) {
      if (displayWord[originalIndex] === '_') {
        return { color: COLORS.danger };
      }
      return { color: background.textColor };
    }
    return { color: background.textColor };
  };

  const lettersToShow = isLost && actualWord
    ? actualWord.split('')
    : displayWord;

  const lines = smartWrapLetters(lettersToShow, maxLettersPerLine);

  let globalIndex = 0;

  return (
    <View style={styles.container}>
      {lines.map((line, lineIdx) => (
        <View key={lineIdx} style={styles.wordContainer}>
          {line.map((char, charIdx) => {
            const originalIndex = globalIndex++;

            if (char === ' ') {
              return <View key={`${lineIdx}-${charIdx}`} style={styles.spaceGap} />;
            }

            if (isPunctuation(char)) {
              return (
                <View key={`${lineIdx}-${charIdx}`} style={styles.letterContainer}>
                  <Text style={[styles.letter, { color: background.textColor }]}>
                    {char}
                  </Text>
                  <View style={styles.underlineSpacer} />
                </View>
              );
            }

            // Render letter slot — always a visible character so height never changes
            const revealed = char !== '_';
            return (
              <View key={`${lineIdx}-${charIdx}`} style={styles.letterContainer}>
                <Text
                  style={[
                    styles.letter,
                    getLetterStyle(char, originalIndex),
                    !revealed && { opacity: 0 },
                  ]}
                >
                  {revealed ? char : 'A'}
                </Text>
                <View
                  style={[
                    styles.underline,
                    {
                      backgroundColor: isWon
                        ? COLORS.accent
                        : isLost && displayWord[originalIndex] === '_'
                        ? COLORS.danger
                        : background.borderColor,
                    },
                  ]}
                />
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
    paddingHorizontal: 15,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  letterContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  letter: {
    fontSize: 36,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    width: 36,
    lineHeight: 44,
  },
  underline: {
    height: 4,
    width: 28,
    borderRadius: 2,
    marginTop: 4,
  },
  underlineSpacer: {
    height: 4,
    width: 28,
    borderRadius: 2,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  spaceGap: {
    width: 20,
    marginHorizontal: 6,
  },
});

export default WordDisplay;
