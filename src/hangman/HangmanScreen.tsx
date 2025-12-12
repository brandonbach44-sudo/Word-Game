import { useRouter } from 'expo-router'; // Import the router for navigation
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function HangmanScreen() {
  const router = useRouter(); // Get the router instance

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hangman Game</Text>
      <Text style={styles.description}>
        Guess the word before you run out of attempts!
      </Text>
      <Button
        title="Back to Main Menu"
        onPress={() => router.push('/')} // Navigate back to the main menu
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
  },
});