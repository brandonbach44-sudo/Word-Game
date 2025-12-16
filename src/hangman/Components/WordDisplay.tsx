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

  return (
    <View style={styles.container}>
      <View style={styles.wordContainer}>
        {lettersToShow.map((letter, index) => {
          // If this is a space, render nothing (just a gap)
          if (letter === ' ') {
            return <View key={index} style={styles.spaceGap} />;
          }

          // If not a space:
          const showLetter = letter !== '_';

          return (
            <View key={index} style={styles.letterContainer}>
              <Text style={[styles.letter, getLetterStyle(letter, index)]}>
                {showLetter ? letter : ' '}
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
          );
        })}
      </View>
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
    flexWrap: 'wrap',
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