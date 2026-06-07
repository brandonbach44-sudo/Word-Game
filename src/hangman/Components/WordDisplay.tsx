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
      // End of word - check if we should wrap
      if (currentWord.length > 0) {
        // Count only letters for line length calculation
        const currentLineLetters = currentLine.filter(c => isLetter(c) || c === '_').length;
        const currentWordLetters = currentWord.filter(c => isLetter(c) || c === '_').length;
        
        if (currentLineLetters + currentWordLetters > maxPerLine && currentLine.length > 0) {
          // Wrap to new line
          lines.push(currentLine);
          currentLine = [...currentWord];
        } else {
          currentLine.push(...currentWord);
        }
        currentWord = [];
      }
      // Add space after word (if line has content)
      if (currentLine.length > 0) {
        currentLine.push(' ');
      }
    } else {
      currentWord.push(char);
    }
  }
  
  // Handle remaining word
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
  
  // Add final line
  if (currentLine.length > 0) {
    // Remove trailing space
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

  // Calculate max letters per line based on screen width
  // Each letter takes about 36px (28 min-width + 8 margin)
  const maxLettersPerLine = Math.max(6, Math.floor((SCREEN_WIDTH - 30) / 40));

  // When lost, show the actual word with missed letters highlighted
  const getLetterStyle = (letter: string, originalIndex: number) => {
    if (isWon) {
      return { color: COLORS.accent };
    }
    if (isLost) {
      // If the letter was not guessed (was a blank), show in red
      if (displayWord[originalIndex] === '_') {
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

  // Smart wrapping
  const lines = smartWrapLetters(lettersToShow, maxLettersPerLine);

  // Track original index for proper styling on game loss
  let globalIndex = 0;

  return (
    <View style={styles.container}>
      {lines.map((line, lineIdx) => (
        <View
          key={lineIdx}
          style={styles.wordContainer}
        >
          {line.map((char, charIdx) => {
            const originalIndex = globalIndex++;
            
            // Space between words
            if (char === ' ') {
              return <View key={`${lineIdx}-${charIdx}`} style={styles.spaceGap} />;
            }
            
            // Punctuation (apostrophe, hyphen, etc.) - show without underline
            if (isPunctuation(char)) {
              return (
                <View key={`${lineIdx}-${charIdx}`} style={styles.punctuationContainer}>
                  <Text style={[styles.punctuation, { color: background.textColor }]}>
                    {char}
                  </Text>
                </View>
              );
            }
            
            // Regular letter or blank
            return (
              <View key={`${lineIdx}-${charIdx}`} style={styles.letterContainer}>
                <Text style={[styles.letter, getLetterStyle(char, originalIndex)]}>
                  {char !== '_' ? char : ' '}
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
  punctuationContainer: {
    alignItems: 'center',
    marginHorizontal: 2,
    height: 72,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  punctuation: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  spaceGap: {
    width: 20,
    marginHorizontal: 6,
  },
});

export default WordDisplay;
