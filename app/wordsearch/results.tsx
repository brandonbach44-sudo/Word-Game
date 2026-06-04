// app/wordsearch/results.tsx

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SoundManager } from '../../src/shared/SoundManager';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';

export default function WordSearchResultsScreen() {
  const { background } = useTheme();
  const params = useLocalSearchParams();

  const score = parseInt(params.score as string) || 0;
  const foundWords = parseInt(params.foundWords as string) || 0;
  const totalWords = parseInt(params.totalWords as string) || 0;
  const allFound = params.allFound === 'true';
  const isDaily = params.isDaily === 'true';

  // Calculate percentage
  const percentage = totalWords > 0 ? Math.round((foundWords / totalWords) * 100) : 0;

  // Extract time from params if available
  const timeString = (params.time as string) || '0:00';

  // Play game over sound
  useEffect(() => {
    SoundManager.gameOver();
  }, []);

  const handlePlayAgain = () => {
    if (isDaily) {
      router.push('/wordsearch/daily');
    } else {
      router.push('/wordsearch/play');
    }
  };

  const handleMainMenu = () => {
    router.push('/wordsearch');
  };

  const getResultMessage = () => {
    if (allFound) {
      return 'Perfect! All words found!';
    }
    if (percentage >= 75) {
      return 'Excellent job!';
    }
    if (percentage >= 50) {
      return 'Good effort!';
    }
    if (percentage >= 25) {
      return 'Nice try!';
    }
    return 'Keep practicing!';
  };

  const getResultColor = () => {
    if (allFound) return COLORS.accent;
    if (percentage >= 75) return '#4CAF50';
    if (percentage >= 50) return '#2196F3';
    if (percentage >= 25) return '#FF9800';
    return '#F44336';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: background.textColor }]}>
            {isDaily ? 'Daily Challenge' : 'Word Search'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: background.secondaryText }]}>
            Results
          </Text>
        </View>

        {/* Result Message */}
        <View style={styles.messageContainer}>
          <Text
            style={[
              styles.resultMessage,
              {
                color: getResultColor(),
              },
            ]}
          >
            {getResultMessage()}
          </Text>
        </View>

        {/* Percentage Circle */}
        <View style={styles.percentageContainer}>
          <View
            style={[
              styles.percentageCircle,
              {
                borderColor: getResultColor(),
                backgroundColor: background.cardColor,
              },
            ]}
          >
            <Text
              style={[
                styles.percentageNumber,
                {
                  color: getResultColor(),
                },
              ]}
            >
              {percentage}%
            </Text>
            <Text style={[styles.percentageLabel, { color: background.secondaryText }]}>
              Complete
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Words Found */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: background.cardColor,
                borderColor: background.borderColor,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: background.secondaryText }]}>
              Words Found
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: background.textColor,
                },
              ]}
            >
              {foundWords}/{totalWords}
            </Text>
          </View>

          {/* Score */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: background.cardColor,
                borderColor: background.borderColor,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: background.secondaryText }]}>Score</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: COLORS.accent,
                },
              ]}
            >
              {score}
            </Text>
          </View>

          {/* Time */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: background.cardColor,
                borderColor: background.borderColor,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: background.secondaryText }]}>Time</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: background.textColor,
                },
              ]}
            >
              {timeString}
            </Text>
          </View>

          {/* Mode */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: background.cardColor,
                borderColor: background.borderColor,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: background.secondaryText }]}>Mode</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: background.textColor,
                },
              ]}
            >
              {isDaily ? 'Daily' : 'Classic'}
            </Text>
          </View>
        </View>

        {/* Achievement Badge (if all found) */}
        {allFound && (
          <View
            style={[
              styles.achievementContainer,
              {
                backgroundColor: COLORS.accent,
              },
            ]}
          >
            <Text style={styles.achievementEmoji}>🏆</Text>
            <Text style={styles.achievementText}>Perfect Score!</Text>
            <Text style={styles.achievementSubtext}>You found all the words!</Text>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBackground,
              {
                backgroundColor: background.borderColor,
              },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${percentage}%`,
                  backgroundColor: getResultColor(),
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: background.secondaryText }]}>
            {foundWords} words of {totalWords} found
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.buttonContainer,
          {
            borderTopColor: background.borderColor,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            {
              backgroundColor: background.cardColor,
              borderColor: background.borderColor,
            },
          ]}
          onPress={handleMainMenu}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: background.textColor,
              },
            ]}
          >
            Main Menu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            {
              backgroundColor: COLORS.accent,
            },
          ]}
          onPress={handlePlayAgain}
        >
          <Text style={styles.primaryButtonText}>
            {isDaily ? 'Back to Daily' : 'Play Again'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultMessage: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  percentageCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  percentageLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  achievementContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  achievementEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  achievementSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
