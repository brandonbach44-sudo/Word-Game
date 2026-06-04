// app/index.tsx
import { router } from 'expo-router';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/shared/ThemeContext';
import { FallingLetters } from '../src/shared/FallingLetters';

export default function Home() {
  const { background } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: background.backgroundColor }]}>
      <FallingLetters />
      <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={background.statusBar === 'dark' ? 'dark-content' : 'light-content'}
      />

      {/* Header with Settings Button */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <Text style={[styles.title, { color: background.textColor }]}>
          Word Games
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={[styles.settingsIcon, { color: background.textColor }]}>
            ⚙️
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: background.secondaryText }]}>
        Select a game to play
      </Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.gamesContainer}>
        {/* Word Builder */}
        <TouchableOpacity
          style={[
            styles.gameCard,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push('/wordbuilder')}
        >
          <Text style={[styles.gameTitle, { color: background.textColor }]}>
            Word Builder
          </Text>
          <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
            Build words from random letters before time runs out
          </Text>
        </TouchableOpacity>

        {/* Wordle */}
        <TouchableOpacity
          style={[
            styles.gameCard,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push('/wordle')}
        >
          <Text style={[styles.gameTitle, { color: background.textColor }]}>
            Wordle
          </Text>
          <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
            Guess the 5-letter word in 6 tries
          </Text>
        </TouchableOpacity>

        {/* Hangman */}
        <TouchableOpacity
          style={[
            styles.gameCard,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push('/hangman')}
        >
          <Text style={[styles.gameTitle, { color: background.textColor }]}>
            Hangman
          </Text>
          <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
            Guess the word before running out of attempts
          </Text>
        </TouchableOpacity>

        {/* Word Grid */}
        <TouchableOpacity
          style={[
            styles.gameCard,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push('/wordgrid')}
        >
          <Text style={[styles.gameTitle, { color: background.textColor }]}>
            Word Grid
          </Text>
          <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
            Swipe to connect letters and find hidden words
          </Text>
        </TouchableOpacity>

        {/* Word Search */}
        <TouchableOpacity
          style={[
            styles.gameCard,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push('/wordsearch')}

        >
          <Text style={[styles.gameTitle, { color: background.textColor }]}>
            Word Search
          </Text>
          <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
            Find themed words hidden in a letter grid
          </Text>
        </TouchableOpacity>

        {/* Coming Soon Games */}
        <TouchableOpacity
          style={[
            styles.gameCard,
            styles.comingSoon,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.gameTitle, { color: background.textColor }]}>
            Anagrams
          </Text>
          <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
            Rearrange letters to form new words
          </Text>
          <Text style={[styles.comingSoonBadge, { color: background.secondaryText }]}>
            Coming Soon
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.gameCard,
            styles.comingSoon,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.gameTitle, { color: background.textColor }]}>
            Crossword
          </Text>
          <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
            Solve classic crossword puzzles
          </Text>
          <Text style={[styles.comingSoonBadge, { color: background.secondaryText }]}>
            Coming Soon
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.gameCard,
            styles.comingSoon,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.gameTitle, { color: background.textColor }]}>
            Word Ladder
          </Text>
          <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
            Transform one word into another, one letter at a time
          </Text>
          <Text style={[styles.comingSoonBadge, { color: background.secondaryText }]}>
            Coming Soon
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerPlaceholder: {
    width: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  gamesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gameCard: {
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 15,
    borderWidth: 2,
  },
  comingSoon: {
    opacity: 0.5,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  comingSoonBadge: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 10,
  },
});
