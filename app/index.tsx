import { router } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/shared/ThemeContext';
import { COLORS } from '../src/shared/theme';

export default function Home() {
  const { background } = useTheme();

  const games = [
    {
      id: 'wordbuilder',
      title: 'Word Builder',
      description: 'Build words from random letters before time runs out',
      route: '/wordbuilder',
      available: true,
    },
    {
      id: 'wordle',
      title: 'Wordle',
      description: 'Guess the 5-letter word in 6 tries',
      route: '/wordle',
      available: true,
    },
    {
      id: 'hangman',
      title: 'Hangman',
      description: 'Guess the word before running out of attempts',
      route: '/hangman',
      available: true,
    },
    {
      id: 'anagrams',
      title: 'Anagrams',
      description: 'Rearrange letters to form new words',
      route: null,
      available: false,
    },
    {
      id: 'crossword',
      title: 'Crossword',
      description: 'Solve classic crossword puzzles',
      route: null,
      available: false,
    },
    {
      id: 'wordladder',
      title: 'Word Ladder',
      description: 'Transform one word into another, one letter at a time',
      route: null,
      available: false,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <Text style={[styles.title, { color: background.textColor }]}>Word Games</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <View style={[styles.gearIcon, { borderColor: background.secondaryText }]}>
            <Text style={[styles.gearText, { color: background.secondaryText }]}>⚙</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.subtitle, { color: background.secondaryText }]}>
        Select a game to play
      </Text>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gamesContainer}
        showsVerticalScrollIndicator={false}
      >
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameCard,
              {
                backgroundColor: background.cardColor,
                borderColor: game.available ? COLORS.accent : background.borderColor,
              },
              !game.available && styles.gameCardDisabled,
            ]}
            onPress={() => game.route && router.push(game.route as any)}
            disabled={!game.available}
            activeOpacity={0.7}
          >
            <Text style={[styles.gameTitle, { color: background.textColor }]}>
              {game.title}
            </Text>
            <Text style={[styles.gameDescription, { color: background.secondaryText }]}>
              {game.description}
            </Text>
            {!game.available && (
              <Text style={[styles.comingSoonBadge, { color: background.secondaryText }]}>
                Coming Soon
              </Text>
            )}
          </TouchableOpacity>
        ))}
        
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearText: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  gamesContainer: {
    paddingBottom: 20,
  },
  gameCard: {
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 15,
    borderWidth: 2,
  },
  gameCardDisabled: {
    opacity: 0.6,
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
