// app/wordsearch/results.tsx
// Matches the Wordle / Word Builder daily results card style exactly.

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

// ── Achievement popup (slides from top) ──────────────────────────────────────
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

// ── StatPill (matches Wordle exactly) ────────────────────────────────────────
function StatPill({
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
}) {
  return (
    <View style={[styles.statPill, { borderColor, backgroundColor }]}>
      <Text style={[styles.statPillLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.statPillValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

// ── PrimaryButton (matches Wordle exactly) ───────────────────────────────────
function PrimaryButton({
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
}) {
  return (
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
}

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function WordSearchResultsScreen() {
  const { background } = useTheme();
  const params = useLocalSearchParams();
  const countdownRaw = useCountdownToMidnight(); // e.g. "05:32:11"
  const [lifetimeStats, setLifetimeStats] = useState<WordSearchStats | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<WSAchievement[]>([]);
  const [currentPopup, setCurrentPopup] = useState<WSAchievement | null>(null);

  const score        = parseInt(params.score as string) || 0;
  const foundWords   = parseInt(params.foundWords as string) || 0;
  const totalWords   = parseInt(params.totalWords as string) || 0;
  const allFound     = params.allFound === 'true';
  const isDaily      = params.isDaily === 'true';
  const timeString   = (params.time as string) || '0:00';
  const themeName    = (params.themeName as string) || 'Word Search';
  const difficulty   = (params.difficulty as string) || '';
  const multiplier   = parseInt(params.multiplier as string) || 1;
  const timeBonus    = parseInt(params.timeBonus as string) || 0;
  const wordPoints   = score - timeBonus;

  const newAchievementIds = ((params.newAchievements as string) || '').split(',').filter(Boolean);
  const newAchievements: WSAchievement[] = newAchievementIds
    .map(id => WS_ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean) as WSAchievement[];

  useEffect(() => {
    SoundManager.gameOver();
    loadWordSearchStats().then(setLifetimeStats);
    if (newAchievements.length > 0) setPendingAchievements(newAchievements);
  }, []);

  useEffect(() => {
    if (pendingAchievements.length > 0 && !currentPopup) {
      setCurrentPopup(pendingAchievements[0]);
      setPendingAchievements(prev => prev.slice(1));
    }
  }, [pendingAchievements, currentPopup]);

  const getTitle = () => {
    if (allFound) return 'Nice!';
    const pct = totalWords > 0 ? foundWords / totalWords : 0;
    if (pct >= 0.75) return 'Great Job!';
    if (pct >= 0.5)  return 'Good Effort!';
    return "Time's Up!";
  };

  const getSubtitle = () => {
    const result = `${foundWords}/${totalWords} words in ${timeString}`;
    if (isDaily) {
      return allFound
        ? `You found all ${totalWords} words in ${timeString}!`
        : `You found ${result}.`;
    }
    return allFound
      ? `You found all ${totalWords} words in ${timeString}!`
      : `You found ${result}.`;
  };

  const getDiffLabel = () => {
    const d = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    return multiplier > 1 ? `${d} · ${multiplier}×` : d;
  };

  const handleShare = async () => {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const result = allFound ? `${foundWords}/${totalWords} ✅` : `${foundWords}/${totalWords}`;
    const text = isDaily
      ? `🔍 Word Search Daily\n${themeName} · ${dateStr}\n${result} words · ${timeString}\nScore: ${score}\n#WordFury`
      : `🔍 Word Search · ${getDiffLabel()}\nTheme: ${themeName}\nFound ${result} words · ${timeString}\nScore: ${score}\n#WordFury`;
    try { await Share.share({ message: text }); } catch (e) { console.warn('Share failed', e); }
  };

  const BG     = background.backgroundColor;
  const TEXT   = background.textColor;
  const SUBTEXT = background.secondaryText;
  const CARD   = background.cardColor;
  const BORDER = background.borderColor;

  // Parse countdown string "HH:MM:SS" → seconds for formatCountdown
  const countdownParts = countdownRaw.split(':').map(Number);
  const countdownSeconds = (countdownParts[0] || 0) * 3600 + (countdownParts[1] || 0) * 60 + (countdownParts[2] || 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      <AchievementPopup
        achievement={currentPopup}
        onDismiss={() => setCurrentPopup(null)}
        cardColor={CARD}
        textColor={TEXT}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}>

          {/* Brand */}
          <Text style={[styles.brand, { color: SUBTEXT }]}>WORD SEARCH</Text>

          {/* Title + subtitle */}
          <Text style={[styles.title, { color: TEXT }]}>{getTitle()}</Text>
          <Text style={[styles.subtitle, { color: SUBTEXT }]}>{getSubtitle()}</Text>

          {/* Theme + difficulty pill */}
          <View style={[styles.themePill, { borderColor: COLORS.accent }]}>
            <Text style={[styles.themePillText, { color: COLORS.accent }]}>
              {themeName}{difficulty ? ` · ${getDiffLabel()}` : ''}
            </Text>
          </View>

          {/* ── This Game ── */}
          <View style={[styles.divider, { backgroundColor: BORDER }]} />
          <Text style={[styles.sectionTitle, { color: TEXT }]}>THIS GAME</Text>
          <View style={styles.statsRow}>
            <StatPill label="Found" value={`${foundWords}/${totalWords}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
            <StatPill label="Time" value={timeString} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
          </View>
          <View style={styles.statsRow}>
            <StatPill label="Score" value={score.toLocaleString()} textColor={COLORS.accent} borderColor={BORDER} backgroundColor={BG} />
            <StatPill
              label="Complete"
              value={`${Math.round((foundWords / Math.max(totalWords, 1)) * 100)}%`}
              textColor={allFound ? COLORS.accent : TEXT}
              borderColor={BORDER}
              backgroundColor={BG}
            />
          </View>

          {/* ── Score Breakdown (when all found) ── */}
          {allFound && (
            <>
              <View style={[styles.divider, { backgroundColor: BORDER }]} />
              <Text style={[styles.sectionTitle, { color: TEXT }]}>SCORE BREAKDOWN</Text>
              <View style={styles.statsRow}>
                <StatPill label="Words" value={`${wordPoints} pts`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
                <StatPill label="Time Bonus" value={`+${timeBonus}`} textColor={COLORS.accent} borderColor={BORDER} backgroundColor={BG} />
              </View>
              {multiplier > 1 && (
                <View style={styles.statsRow}>
                  <StatPill label="Multiplier" value={`${multiplier}×`} textColor="#f59e0b" borderColor={BORDER} backgroundColor={BG} />
                </View>
              )}
            </>
          )}

          {/* ── Lifetime Stats ── */}
          {lifetimeStats && lifetimeStats.gamesPlayed > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: BORDER }]} />
              <Text style={[styles.sectionTitle, { color: TEXT }]}>YOUR STATS</Text>
              <View style={styles.statsRow}>
                <StatPill label="Best Score" value={lifetimeStats.bestScore.toLocaleString()} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
                <StatPill label="Streak" value={`${lifetimeStats.currentStreak}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
              </View>
              <View style={styles.statsRow}>
                <StatPill label="Games" value={`${lifetimeStats.gamesPlayed}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
                <StatPill label="Words Found" value={lifetimeStats.totalWordsFound.toLocaleString()} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
              </View>
            </>
          )}

          {/* ── Daily Countdown ── */}
          {isDaily && countdownSeconds > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: BORDER }]} />
              <Text style={[styles.countdownLabel, { color: SUBTEXT }]}>Next Daily in</Text>
              <Text style={[styles.countdownValue, { color: TEXT }]}>{formatCountdown(countdownSeconds)}</Text>
            </>
          )}

          {/* ── Buttons ── */}
          <View style={styles.buttonRow}>
            <PrimaryButton
              label="Main Menu"
              onPress={() => router.navigate('/wordsearch')}
              borderColor={BORDER}
              textColor={TEXT}
              backgroundColor={BG}
            />
            <PrimaryButton
              label={isDaily ? 'Play' : 'Play Again'}
              onPress={() => router.push('/wordsearch/play')}
              borderColor={BORDER}
              textColor={TEXT}
              backgroundColor={BG}
            />
          </View>

          {/* ── Share (green, Wordle style) ── */}
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

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scroll: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  // Card (Wordle style)
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
  },

  // Brand
  brand: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },

  // Title / subtitle
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Theme pill
  themePill: {
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Section divider
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.35,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Stat pills row
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

  // Countdown
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
  },

  // Buttons
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

  // Share button (green, Wordle style)
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
