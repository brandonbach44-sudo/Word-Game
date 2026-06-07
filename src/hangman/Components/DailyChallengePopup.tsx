import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';
import { formatDisplayDate } from '../utils/dailyChallenge';

type DailyChallengePopupProps = {
  visible: boolean;
  won: boolean;
  word: string;
  category: string;
  streak: number;
  bestStreak: number;
  incorrectCount: number;
  maxAttempts: number;
  onBackToMenu: () => void;
};

export const DailyChallengePopup: React.FC<DailyChallengePopupProps> = ({
  visible,
  won,
  word,
  category,
  streak,
  bestStreak,
  incorrectCount,
  maxAttempts,
  onBackToMenu,
}) => {
  const { background } = useTheme();

  if (!visible) return null;

  // Build the emoji block row: ❌ for wrong guesses, ✅ if won (last slot), ⬜ for unused
  const buildBlocks = () => {
    const blocks: string[] = [];
    for (let i = 0; i < maxAttempts; i++) {
      if (i < incorrectCount) {
        blocks.push('❌');
      } else if (won && i === incorrectCount) {
        blocks.push('✅');
      } else {
        blocks.push('⬜');
      }
    }
    return blocks.join('');
  };

  const blocks = buildBlocks();

  const handleShare = async () => {
    const date = formatDisplayDate();
    const resultLine = won
      ? `✅ Won with ${incorrectCount}/${maxAttempts} wrong guesses!`
      : `💀 Lost — better luck tomorrow!`;
    const streakLine = streak > 1 ? `🔥 ${streak} day streak\n` : '';
    const message = `🎯 Hangman Daily\n${date}\nCategory: ${category}\n\n${resultLine}\n${streakLine}\n${blocks}\n\nPlay Word Fury!`;

    try {
      await Share.share({ message });
    } catch (e) {}
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.popup, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>

        {/* Header */}
        <Text style={[styles.title, { color: background.textColor }]}>Daily Hangman</Text>
        <Text style={[styles.date, { color: background.secondaryText }]}>{formatDisplayDate()}</Text>
        <Text style={[styles.category, { color: background.secondaryText }]}>{category}</Text>

        {/* Result */}
        <Text style={styles.resultEmoji}>{won ? '🎉' : '💀'}</Text>
        <Text style={[styles.resultText, { color: won ? COLORS.accent : COLORS.danger }]}>
          {won ? 'You Won!' : 'Better Luck Tomorrow!'}
        </Text>

        {/* Word */}
        <View style={[styles.wordBox, { backgroundColor: background.backgroundColor, borderColor: background.borderColor }]}>
          <Text style={[styles.wordLabel, { color: background.secondaryText }]}>The word was</Text>
          <Text style={[styles.word, { color: background.textColor }]}>{word.toUpperCase()}</Text>
        </View>

        {/* Wrong guess blocks */}
        <Text style={styles.blocks}>{blocks}</Text>
        <Text style={[styles.blockLabel, { color: background.secondaryText }]}>
          {incorrectCount}/{maxAttempts} wrong guesses
        </Text>

        {/* Streak */}
        <View style={styles.streakRow}>
          <View style={[styles.streakCard, { backgroundColor: background.backgroundColor, borderColor: background.borderColor }]}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.streakValue, { color: background.textColor }]}>{streak}</Text>
            <Text style={[styles.streakLabel, { color: background.secondaryText }]}>Streak</Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: background.backgroundColor, borderColor: background.borderColor }]}>
            <Text style={styles.streakEmoji}>🏆</Text>
            <Text style={[styles.streakValue, { color: background.textColor }]}>{bestStreak}</Text>
            <Text style={[styles.streakLabel, { color: background.secondaryText }]}>Best</Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: COLORS.accent }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.shareBtnText}>Share Result</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuBtn, { borderColor: background.borderColor }]}
          onPress={onBackToMenu}
          activeOpacity={0.8}
        >
          <Text style={[styles.menuBtnText, { color: background.textColor }]}>Back to Menu</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  popup: {
    width: 340,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  date: { fontSize: 14, marginBottom: 2 },
  category: { fontSize: 13, marginBottom: 12 },
  resultEmoji: { fontSize: 44, marginBottom: 4 },
  resultText: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  wordBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  wordLabel: { fontSize: 12, marginBottom: 4 },
  word: { fontSize: 26, fontWeight: 'bold', letterSpacing: 2 },
  blocks: { fontSize: 28, letterSpacing: 2, marginBottom: 4 },
  blockLabel: { fontSize: 12, marginBottom: 16 },
  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 20, width: '100%' },
  streakCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  streakEmoji: { fontSize: 20, marginBottom: 2 },
  streakValue: { fontSize: 22, fontWeight: 'bold' },
  streakLabel: { fontSize: 12 },
  shareBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  menuBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  menuBtnText: { fontSize: 16, fontWeight: '600' },
});
