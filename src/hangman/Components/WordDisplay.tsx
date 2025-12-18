import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';

type WordDisplayProps = {
  displayWord: string[]; // Array of letters or '_' for unguessed
  isWon?: boolean;
  isLost?: boolean;
  actualWord?: string; // Show the actual word when game is lost
};

// Smart word wrapper: will not break words in the middle, wraps only between words.
function smartWrapLetters(letters: string[]): (string[])[] {
  const WORD_SPACE = ' ';
  // Gather words as arrays of letters, separated by spaces
  let lines: string[][] = [];
  let currentLine: string[] = [];
  let currentWord: string[] = [];
  let maxLettersPerLine = 12; // Adjust for mobile view (can tweak)

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    if (char === WORD_SPACE) {
      if (currentWord.length) {
        if (currentLine.join('').length + currentWord.length > maxLettersPerLine && currentLine.length) {
          lines.push(currentLine);
          currentLine = [];
        }
        currentLine.push(...currentWord);
        currentWord = [];
      }
      currentLine.push(WORD_SPACE);
    } else {
      currentWord.push(char);
    }
  }
  if (currentWord.length) {
    if (currentLine.join('').length + currentWord.length > maxLettersPerLine && currentLine.length) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentLine.push(...currentWord);
  }
  if (currentLine.length) lines.push(currentLine);
  return lines;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({
  displayWord,
  isWon = false,
  isLost = false,
  actualWord = '',
}) => {
  const { background } = useTheme();

  // When lost, show the actual word with missed letters highlighted
  const getLetterStyle = (letter: string, index: number) => {
    if (isWon) {
      return { color: COLORS.accent };
    }
    if (isLost) {
      // If the letter was not guessed (was a blank), show in red
      if (displayWord[index] === '_') {
        return { color: COLORS.danger };
      }
      return { color: background.textColor };
    }
    return { color: background.textColor };
  };

  // Use this for "reveal": show solution at game's end with color cues
  const lettersToShow = isLost && actualWord
    ? actualWord.split('')
    : displayWord;

  // Smart wrapping: returns array-of-arrays, each inner array is a whole line (no word is ever split)
  const lines = smartWrapLetters(lettersToShow);

  return (
    <View style={styles.container}>
      {lines.map((line, lineIdx) => (
        <View
          key={lineIdx}
          style={[styles.wordContainer, { marginBottom: lineIdx < lines.length - 1 ? 2 : 0 }]}
        >
          {line.map((letter, index) =>
            letter === ' ' ? (
              <View key={index} style={styles.spaceGap} />
            ) : (
              <View key={index} style={styles.letterContainer}>
                <Text style={[styles.letter, getLetterStyle(letter, index)]}>
                  {letter !== '_' ? letter : ' '}
                </Text>
                <View
                  style={[
                    styles.underline,
                    {
                      backgroundColor: isWon
                        ? COLORS.accent
                        : isLost && displayWord[index] === '_'
                        ? COLORS.danger
                        : background.borderColor,
                      opacity: 1,
                    },
                  ]}
                />
              </View>
            )
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 8,
  },
  letterContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 6,
  },
  letter: {
    fontSize: 32,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    minWidth: 24,
    textAlign: 'center',
    marginBottom: 0,
  },
  underline: {
    height: 3,
    width: 24,
    borderRadius: 2,
    marginTop: 4,
  },
  spaceGap: {
    width: 28,
    marginHorizontal: 8,
  },
});

export default WordDisplay;