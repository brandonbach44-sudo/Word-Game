import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';
import { formatDisplayDate, useCountdownToMidnight } from '../utils/dailyChallenge';

type Props = {
  played: boolean;
  result: 'won' | 'lost' | '';
  word: string;
  streak: number;
  bestStreak: number;
  incorrectCount: number;
  maxAttempts: number;
  onPlay: () => void;
};

export const DailyChallengeCard: React.FC<Props> = ({
  played,
  result,
  word,
  streak,
  bestStreak,
  incorrectCount,
  maxAttempts,
  onPlay,
}) => {
  const { background } = useTheme();
  const countdown = useCountdownToMidnight();

  const buildBlocks = () => {
    const blocks: string[] = [];
    for (let i = 0; i < maxAttempts; i++) {
      if (i < incorrectCount) {
        blocks.push('❌');
      } else if (result === 'won' && i === incorrectCount) {
        blocks.push('✅');
      } else {
        blocks.push('⬜');
      }
    }
    return blocks.join('');
  };

  const handleShare = async () => {
    const blocks = buildBlocks();
    const resultLine = result === 'won'
      ? `Won with ${incorrectCount}/${maxAttempts} wrong guesses!`
      : `Lost — better luck tomorrow!`;
    const streakLine = streak > 1 ? `Streak: ${streak} days\n` : '';
    const message = `Hangman Daily\n${formatDisplayDate()}\n\n${result === 'won' ? '✅' : '💀'} ${resultLine}\n${streakLine}\n${blocks}\n\nPlay Word Fury!`;
    try {
      await Share.share({ message });
    } catch (e) {}
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: background.cardColor, borderColor: played ? COLORS.accent : background.borderColor },
    ]}>
      <Text style={[styles.title, { color: background.textColor }]}>Daily Challenge</Text>
      <Text style={[styles.date, { color: background.secondaryText }]}>{formatDisplayDate()}</Text>

      {/* Result info — only when played */}
      {played && result !== '' && (
        <>
          <Text style={[styles.resultText, { color: result === 'won' ? COLORS.accent : COLORS.danger }]}>
            {result === 'won' ? 'You Won!' : 'Better Luck Tomorrow'}
          </Text>
          <View style={[styles.wordBox, { backgroundColor: background.backgroundColor, borderColor: background.borderColor }]}>
            <Text style={[styles.wordLabel, { color: background.secondaryText }]}>The word was</Text>
            <Text style={[styles.word, { color: background.textColor }]}>{word.toUpperCase()}</Text>
          </View>
          <Text style={styles.blocks}>{buildBlocks()}</Text>
          <Text style={[styles.blockLabel, { color: background.secondaryText }]}>
            {incorrectCount}/{maxAttempts} wrong guesses
          </Text>
        </>
      )}

      {/* Streak pills — always shown */}
      <View style={styles.streakRow}>
        <View style={[styles.streakPill, { backgroundColor: background.backgroundColor, borderColor: background.borderColor }]}>
          <Text style={[styles.streakPillLabel, { color: background.secondaryText }]}>🔥 Streak</Text>
          <Text style={[styles.streakPillValue, { color: COLORS.accent }]}>{streak}</Text>
        </View>
        <View style={[styles.streakPill, { backgroundColor: background.backgroundColor, borderColor: background.borderColor }]}>
          <Text style={[styles.streakPillLabel, { color: background.secondaryText }]}>🏆 Best</Text>
          <Text style={[styles.streakPillValue, { color: COLORS.accent }]}>{bestStreak}</Text>
        </View>
      </View>

      {/* Play button — not played */}
      {!played && (
        <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.8}>
          <Text style={styles.playText}>Play Today's Challenge</Text>
        </TouchableOpacity>
      )}

      {/* View Results + Share — played */}
      {played && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.viewResultsBtn, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}
            onPress={onPlay}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewResultsText, { color: background.textColor }]}>View Results</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareIconBtn, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={background.textColor} />
          </TouchableOpacity>
        </View>
      )}

      {/* Countdown — only when played */}
      {played && (
        <View style={styles.countdownContainer}>
          <Text style={[styles.countdownLabel, { color: background.secondaryText }]}>Next challenge in</Text>
          <Text style={[styles.countdown, { color: background.textColor }]}>{countdown}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' },
  date: { fontSize: 14, marginBottom: 14, textAlign: 'center' },
  resultText: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  wordBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  wordLabel: { fontSize: 12, marginBottom: 3 },
  word: { fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
  blocks: { fontSize: 22, letterSpacing: 2, marginBottom: 3 },
  blockLabel: { fontSize: 12, marginBottom: 16 },
  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 16, width: '100%' },
  streakPill: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
  },
  streakPillLabel: { fontSize: 13, marginBottom: 2 },
  streakPillValue: { fontSize: 22, fontWeight: 'bold' },
  playButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
  },
  playText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  actionRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 14 },
  viewResultsBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  viewResultsText: { fontSize: 15, fontWeight: '600' },
  shareIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
countdownContainer: { alignItems: 'center' },
  countdownLabel: { fontSize: 13, marginBottom: 2 },
  countdown: { fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
});
