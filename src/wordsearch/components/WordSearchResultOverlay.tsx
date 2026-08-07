// src/wordsearch/components/WordSearchResultOverlay.tsx
//
// Extracted out of PlayScreen.tsx into its own component so Word Search's
// results screen follows the exact same pattern as every other game
// (LadderResultOverlay, AnagramsResultOverlay, WordleResultOverlay): a
// single dedicated file, always rendered the same way, that PlayScreen just
// feeds data into. Previously this was ~350 lines of hand-rolled JSX mixed
// directly into the 900+ line gameplay file — easy for a future edit to
// that file to silently break a button here without anyone noticing. Pulling
// it out structurally prevents that class of bug instead of relying on
// remembering to keep it in sync by hand.

import React from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Share2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../shared/ThemeContext';
import { AchievementPopup, AchievementLike } from '../../shared/AchievementPopup';
import { COLORS } from '../../shared/theme';
import type { WordSearchStats } from '../utils/wsStorage';
import type { WSAchievement } from '../utils/wsAchievements';

export interface WordSearchResultData {
  score: number;
  foundWords: number;
  totalWords: number;
  allFound: boolean;
  timeString: string;
  multiplier: number;
  timeBonus: number;
  newAchievements: WSAchievement[];
}

type Props = {
  visible: boolean;
  mode: 'daily' | 'practice';
  themeName: string;
  difficulty: string;
  resultData: WordSearchResultData;
  lifetimeStats: WordSearchStats | null;
  nextDailySecondsRemaining?: number | null;
  onClose: () => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
  // Achievement toast rendered inside this Modal — see AchievementPopup:
  // native Modals always paint above plain views, so a toast mounted only
  // at the parent screen level would be hidden behind this overlay.
  achievement?: AchievementLike | null;
  onDismissAchievement?: () => void;
};

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

const WordSearchResultOverlay: React.FC<Props> = ({
  visible,
  mode,
  themeName,
  difficulty,
  resultData,
  lifetimeStats,
  nextDailySecondsRemaining,
  onClose,
  onPlayAgain,
  onGoHome,
  achievement = null,
  onDismissAchievement,
}) => {
  const { background } = useTheme();
  const insets = useSafeAreaInsets();
  const isDaily = mode === 'daily';

  const BG = background.backgroundColor ?? '#f9f5ec';
  const TEXT = background.textColor ?? '#111827';
  const SUBTEXT = background.secondaryText ?? '#6b7280';
  const CARD = background.cardColor ?? '#ffffff';
  const BORDER = background.borderColor ?? '#e5e7eb';

  const title = resultData.allFound
    ? 'Nice!'
    : resultData.foundWords / resultData.totalWords >= 0.75
    ? 'Great Job!'
    : resultData.foundWords / resultData.totalWords >= 0.5
    ? 'Good Effort!'
    : "Time's Up!";
  const subtitle = resultData.allFound
    ? `You found all ${resultData.totalWords} words in ${resultData.timeString}!`
    : `You found ${resultData.foundWords}/${resultData.totalWords} words in ${resultData.timeString}.`;

  const handleShare = async () => {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const result = resultData.allFound
      ? `${resultData.foundWords}/${resultData.totalWords} ✅`
      : `${resultData.foundWords}/${resultData.totalWords}`;
    const text = isDaily
      ? `🔍 Word Search Daily\n${themeName} · ${dateStr}\n${result} words · ${resultData.timeString}\nScore: ${resultData.score}\n#WordFury`
      : `🔍 Word Search\n${themeName}\n${result} words · ${resultData.timeString}\nScore: ${resultData.score}`;
    try {
      await Share.share({ message: text });
    } catch (e) {
      console.warn('Share failed', e);
    }
  };

  // Same reasoning as every other game's result overlay — Modal instead of
  // an absolutely-positioned View so this always covers the full screen
  // exactly the same way, regardless of the parent play screen's layout.
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: BG }]}>
        <View style={[styles.pageHeader, { borderColor: BORDER, paddingTop: insets.top + 10 }]}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.brand, { color: SUBTEXT }]}>WORD SEARCH</Text>
          <Pressable
            style={({ pressed }) => [styles.closeIconButton, { opacity: pressed ? 0.6 : 1 }]}
            onPress={onClose}
            hitSlop={16}
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

            <View style={[styles.themePill, { borderColor: COLORS.accent }]}>
              <Text style={[styles.themePillText, { color: COLORS.accent }]}>
                {themeName}
                {difficulty ? ` · ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}${resultData.multiplier > 1 ? ` · ${resultData.multiplier}×` : ''}` : ''}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: BORDER }]} />
            <Text style={[styles.sectionTitle, { color: TEXT }]}>This game</Text>
            <View style={styles.statsRow}>
              <StatPill label="Found" value={`${resultData.foundWords}/${resultData.totalWords}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
              <StatPill label="Time" value={resultData.timeString} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
            </View>
            <View style={styles.statsRow}>
              <StatPill label="Score" value={resultData.score.toLocaleString()} textColor={COLORS.accent} borderColor={BORDER} backgroundColor={CARD} />
              <StatPill
                label="Complete"
                value={`${Math.round((resultData.foundWords / Math.max(resultData.totalWords, 1)) * 100)}%`}
                textColor={resultData.allFound ? COLORS.accent : TEXT}
                borderColor={BORDER}
                backgroundColor={CARD}
              />
            </View>

            {resultData.allFound && (
              <>
                <View style={[styles.divider, { backgroundColor: BORDER }]} />
                <Text style={[styles.sectionTitle, { color: TEXT }]}>Score breakdown</Text>
                <View style={styles.statsRow}>
                  <StatPill label="Words" value={`${resultData.score - resultData.timeBonus} pts`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
                  <StatPill label="Time Bonus" value={`+${resultData.timeBonus}`} textColor={COLORS.accent} borderColor={BORDER} backgroundColor={CARD} />
                </View>
                {resultData.multiplier > 1 && (
                  <View style={styles.statsRow}>
                    <StatPill label="Multiplier" value={`${resultData.multiplier}×`} textColor="#f59e0b" borderColor={BORDER} backgroundColor={CARD} />
                  </View>
                )}
              </>
            )}

            {lifetimeStats && lifetimeStats.gamesPlayed > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: BORDER }]} />
                <Text style={[styles.sectionTitle, { color: TEXT }]}>Your stats</Text>
                <View style={styles.statsRow}>
                  <StatPill label="Best Score" value={lifetimeStats.bestScore.toLocaleString()} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
                  <StatPill label="Streak" value={`${lifetimeStats.currentStreak}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
                </View>
                <View style={styles.statsRow}>
                  <StatPill label="Games" value={`${lifetimeStats.gamesPlayed}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
                  <StatPill label="Words Found" value={lifetimeStats.totalWordsFound.toLocaleString()} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
                </View>
              </>
            )}

            {isDaily && nextDailySecondsRemaining != null && nextDailySecondsRemaining > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: BORDER }]} />
                <Text style={[styles.countdownLabel, { color: SUBTEXT }]}>Next Daily in</Text>
                <Text style={[styles.countdownValue, { color: TEXT }]}>
                  {formatCountdown(nextDailySecondsRemaining)}
                </Text>
              </>
            )}

            {/* Buttons — Play Again only outside Daily (one attempt per day),
                same rule as every other game's results screen. Main Menu
                goes back to Word Search's own hub, not the app home. This
                row is now identical in structure to every other game's
                result overlay, so Main Menu can't silently go missing. */}
            <View style={styles.buttonRow}>
              <PrimaryButton
                label="Main Menu"
                onPress={onGoHome}
                borderColor={BORDER}
                textColor={TEXT}
                backgroundColor={CARD}
                fullWidth={isDaily}
              />
              {!isDaily && (
                <PrimaryButton
                  label="Play Again"
                  onPress={onPlayAgain}
                  borderColor={BORDER}
                  textColor={TEXT}
                  backgroundColor={CARD}
                />
              )}
            </View>

            <Pressable style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.75 : 1 }]} onPress={handleShare}>
              <View style={styles.shareButtonInner}>
                <Share2 size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Share Result</Text>
              </View>
            </Pressable>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
        <AchievementPopup
          achievement={achievement}
          onDismiss={onDismissAchievement ?? (() => {})}
          backgroundColor={CARD}
          textColor={TEXT}
        />
      </View>
    </Modal>
  );
};

export default WordSearchResultOverlay;

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerSpacer: { width: 22 },
  closeIconButton: { width: 22, alignItems: 'flex-end' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, padding: 4 },
  brand: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '900', marginBottom: 4, marginTop: 12 },
  subtitle: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  themePill: { alignSelf: 'center', borderWidth: 2, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 16, marginBottom: 4 },
  themePillText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 1, marginVertical: 12, opacity: 0.35 },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 8, textAlign: 'center', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  statPill: { borderWidth: 2, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, minWidth: 120, alignItems: 'center' },
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
