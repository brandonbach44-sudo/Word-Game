// app/wordsearch/results.tsx

import { router, useLocalSearchParams } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Share,
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
import { useCountdownToMidnight } from '../../src/wordsearch/utils/storage';
import { WS_ACHIEVEMENTS, WSAchievement } from '../../src/wordsearch/utils/wsAchievements';
import { loadWordSearchStats, WordSearchStats } from '../../src/wordsearch/utils/wsStorage';

const { width } = Dimensions.get('window');

// ── Animated achievement popup (slides from top, like Word Builder) ──────────
function AchievementPopup({
  achievement,
  onDismiss,
  cardColor,
  textColor,
}: {
  achievement: WSAchievement | null;
  onDismiss: () => void;
  cardColor: string;
  textColor: string;
}) {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => dismiss(), 3000);
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -150, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!achievement) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Animated.View
        style={[styles.popupContainer, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.popup, { backgroundColor: cardColor, borderColor: COLORS.accent }]}
          onPress={dismiss}
          activeOpacity={0.9}
        >
          <Text style={styles.popupUnlockLabel}>Achievement Unlocked!</Text>
          <View style={styles.popupContent}>
            <Text style={styles.popupEmoji}>{achievement.emoji}</Text>
            <View style={styles.popupText}>
              <Text style={[styles.popupName, { color: textColor }]}>{achievement.name}</Text>
              <Text style={[styles.popupDesc, { color: textColor, opacity: 0.7 }]}>{achievement.description}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Stat cell for the horizontal summary bar ─────────────────────────────────
function StatCell({ label, value, color, border }: { label: string; value: string; color: string; border: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statNumber, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: border }]}>{label}</Text>
    </View>
  );
}

// ── Stats card (grid) ─────────────────────────────────────────────────────────
function StatsCard({
  label,
  value,
  wide = false,
  textColor,
  secondaryText,
  cardColor,
  borderColor,
}: {
  label: string;
  value: string;
  wide?: boolean;
  textColor: string;
  secondaryText: string;
  cardColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.statsCard, wide && styles.statsCardWide, { backgroundColor: cardColor, borderColor }]}>
      <Text style={[styles.statsValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statsLabel2, { color: secondaryText }]}>{label}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function WordSearchResultsScreen() {
  const { background } = useTheme();
  const params = useLocalSearchParams();
  const countdown = useCountdownToMidnight();
  const [lifetimeStats, setLifetimeStats] = useState<WordSearchStats | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<WSAchievement[]>([]);
  const [currentPopup, setCurrentPopup] = useState<WSAchievement | null>(null);

  const score = parseInt(params.score as string) || 0;
  const foundWords = parseInt(params.foundWords as string) || 0;
  const totalWords = parseInt(params.totalWords as string) || 0;
  const allFound = params.allFound === 'true';
  const isDaily = params.isDaily === 'true';
  const timeString = (params.time as string) || '0:00';
  const themeName = (params.themeName as string) || 'Word Search';
  const difficulty = (params.difficulty as string) || '';
  const multiplier = parseInt(params.multiplier as string) || 1;
  const timeBonus = parseInt(params.timeBonus as string) || 0;
  const wordPoints = score - timeBonus;

  const newAchievementIds = ((params.newAchievements as string) || '').split(',').filter(Boolean);
  const newAchievements: WSAchievement[] = newAchievementIds
    .map(id => WS_ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean) as WSAchievement[];

  useEffect(() => {
    SoundManager.gameOver();
    loadWordSearchStats().then(setLifetimeStats);
    if (newAchievements.length > 0) {
      setPendingAchievements(newAchievements);
    }
  }, []);

  // Show achievement popups one at a time
  useEffect(() => {
    if (pendingAchievements.length > 0 && !currentPopup) {
      setCurrentPopup(pendingAchievements[0]);
      setPendingAchievements(prev => prev.slice(1));
    }
  }, [pendingAchievements, currentPopup]);

  const handlePopupDismiss = () => setCurrentPopup(null);

  const getTitle = () => {
    if (allFound) return 'Perfect!';
    const pct = totalWords > 0 ? foundWords / totalWords : 0;
    if (pct >= 0.75) return 'Great Job!';
    if (pct >= 0.5) return 'Good Effort!';
    if (isDaily) return "Time's Up!";
    return 'Nice Try!';
  };

  const getDifficultyLabel = () => {
    const d = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    return multiplier > 1 ? `${d} (${multiplier}×)` : d;
  };

  const formatDate = () =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleShare = async () => {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const result = allFound ? `${foundWords}/${totalWords} ✅` : `${foundWords}/${totalWords}`;
    const text = isDaily
      ? `🔍 Word Search Daily\n${themeName} • ${dateStr}\n${result} words in ${timeString}\nScore: ${score}\n#WordFury`
      : `🔍 Word Search\nTheme: ${themeName} • ${getDifficultyLabel()}\nFound ${result} words in ${timeString}\nScore: ${score}\n#WordFury`;
    try {
      await Share.share({ message: text });
    } catch (e) {
      console.warn('Share failed', e);
    }
  };

  const BG = background.backgroundColor;
  const TEXT = background.textColor;
  const SUBTEXT = background.secondaryText;
  const CARD = background.cardColor;
  const BORDER = background.borderColor;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      {/* Achievement popup */}
      <AchievementPopup
        achievement={currentPopup}
        onDismiss={handlePopupDismiss}
        cardColor={CARD}
        textColor={TEXT}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.push('/wordsearch')}>
          <Text style={[styles.backText, { color: SUBTEXT }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: TEXT }]}>
          {isDaily ? 'Daily Challenge' : 'Word Search'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Title ── */}
        <Text style={[styles.gameOverTitle, { color: TEXT }]}>{getTitle()}</Text>
        {isDaily && <Text style={[styles.dateText, { color: SUBTEXT }]}>{formatDate()}</Text>}

        {/* ── Big score ── */}
        <Text style={styles.finalScore}>{score}</Text>
        <Text style={[styles.finalScoreLabel, { color: SUBTEXT }]}>points</Text>

        {/* Theme pill */}
        <View style={[styles.themePill, { borderColor: COLORS.accent }]}>
          <Text style={[styles.themePillText, { color: COLORS.accent }]}>
            {themeName}{difficulty ? ` · ${getDifficultyLabel()}` : ''}
          </Text>
        </View>

        {/* ── Horizontal stat summary ── */}
        <View style={[styles.statsSummary, { backgroundColor: CARD, borderColor: BORDER }]}>
          <StatCell label="Found" value={`${foundWords}/${totalWords}`} color={TEXT} border={SUBTEXT} />
          <View style={[styles.statDivider, { backgroundColor: BORDER }]} />
          <StatCell label="Time" value={timeString} color={TEXT} border={SUBTEXT} />
          <View style={[styles.statDivider, { backgroundColor: BORDER }]} />
          <StatCell
            label="Complete"
            value={totalWords > 0 ? `${Math.round((foundWords / totalWords) * 100)}%` : '0%'}
            color={allFound ? COLORS.accent : TEXT}
            border={SUBTEXT}
          />
        </View>

        {/* ── Score breakdown (only when all found) ── */}
        {allFound && (
          <View style={[styles.breakdownCard, { backgroundColor: CARD, borderColor: BORDER }]}>
            <Text style={[styles.breakdownTitle, { color: SUBTEXT }]}>SCORE BREAKDOWN</Text>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: SUBTEXT }]}>Words found</Text>
              <Text style={[styles.breakdownValue, { color: TEXT }]}>{wordPoints}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: SUBTEXT }]}>Time bonus</Text>
              <Text style={[styles.breakdownValue, { color: COLORS.accent }]}>+{timeBonus}</Text>
            </View>
            {multiplier > 1 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: SUBTEXT }]}>Difficulty multiplier</Text>
                <Text style={[styles.breakdownValue, { color: '#f59e0b' }]}>{multiplier}×</Text>
              </View>
            )}
            <View style={[styles.breakdownDivider, { backgroundColor: BORDER }]} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabelBold, { color: TEXT }]}>Total</Text>
              <Text style={[styles.breakdownValueBold, { color: COLORS.accent }]}>{score}</Text>
            </View>
          </View>
        )}

        {/* ── Lifetime stats ── */}
        {lifetimeStats && lifetimeStats.gamesPlayed > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: TEXT }]}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <StatsCard label="Best Score" value={lifetimeStats.bestScore.toLocaleString()} textColor={COLORS.accent} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
              <StatsCard label="Games Played" value={lifetimeStats.gamesPlayed.toString()} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
              <StatsCard label="Win Streak" value={lifetimeStats.currentStreak.toString()} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
              <StatsCard label="Best Streak" value={lifetimeStats.bestStreak.toString()} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
              <StatsCard label="Lifetime Score" value={lifetimeStats.lifetimeScore.toLocaleString()} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
              <StatsCard label="Words Found" value={lifetimeStats.totalWordsFound.toLocaleString()} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
            </View>
          </>
        )}

        {/* ── Daily countdown ── */}
        {isDaily && (
          <View style={[styles.countdownCard, { backgroundColor: CARD, borderColor: BORDER }]}>
            <Text style={[styles.countdownLabel, { color: SUBTEXT }]}>Next Daily in</Text>
            <Text style={[styles.countdownValue, { color: TEXT }]}>{countdown}</Text>
          </View>
        )}

        {/* ── Buttons ── */}
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [styles.pill, { borderColor: BORDER, backgroundColor: BG, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push('/wordsearch')}
          >
            <Text style={[styles.pillText, { color: TEXT }]}>Main Menu</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.pill, { borderColor: BORDER, backgroundColor: BG, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push('/wordsearch/play')}
          >
            <Text style={[styles.pillText, { color: TEXT }]}>Play Again</Text>
          </Pressable>
        </View>

        {/* ── Green share button (Word Builder style) ── */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={18} color="#fff" />
          <Text style={styles.shareButtonText}>Share Result</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: { padding: 8 },
  backText: { fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerPlaceholder: { width: 60 },

  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },

  // Title + score
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
  },
  finalScoreLabel: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },

  // Theme pill
  themePill: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  themePillText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Horizontal stat summary
  statsSummary: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 8,
  },

  // Score breakdown
  breakdownCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: { fontSize: 14, fontWeight: '500' },
  breakdownValue: { fontSize: 14, fontWeight: '700' },
  breakdownLabelBold: { fontSize: 15, fontWeight: '900' },
  breakdownValueBold: { fontSize: 15, fontWeight: '900' },
  breakdownDivider: { height: 1, marginVertical: 8, opacity: 0.2 },

  // Lifetime stats grid
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  statsCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsCardWide: { width: '100%' },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel2: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Countdown
  countdownCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  countdownValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  pill: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 130,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Share button (green, Word Builder style)
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 999,
    paddingVertical: 14,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Achievement popup
  popupContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  popup: {
    width: width - 40,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  popupUnlockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  popupContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  popupText: { flex: 1 },
  popupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  popupDesc: {
    fontSize: 14,
  },
});
