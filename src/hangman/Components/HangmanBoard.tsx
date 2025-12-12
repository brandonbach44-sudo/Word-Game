import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HangmanBoardProps {
  revealedPhrase: string; // Displayed phrase with blanks (_ _ _ _ e)
}

const HangmanBoard: React.FC<HangmanBoardProps> = ({ revealedPhrase }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{revealedPhrase}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 16,
  },
  text: {
    fontSize: 32,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default HangmanBoard;