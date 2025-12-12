import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';

type GameStatusProps = {
  isVisible: boolean;
  isWon: boolean;
  word: string;
  category: string;
  incorrectGuesses: number;
  totalGuesses: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
};

export const GameStatus: React. FC<GameStatusProps> = ({
  isVisible,
  isWon,
  word,
  category,
  incorrectGuesses,
  totalGuesses,
  onPlayAgain,
  onBackToMenu,
}) => {
  const { background } = useTheme();

  if (!isVisible) return null;

  const statusColor = isWon ? COLORS. accent : COLORS.danger;
  const title = isWon ? '🎉 You Won!' : '😔 Game Over';
  const subtitle = isWon
    ? 'Great job! You guessed the word!'
    : "Better luck next time! ";

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: background.cardColor }]}>
          {/* Title */}
          <Text style={[styles.title, { color: statusColor }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: background.secondaryText }]}>
            {subtitle}
          </Text>

          {/* Word Reveal */}
          <View style={[styles.wordRevealContainer, { borderColor: background.borderColor }]}>
            <Text style={[styles.wordLabel, { color: background.secondaryText }]}>
              The word was
            </Text>
            <Text style={[styles.word, { color: background.textColor }]}>
              {word}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles. statValue, { color: background.textColor }]}>
                {totalGuesses}
              </Text>
              <Text style={[styles.statLabel, { color: background.secondaryText }]}>
                Total Guesses
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: background.borderColor }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: background.textColor }]}>
                {incorrectGuesses}
              </Text>
              <Text style={[styles.statLabel, { color: background.secondaryText }]}>
                Incorrect
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: background.borderColor }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: background.textColor }]}>
                {6 - incorrectGuesses}
              </Text>
              <Text style={[styles.statLabel, { color: background.secondaryText }]}>
                Lives Left
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.playAgainButton, { backgroundColor: statusColor }]}
              onPress={onPlayAgain}
              activeOpacity={0.8}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuButton, { borderColor: background.borderColor }]}
              onPress={onBackToMenu}
              activeOpacity={0.8}
            >
              <Text style={[styles.menuButtonText, { color: background.textColor }]}>
                Back to Menu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems:  'center',
    padding: 20,
  },
  container: {
    width:  '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle:  {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  wordRevealContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  wordLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  word: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical:  6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider:  {
    width: 1,
    height: '100%',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  playAgainButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  playAgainText:  {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GameStatus;