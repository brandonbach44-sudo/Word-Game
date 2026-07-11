// src/anagrams/components/AnagramsResultOverlay.tsx
// Matches the shared results/share/stat-pill design language used by
// Wordle / Word Ladder's result overlays (brand tag, stat pills, share
// button, close).

import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Share2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../shared/ThemeContext';
import type { RoundResult } from '../utils/scoring';

type Props = {
  visible: boolean;
  mode: 'daily' | 'practice';
  words: string[];
  roundResults: RoundResult[];
  totalScore: number;
  perfectBonusApplied: boolean;
  timeSeconds: number;
  currentStreak: number | null;
  bestStreak: number | null;
  nextDailySecondsRemaining?: number | null;
  shareText?: string;
  onClose: () => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
};

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
}

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

const PrimaryButton = ({
  label,
  onPress,
  borderColor,
  textColor,
  backgroundColor,
  fullWidth,
}: {
  label: string;
  onPress: () => void;
  borderColor: string;
  textColor: string;
  backgroundColor: string;
  fullWidth?: boolean;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.primaryButton,
      fullWidth && styles.primaryButtonFullWidth,
      { borderColor, backgroundColor, opacity: pressed ? 0.75 : 1 },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.primaryButtonText, { color: textColor }]}>{label}</Text>
  </Pressable>
);

const AnagramsResultOverlay: React.FC<Props> = ({
  visible,
  mode,
  words,
  roundResults,
  totalScore,
  perfectBonusApplied,
  timeSeconds,
  currentStreak,
  bestStreak,
  nextDailySecondsRemaining,
  shareText,
  onClose,
  onPlayAgain,
  onGoHome,
}) => {
  const { background } = useTheme();
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    try {
      const text = shareText && shareText.length > 0 ? shareText : `Anagrams — Score ${totalScore}`;
      await Share.share({ message: text });
    } catch (e) {
      console.warn('Share failed', e);
    }
  };

  const BG = background.backgroundColor ?? '#f9f5ec';
  const TEXT = background.textColor ?? '#111827';
  const SUBTEXT = background.secondaryText ?? '#6b7280';
  const CARD = background.cardColor ?? '#ffffff';
  const BORDER = background.borderColor ?? '#e5e7eb';

  if (!visible) return null;

  const isDaily = mode === 'daily';
  const wordsSolved = roundResults.filter((r) => r.solved && !r.skipped).length;
  const allSolved = wordsSolved === roundResults.length && roundResults.length > 0;

  const title = perfectBonusApplied ? 'Perfect Run!' : allSolved ? 'Nice Work!' : 'Run Complete';
  const subtitle = perfectBonusApplied
    ? `All ${roundResults.length} words, zero hints — flawless.`
    : `You solved ${wordsSolved}/${roundResults.length} words.`;

  return (
    <View style={[styles.overlay, { backgroundColor: BG }]}>
      <View style={[styles.pageHeader, { borderColor: BORDER }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.brand, { color: SUBTEXT }]}>ANAGRAMS</Text>
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
        <Text style={[styles.title, { color: TEXT }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: SUBTEXT }]}>{subtitle}</Text>

        <View style={[styles.wordsBox, { borderColor: BORDER }]}>
          {words.map((w, i) => {
            const result = roundResults[i];
            const solved = result?.solved && !result?.skipped;
            return (
              <View key={`${w}-${i}`} style={styles.wordRow}>
                <Text style={[styles.wordText, { color: TEXT }, !solved && styles.wordTextMissed]}>
                  {w.toUpperCase()}
                </Text>
                <Text style={styles.wordIcon}>{solved ? '✅' : '⏭️'}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
        <Text style={[styles.sectionTitle, { color: TEXT }]}>This game</Text>
        <View style={styles.statsRow}>
          <StatPill label="Score" value={`${totalScore}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
          <StatPill label="Solved" value={`${wordsSolved}/${roundResults.length}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
          <StatPill label="Time" value={formatSeconds(timeSeconds)} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
        </View>

        {isDaily && (currentStreak != null || bestStreak != null) && (
          <>
            <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
            <Text style={[styles.sectionTitle, { color: TEXT }]}>Streak</Text>
            <View style={styles.statsRow}>
              {currentStreak != null && (
                <StatPill label="Current" value={`${currentStreak}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
              )}
              {bestStreak != null && (
                <StatPill label="Best" value={`${bestStreak}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
              )}
            </View>
          </>
        )}

        {isDaily && nextDailySecondsRemaining != null && (
          <>
            <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
            <Text style={[styles.countdownLabel, { color: SUBTEXT }]}>Next Daily in</Text>
            <Text style={[styles.countdownValue, { color: TEXT }]}>
              {formatCountdown(nextDailySecondsRemaining)}
            </Text>
          </>
        )}

        <View style={styles.buttonRow}>
          {isDaily ? (
            <PrimaryButton label="Main Menu" onPress={onGoHome} borderColor={BORDER} textColor={TEXT} backgroundColor={CARD} fullWidth />
          ) : (
            <>
              <PrimaryButton label="Play Again" onPress={onPlayAgain} borderColor={BORDER} textColor={TEXT} backgroundColor={CARD} />
              <PrimaryButton label="Main Menu" onPress={onGoHome} borderColor={BORDER} textColor={TEXT} backgroundColor={CARD} />
            </>
          )}
        </View>

        <Pressable style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.75 : 1 }]} onPress={handleShare}>
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

export default AnagramsResultOverlay;

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
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
  scrollContent: { alignItems: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, padding: 4 },
  brand: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '900', marginBottom: 4, marginTop: 12 },
  subtitle: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  wordsBox: { borderWidth: 2, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  wordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  wordText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  wordTextMissed: { opacity: 0.5, textDecorationLine: 'line-through' },
  wordIcon: { fontSize: 14 },
  divider: { height: 1, marginVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 8, textAlign: 'center', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  statPill: { borderWidth: 2, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, minWidth: 100, alignItems: 'center' },
  statPillLabel: { fontSize: 11, fontWeight: '800', opacity: 0.8, marginBottom: 2 },
  statPillValue: { fontSize: 14, fontWeight: '900' },
  countdownLabel: { textAlign: 'center', fontSize: 12, fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  countdownValue: { textAlign: 'center', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 10, marginTop: 12 },
  primaryButton: { borderWidth: 2, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, minWidth: 120, alignItems: 'center' },
  primaryButtonFullWidth: { width: '100%', paddingVertical: 12, minWidth: undefined },
  primaryButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  shareButton: { marginTop: 10, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', backgroundColor: '#22c55e' },
  shareButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareButtonText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
});
