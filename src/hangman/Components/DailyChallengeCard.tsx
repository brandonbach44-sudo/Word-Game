import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';
import { formatDisplayDate, useCountdownToMidnight } from '../utils/dailyChallenge';

type Props = {
  played: boolean;
  streak: number;
  bestStreak: number;
  onPlay: () => void;
};

export const DailyChallengeCard: React.FC<Props> = ({
  played,
  streak,
  bestStreak,
  onPlay,
}) => {
  const { background } = useTheme();
  const countdown = useCountdownToMidnight();

  return (
    <View style={[
      styles.container,
      { borderColor: COLORS.accent, backgroundColor: background.cardColor }
    ]}>
      <Text style={[styles.title, { color: background.textColor }]}>Daily Challenge</Text>
      <Text style={[styles.date, { color: background.secondaryText }]}>{formatDisplayDate()}</Text>
      <View style={{ alignItems: 'center', marginVertical: 18 }}>
        {played
          ? (
            <Text style={[styles.bigCompleted, { color: COLORS.accent }]}>✔ Completed</Text>
          )
          : (
            <TouchableOpacity style={styles.playButton} onPress={onPlay}>
              <Text style={styles.playText}>Play Today's Challenge</Text>
            </TouchableOpacity>
          )
        }
      </View>
      <Text style={[styles.subheadline, { color: background.secondaryText }]}>
        Today's Word • 1 word
      </Text>
      <View style={styles.streakRow}>
        <View style={[styles.streakPill, { backgroundColor: '#e3f8f0' }]}>
          <Text style={styles.streakPillLabel}>🔥 Current streak</Text>
          <Text style={styles.streakPillValue}>{streak}</Text>
        </View>
        <View style={[styles.streakPill, { backgroundColor: '#faefd5' }]}>
          <Text style={styles.streakPillLabel}>🏆 Best streak</Text>
          <Text style={styles.streakPillValue}>{bestStreak}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={[styles.countdownLabel, { color: background.secondaryText }]}>
        Next challenge in
      </Text>
      <Text style={styles.countdown}>{countdown}</Text>
      {played && (
        <TouchableOpacity style={styles.resultsButton} onPress={onPlay}>
          <Text style={styles.resultsButtonText}>View Results</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 1, textAlign: 'center', letterSpacing: 0.3 },
  date: { fontSize: 14, marginBottom: 2, textAlign: 'center', letterSpacing: 0.2 },
  bigCompleted: { fontSize: 36, fontWeight: 'bold', marginBottom: 2, marginTop: 0 },
  playButton: { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  playText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  subheadline: { fontSize: 15, marginBottom: 20, textAlign: 'center' },
  streakRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 },
  streakPill: { flex: 1, minWidth: 95, alignItems: 'center', borderRadius: 18, paddingHorizontal: 8, paddingVertical: 12, marginHorizontal: 3 },
  streakPillLabel: { fontSize: 13, color: '#857450', marginBottom: 1 },
  streakPillValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.accent },
  divider: { height: 1, width: '90%', backgroundColor: '#e3e3e3', marginVertical: 14 },
  countdownLabel: { fontSize: 14, marginBottom: 1, textAlign: 'center' },
  countdown: { fontWeight: 'bold', fontSize: 20, letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
  resultsButton: { marginTop: 12, backgroundColor: COLORS.accent, paddingVertical: 10, paddingHorizontal: 38, borderRadius: 30 },
  resultsButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});