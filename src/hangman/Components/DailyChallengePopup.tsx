import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share2, X } from 'lucide-react-native';

import { useTheme } from '../../shared/ThemeContext';
import { formatDisplayDate, useCountdownToMidnight } from '../utils/dailyChallenge';

type Props = {
  visible: boolean;
  won: boolean;
  word: string;
  category: string;
  streak: number;
  bestStreak: number;
  incorrectCount: number;
  maxAttempts: number;
  onBackToMenu: () => void;
  onClose: () => void;
};

const StatPill = ({
  label,
  value,
  textColor,
  borderColor,
  backgroundColor,
}: {
  label: string;
  value: string;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
}) => (
  <View style={[styles.statPill, { borderColor, backgroundColor }]}>
    <Text style={[styles.statPillLabel, { color: textColor }]}>{label}</Text>
    <Text style={[styles.statPillValue, { color: textColor }]}>{value}</Text>
  </View>
);

export const DailyChallengePopup: React.FC<Props> = ({
  visible,
  won,
  word,
  category,
  streak,
  bestStreak,
  incorrectCount,
  maxAttempts,
  onBackToMenu,
  onClose,
}) => {
  const { background } = useTheme();
  const countdown = useCountdownToMidnight();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const BG = background.backgroundColor ?? '#f9f5ec';
  const TEXT = background.textColor ?? '#111827';
  const SUBTEXT = background.secondaryText ?? '#6b7280';
  const CARD = background.cardColor ?? '#ffffff';
  const BORDER = background.borderColor ?? '#e5e7eb';

  const title = won ? 'Nice!' : 'Better luck tomorrow';
  const subtitle = won
    ? `You guessed it with ${incorrectCount}/${maxAttempts} wrong guesses.`
    : "Better luck next time!";

  const handleShare = async () => {
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
    const blockRow = blocks.join('');
    const resultLine = won
      ? `✅ Won with ${incorrectCount}/${maxAttempts} wrong guesses!`
      : `💀 Lost — better luck tomorrow!`;
    const streakLine = streak > 1 ? `🔥 ${streak} day streak\n` : '';
    const message = `🎯 Hangman Daily\n${formatDisplayDate()}\nCategory: ${category}\n\n${resultLine}\n${streakLine}\n${blockRow}\n\nPlay Word Fury!`;
    try {
      const { Share } = require('react-native');
      await Share.share({ message });
    } catch (e) {}
  };

  return (
    <View style={[styles.overlay, { backgroundColor: BG }]}>
      <View style={[styles.pageHeader, { borderColor: BORDER }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.brand, { color: SUBTEXT }]}>HANGMAN</Text>
        <Pressable
          style={({ pressed }) => [styles.closeIconButton, { opacity: pressed ? 0.6 : 1 }]}
          onPress={onClose}
          hitSlop={10}
        >
          <X size={22} color={SUBTEXT} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.card}>

        {/* Title + subtitle */}
        <Text style={[styles.title, { color: TEXT }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: SUBTEXT }]}>{subtitle}</Text>

        {/* Solution */}
        <View style={[styles.solutionBox, { borderColor: BORDER }]}>
          <Text style={[styles.solutionLabel, { color: SUBTEXT }]}>The word was</Text>
          <Text style={[styles.solutionWord, { color: TEXT }]}>{word.toUpperCase()}</Text>
          <Text style={[styles.solutionCategory, { color: SUBTEXT }]}>{category}</Text>
        </View>

        {/* This game */}
        <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
        <Text style={[styles.sectionTitle, { color: TEXT }]}>This game</Text>
        <View style={styles.statsRow}>
          <StatPill
            label="Wrong"
            value={`${incorrectCount}`}
            textColor={TEXT}
            borderColor={BORDER}
            backgroundColor={CARD}
          />
          <StatPill
            label="Max"
            value={`${maxAttempts}`}
            textColor={TEXT}
            borderColor={BORDER}
            backgroundColor={CARD}
          />
        </View>

        {/* Stats */}
        <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
        <Text style={[styles.sectionTitle, { color: TEXT }]}>Stats</Text>
        <View style={styles.statsRow}>
          <StatPill
            label="Streak"
            value={`${streak}`}
            textColor={TEXT}
            borderColor={BORDER}
            backgroundColor={CARD}
          />
          <StatPill
            label="Best"
            value={`${bestStreak}`}
            textColor={TEXT}
            borderColor={BORDER}
            backgroundColor={CARD}
          />
        </View>

        {/* Countdown */}
        <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
        <Text style={[styles.countdownLabel, { color: SUBTEXT }]}>Next Daily in</Text>
        <Text style={[styles.countdownValue, { color: TEXT }]}>{countdown}</Text>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { borderColor: BORDER, backgroundColor: CARD, opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={onBackToMenu}
          >
            <Text style={[styles.primaryButtonText, { color: TEXT }]}>Main Menu</Text>
          </Pressable>
        </View>

        {/* Share Result */}
        <Pressable
          style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.75 : 1 }]}
          onPress={handleShare}
        >
          <View style={styles.shareButtonInner}>
            <Share2 size={18} color="#fff" />
            <Text style={styles.shareButtonText}>Share Result</Text>
          </View>
        </Pressable>

      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerSpacer: { width: 22 },
  closeIconButton: { width: 22, alignItems: 'flex-end' },
  scrollContent: {
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 4,
  },
  brand: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
    marginTop: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  solutionBox: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  solutionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  solutionWord: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },
  solutionCategory: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  statPill: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.8,
    marginBottom: 2,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  countdownLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 1,
  },
  countdownValue: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  shareButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#22c55e',
  },
  shareButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
