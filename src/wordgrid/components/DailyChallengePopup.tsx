// src/wordgrid/components/DailyChallengePopup.tsx
import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Share2 } from 'lucide-react-native';

import { useTheme } from '../../shared/ThemeContext';
import { useCountdownToMidnight } from '../utils/dailyChallenge';

type Props = {
  visible: boolean;
  score: number;
  wordsCount: number;
  streak: number;
  bestStreak: number;
  shareText: string;
  onBackToMenu: () => void;
  onPlayAgain?: () => void;
};

const StatPill = ({ label, value, textColor, borderColor, backgroundColor }: {
  label: string; value: string; textColor: string; borderColor: string; backgroundColor: string;
}) => (
  <View style={[styles.statPill, { borderColor, backgroundColor }]}>
    <Text style={[styles.statPillLabel, { color: textColor }]}>{label}</Text>
    <Text style={[styles.statPillValue, { color: textColor }]}>{value}</Text>
  </View>
);

const PrimaryButton = ({ label, onPress, borderColor, textColor, backgroundColor }: {
  label: string; onPress: () => void; borderColor: string; textColor: string; backgroundColor: string;
}) => (
  <Pressable
    style={({ pressed }) => [styles.primaryButton, { borderColor, backgroundColor, opacity: pressed ? 0.75 : 1 }]}
    onPress={onPress}
  >
    <Text style={[styles.primaryButtonText, { color: textColor }]}>{label}</Text>
  </Pressable>
);

export const DailyChallengePopup: React.FC<Props> = ({
  visible, score, wordsCount, streak, bestStreak, shareText, onBackToMenu, onPlayAgain,
}) => {
  const { background } = useTheme();
  const countdown = useCountdownToMidnight();

  if (!visible) return null;

  const BG = background.backgroundColor;
  const TEXT = background.textColor;
  const SUBTEXT = background.secondaryText;
  const CARD = background.cardColor;
  const BORDER = background.borderColor;

  const getTitle = () => {
    if (score >= 200) return 'Outstanding!';
    if (score >= 150) return 'Great Job!';
    if (score >= 100) return 'Nice!';
    if (score >= 50) return 'Good Game!';
    return 'Keep Practicing!';
  };

  const handleShare = async () => {
    try { await Share.share({ message: shareText }); } catch (_) {}
  };

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
      <View style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}>
        <Text style={[styles.brand, { color: SUBTEXT }]}>WORD GRID</Text>
        <Text style={[styles.title, { color: TEXT }]}>{getTitle()}</Text>
        <Text style={[styles.subtitle, { color: SUBTEXT }]}>
          You scored {score} pts and found {wordsCount} words.
        </Text>
        <View style={[styles.scoreBox, { borderColor: BORDER }]}>
          <Text style={[styles.scoreLabel, { color: SUBTEXT }]}>Score</Text>
          <Text style={[styles.scoreValue, { color: TEXT }]}>{score}</Text>
          <Text style={[styles.wordsLabel, { color: SUBTEXT }]}>{wordsCount} words found</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
        <Text style={[styles.sectionTitle, { color: TEXT }]}>STATS</Text>
        <View style={styles.statsRow}>
          <StatPill label="Streak" value={String(streak)} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
          <StatPill label="Best" value={String(bestStreak)} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
        </View>
        <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
        <Text style={[styles.countdownLabel, { color: SUBTEXT }]}>Next Daily in</Text>
        <Text style={[styles.countdownValue, { color: TEXT }]}>{countdown}</Text>
        <View style={styles.buttonRow}>
          <PrimaryButton label="Main Menu" onPress={onBackToMenu} borderColor={BORDER} textColor={TEXT} backgroundColor={BG} />
          {onPlayAgain && (
            <PrimaryButton label="Play" onPress={onPlayAgain} borderColor={BORDER} textColor={TEXT} backgroundColor={BG} />
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
          onPress={onBackToMenu}
        >
          <Text style={[styles.secondaryButtonText, { color: TEXT }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 18, zIndex: 999 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 2, padding: 16 },
  brand: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  subtitle: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  scoreBox: { borderWidth: 2, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', marginBottom: 4 },
  scoreLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  scoreValue: { fontSize: 40, fontWeight: '900', letterSpacing: 2 },
  wordsLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 8, textAlign: 'center', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  statPill: { borderWidth: 2, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, minWidth: 120, alignItems: 'center' },
  statPillLabel: { fontSize: 11, fontWeight: '800', opacity: 0.8, marginBottom: 2 },
  statPillValue: { fontSize: 14, fontWeight: '900' },
  countdownLabel: { textAlign: 'center', fontSize: 12, fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  countdownValue: { textAlign: 'center', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12 },
  primaryButton: { borderWidth: 2, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, minWidth: 120, alignItems: 'center' },
  primaryButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  shareButton: { marginTop: 10, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', backgroundColor: '#22c55e' },
  shareButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareButtonText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  secondaryButton: { marginTop: 10, borderWidth: 2, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
