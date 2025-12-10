import { router } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>Word Games</Text>
      <Text style={styles.subtitle}>Select a game to play</Text>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gamesContainer}
      >
        {/* Word Builder – existing game */}
        <TouchableOpacity 
          style={styles.gameCard}
          onPress={() => router.push('/wordbuilder')}
        >
          <Text style={styles.gameTitle}>Word Builder</Text>
          <Text style={styles.gameDescription}>
            Build words from random letters before time runs out
          </Text>
        </TouchableOpacity>

        {/* NEW: Wordle – now actually on the menu */}
        <TouchableOpacity 
          style={styles.gameCard}
          onPress={() => router.push('/wordle')}
        >
          <Text style={styles.gameTitle}>Wordle</Text>
          <Text style={styles.gameDescription}>
            Guess the 5-letter word in 6 tries
          </Text>
        </TouchableOpacity>

        {/* Coming soon games */}
        <View style={[styles.gameCard, styles.comingSoon]}>
          <Text style={styles.gameTitle}>Word Search</Text>
          <Text style={styles.gameDescription}>
            Find hidden words in a grid of letters
          </Text>
          <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        </View>

        <View style={[styles.gameCard, styles.comingSoon]}>
          <Text style={styles.gameTitle}>Anagrams</Text>
          <Text style={styles.gameDescription}>
            Rearrange letters to form new words
          </Text>
          <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        </View>

        <View style={[styles.gameCard, styles.comingSoon]}>
          <Text style={styles.gameTitle}>Crossword</Text>
          <Text style={styles.gameDescription}>
            Solve classic crossword puzzles
          </Text>
          <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        </View>

        <View style={[styles.gameCard, styles.comingSoon]}>
          <Text style={styles.gameTitle}>Word Ladder</Text>
          <Text style={styles.gameDescription}>
            Transform one word into another, one letter at a time
          </Text>
          <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        </View>

        <View style={[styles.gameCard, styles.comingSoon]}>
          <Text style={styles.gameTitle}>Hangman</Text>
          <Text style={styles.gameDescription}>
            Guess the word before running out of attempts
          </Text>
          <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  gamesContainer: {
    paddingBottom: 40,
  },
  gameCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4ecca3',
  },
  comingSoon: {
    borderColor: '#333',
    opacity: 0.6,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  comingSoonBadge: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
});
