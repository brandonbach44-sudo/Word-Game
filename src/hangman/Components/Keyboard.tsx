import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

interface KeyboardProps {
  onKeyPress: (letter: string) => void; // Function to call on key press
  disabled?: boolean; // Disable the keyboard when the game is over
}

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, disabled }) => {
  return (
    <View style={styles.container}>
      {ALPHABET.map((letter) => (
        <TouchableOpacity
          key={letter}
          style={[styles.key, disabled && styles.disabledKey]}
          onPress={() => !disabled && onKeyPress(letter)}
          disabled={disabled}
        >
          <Text style={styles.letter}>{letter.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 16,
  },
  key: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: '#fff',
    elevation: 2,
  },
  disabledKey: {
    backgroundColor: '#e0e0e0',
  },
  letter: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Keyboard;