// src/wordladder/components/LadderResultOverlay.tsx
// Matches the shared results/share/stat-pill design language used by
// Wordle's result overlay (brand tag, stat pills, share button, close).

import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Share2 } from 'lucide-react-native';

import { useTheme } from '../../shared/ThemeContext';

type Props = {
  visible: boolean;
  mode: 'daily' | 'practice';
  status: 'won' | 'gave_up';
  startWord: string;
  endWord: string;
  steps: number;
  par: number;
  timeSeconds: number | null;
  hintsUsed: number;
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
}: {
  label: string;
  onPress: () => void;
  borderColor: string;
  textColor: string;
  backgroundColor: string;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.primaryButton,
      { borderColor, backgroundColor, opacity: pressed ? 0.75 : 1 },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.primaryButtonText, { color: textColor }]}>{label}</Text>
  </Pressable>
);

const LadderResultOverlay: React.FC<Props> = ({
  visible,
  mode,
  status,
  startWord,
  endWord,
  steps,
  par,
  timeSeconds,
  hintsUsed,
  currentStreak,
  bestStreak,
  nextDailySecondsRemaining,
  shareText,
  onClose,
  onPlayAgain,
  onGoHome,
}) => {
  const { background } = useTheme();

  const handleShare = async () => {
    try {
      const text =
        shareText && shareText.length > 0
          ? shareText
          : `Word Ladder ${startWord.toUpperCase()} → ${endWord.toUpperCase()}`;
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
  const isWin = status === 'won';

  const title = isWin ? (steps === par ? 'Perfect Climb!' : 'Nice!') : 'Ladder Revealed';
  const subtitle = isWin
    ? `You reached ${endWord.toUpperCase()} in ${steps} step${steps === 1 ? '' : 's'} (par ${par}).`
    : `You gave up — the shortest path took ${par} step${par === 1 ? '' : 's'}.`;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
      <View style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}>
        <Text style={[styles.brand, { color: SUBTEXT }]}>WORD LADDER</Text>

        <Text style={[styles.title, { color: TEXT }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: SUBTEXT }]}>{subtitle}</Text>

        <View style={[styles.solutionBox, { borderColor: BORDER }]}>
          <Text style={[styles.solutionLabel, { color: SUBTEXT }]}>Ladder</Text>
          <Text style={[styles.solutionWord, { color: TEXT }]}>
            {startWord.toUpperCase()} → {endWord.toUpperCase()}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
        <Text style={[styles.sectionTitle, { color: TEXT }]}>This game</Text>
        <View style={styles.statsRow}>
          <StatPill label="Steps" value={`${steps}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
          <StatPill label="Par" value={`${par}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
          {timeSeconds != null && (
            <StatPill label="Time" value={formatSeconds(timeSeconds)} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
          )}
          {hintsUsed > 0 && (
            <StatPill label="Hints" value={`${hintsUsed}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
          )}
        </View>

        {isDaily && (currentStreak != null || bestStreak != null) && (
          <>
            <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
            <Text style={[styles.sectionTitle, { color: TEXT }]}>Streak</Text>
            <View style={styles.statsRow}>
              {currentStreak != null && (
                <StatPill label="Current" value={`${currentStreak}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
              )}
              {bestStreak != null && (
                <StatPill label="Best" value={`${bestStreak}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
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
            <PrimaryButton label="Main Menu" onPress={onGoHome} borderColor={BORDER} textColor={TEXT} backgroundColor={BG} />
          ) : (
            <>
              <PrimaryButton label="Play Again" onPress={onPlayAgain} borderColor={BORDER} textColor={TEXT} backgroundColor={BG} />
              <PrimaryButton label="Main Menu" onPress={onGoHome} borderColor={BORDER} textColor={TEXT} backgroundColor={BG} />
            </>
          )}
        </View>

        <Pressable style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.75 : 1 }]} onPress={handleShare}>
          <View style={styles.shareButtonInner}>
            <Share2 size={18} color="#fff" />
            <Text style={styles.shareButtonText}>Share Result</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, { borderColor: BORDER, backgroundColor: BG, opacity: pressed ? 0.75 : 1 }]}
          onPress={onClose}
        >
          <Text style={[styles.secondaryButtonText, { color: TEXT }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default LadderResultOverlay;

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 2, padding: 16 },
  brand: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  subtitle: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  solutionBox: { borderWidth: 2, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  solutionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  solutionWord: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  divider: { height: 1, marginVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 8, textAlign: 'center', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  statPill: { borderWidth: 2, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, minWidth: 90, alignItems: 'center' },
  statPillLabel: { fontSize: 11, fontWeight: '800', opacity: 0.8, marginBottom: 2 },
  statPillValue: { fontSize: 14, fontWeight: '900' },
  countdownLabel: { textAlign: 'center', fontSize: 12, fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  countdownValue: { textAlign: 'center', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12 },
  primaryButton: { borderWidth: 2, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, minWidth: 120, alignItems: 'center' },
  primaryButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  shareButton: { marginTop: 10, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', backgroundColor: '#22c55e' },
  shareButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareButtonText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  secondaryButton: { marginTop: 10, borderWidth: 2, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
