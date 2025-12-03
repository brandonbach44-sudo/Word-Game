import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MoreGames() {
  const upcomingGames = [
    { name: 'Word Search', icon: 'search', description: 'Find hidden words in a grid' },
    { name: 'Crossword', icon: 'grid', description: 'Classic crossword puzzles' },
    { name: 'Anagram', icon: 'shuffle', description: 'Unscramble the letters' },
    { name: 'Hangman', icon: 'person', description: 'Guess the word before time runs out' },
    { name: 'Spelling Bee', icon: 'trophy', description: 'How many words can you spell?' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>More Games</Text>
      <Text style={styles.subtitle}>Coming Soon!</Text>
      
      <View style={styles.gamesList}>
        {upcomingGames.map((game, index) => (
          <TouchableOpacity key={index} style={styles.gameCard} disabled>
            <View style={styles.iconContainer}>
              <Ionicons name={game.icon as any} size={32} color="#4ecca3" />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
            </View>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.footerText}>
        New games are being developed!{'\n'}Check back soon.
      </Text>
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
    color: '#eee',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4ecca3',
    textAlign: 'center',
    marginBottom: 30,
  },
  gamesList: {
    gap: 15,
  },
  gameCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#eee',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: '#888',
  },
  lockIcon: {
    padding: 10,
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
    lineHeight: 22,
  },
});
