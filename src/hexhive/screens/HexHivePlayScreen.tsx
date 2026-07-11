// src/hexhive/screens/HexHivePlayScreen.tsx
// Core gameplay screen — used by both the daily puzzle and Quick Play mode.
// Owns the current guess, found-word set, scoring, achievement checks, and
// persistence for whichever mode it's given.
//
// Quick Play gets a 60-second timer (a fast-burst mode with no streak);
// Daily stays untimed and persistent, matching the reference game. Both the
// Quick Play "Time's Up!" summary and the Daily "Full Clear!" celebration are
// centered modal overlays on top of the (locked or still-playable) board,
// mirroring Wordle's WordleResultOverlay layout: brand → title/subtitle → a
// boxed highlight (rank, standing in for Wordle's "Solution" box) → stat-pill
// sections → button row → share button → dismiss button.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2, X } from 'lucide-react-native';
import { useTheme } from '../../shared/ThemeContext';
import { AchievementPopup } from '../../shared/AchievementPopup';
import HexGrid, { type Feedback } from '../components/HexGrid';
import WordList from '../components/WordList';
import RankProgressBar from '../components/RankProgressBar';
import type { HexHivePuzzle } from '../data/puzzles';
import { getPuzzleSolution, shuffleLetters, getTodayDateString, formatDisplayDate } from '../utils/generator';
import { checkGuess } from '../utils/validator';
import { getRankProgress, scoreWordForPuzzle } from '../utils/scoring';
import {
  bumpStreakForToday,
  bumpFullClearStreakForToday,
  loadHexHiveStats,
  saveHexHiveStats,
  saveDailyProgress,
  saveDailyHistoryEntry,
  type HexHiveStats,
} from '../utils/storage';
import {
  checkWordAchievements,
  checkProgressAchievements,
  checkPracticeRoundAchievements,
  type Achievement,
} from '../utils/achievements';

const ACCENT = '#D4A017'; // Hex Hive's own accent — warm honey gold, distinct from other games
const QUICK_PLAY_SECONDS = 60;

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface HexHivePlayScreenProps {
  puzzle: HexHivePuzzle;
  mode: 'daily' | 'practice';
  initialFoundWords?: string[];
  onGoHome: () => void;
  onPlayAgain?: () => void; // practice-only
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
  onPress?: () => void;
  borderColor: string;
  textColor: string;
  backgroundColor: string;
}) => (
  <Pressable
    style={({ pressed }) => [styles.primaryButton, { borderColor, backgroundColor, opacity: pressed ? 0.75 : 1 }]}
    onPress={onPress}
  >
    <Text style={[styles.primaryButtonText, { color: textColor }]}>{label}</Text>
  </Pressable>
);

export default function HexHivePlayScreen({ puzzle, mode, initialFoundWords, onGoHome, onPlayAgain }: HexHivePlayScreenProps) {
  const { background } = useTheme();
  const solution = useMemo(() => getPuzzleSolution(puzzle), [puzzle]);

  const [foundWords, setFoundWords] = useState<string[]>(initialFoundWords ?? []);
  const foundSet = useMemo(() => new Set(foundWords), [foundWords]);
  const [outerLetters, setOuterLetters] = useState<string[]>(() =>
    shuffleLetters(puzzle.letters.filter((l) => l !== puzzle.center))
  );
  const [currentGuess, setCurrentGuess] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const statsRef = useRef<HexHiveStats | null>(null);

  // Quick Play only: 60-second countdown, no timer at all for Daily.
  const [timeLeft, setTimeLeft] = useState(QUICK_PLAY_SECONDS);
  const [gameOver, setGameOver] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [finalStats, setFinalStats] = useState<HexHiveStats | null>(null);

  // Daily only: one-time "Full Clear!" celebration the moment every word in
  // today's hive has been found.
  const [showFullClearCelebration, setShowFullClearCelebration] = useState(false);

  useEffect(() => {
    loadHexHiveStats().then((s) => {
      statsRef.current = s;
    });
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const score = useMemo(
    () => foundWords.reduce((sum, w) => sum + scoreWordForPuzzle(w, solution.pangrams.includes(w)), 0),
    [foundWords, solution]
  );
  const rank = getRankProgress(score, solution.maxScore);

  const queueAchievements = (newOnes: Achievement[]) => {
    if (newOnes.length > 0) setAchievementQueue((q) => [...q, ...newOnes]);
  };

  const handleTimeUp = async () => {
    setGameOver(true);
    setResultsVisible(true);
    let stats = statsRef.current ?? (await loadHexHiveStats());
    stats = { ...stats, practicePuzzlesPlayed: stats.practicePuzzlesPlayed + 1 };
    statsRef.current = stats;
    setFinalStats(stats);
    await saveHexHiveStats(stats);

    const roundAch = await checkPracticeRoundAchievements(stats);
    queueAchievements(roundAch);
  };

  useEffect(() => {
    if (mode !== 'practice') return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const flashFeedback = (fb: Feedback) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(fb);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1200);
  };

  const handleSubmit = async () => {
    if (gameOver) return;
    const result = checkGuess(currentGuess, puzzle, foundSet);

    if (result.status !== 'valid') {
      flashFeedback(
        result.status === 'already_found'
          ? 'already_found'
          : result.status === 'too_short'
          ? 'too_short'
          : result.status === 'not_a_word' || result.status === 'invalid_letters' || result.status === 'missing_center'
          ? 'invalid'
          : null
      );
      setCurrentGuess('');
      return;
    }

    const word = currentGuess.trim().toLowerCase();
    const newFound = [...foundWords, word];
    setFoundWords(newFound);
    setCurrentGuess('');
    flashFeedback(result.isPangram ? 'pangram' : 'valid');

    // Compute the up-to-date score/rank including this word — `score`/`rank`
    // from render still reflect the pre-submit state since setFoundWords
    // hasn't re-rendered yet.
    const newScore = score + scoreWordForPuzzle(word, result.isPangram);
    const newRank = getRankProgress(newScore, solution.maxScore);
    const newFullyCleared = newFound.length >= solution.words.length && solution.words.length > 0;

    if (mode === 'daily') {
      await saveDailyProgress({ dateISO: getTodayDateString(), foundWords: newFound });
    }

    // Update stats — daily and Quick Play each get their own lifetime
    // counters, plus a combined lifetime total used for the volume ladder.
    let stats = statsRef.current ?? (await loadHexHiveStats());
    stats = { ...stats };

    if (mode === 'daily') {
      stats = bumpStreakForToday(stats);
      stats.dailyWordsFound += 1;
      if (result.isPangram) stats.dailyPangramsFound += 1;
    } else {
      stats.practiceWordsFound += 1;
      if (result.isPangram) stats.practicePangramsFound += 1;
    }

    stats.totalWordsFound += 1;
    if (result.isPangram) stats.totalPangramsFound += 1;
    if (word.length > stats.longestWordFound.length) stats.longestWordFound = word;

    if (mode === 'daily') {
      stats.bestDailyScore = Math.max(stats.bestDailyScore, newScore);
      stats.bestDailyRankIndex = Math.max(stats.bestDailyRankIndex, newRank.index);
      stats.bestDailyWordCount = Math.max(stats.bestDailyWordCount, newFound.length);
      if (newFullyCleared) {
        stats = bumpFullClearStreakForToday(stats);
        stats.fullClears += 1;
      }
    } else {
      stats.practiceBestScore = Math.max(stats.practiceBestScore, newScore);
      stats.practiceBestWordCount = Math.max(stats.practiceBestWordCount, newFound.length);
    }
    statsRef.current = stats;
    await saveHexHiveStats(stats);

    if (mode === 'daily') {
      await saveDailyHistoryEntry({
        dateISO: getTodayDateString(),
        score: newScore,
        maxScore: solution.maxScore,
        wordsFound: newFound.length,
        totalWords: solution.words.length,
        rankIndex: newRank.index,
        rankName: newRank.name,
        fullyCleared: newFullyCleared,
      });

      if (newFullyCleared) {
        setShowFullClearCelebration(true);
      }
    }

    const wordAch = await checkWordAchievements({ word, isPangram: result.isPangram }, stats);
    const progressAch = await checkProgressAchievements(stats, newRank.index, newRank.name, newFullyCleared);
    queueAchievements([...wordAch, ...progressAch]);
  };

  const handleLetterPress = (letter: string) => {
    if (gameOver) return;
    setCurrentGuess((g) => (g.length < 20 ? g + letter : g));
  };
  const handleDelete = () => setCurrentGuess((g) => g.slice(0, -1));
  const handleShuffle = () => setOuterLetters((prev) => shuffleLetters(prev));

  const handleShareResult = async () => {
    const message = `Hex Hive — Quick Play\n${rank.name} rank\n${score} points · ${foundWords.length} word${foundWords.length === 1 ? '' : 's'}`;
    try {
      await Share.share({ message });
    } catch {}
  };

  const handleShareFullClear = async () => {
    const message = `Hex Hive — Daily\n${formatDisplayDate()}\nFull Clear! ${rank.name} rank\n${solution.words.length} words · ${score} points`;
    try {
      await Share.share({ message });
    } catch {}
  };

  const sortedFound = useMemo(() => [...foundWords].sort(), [foundWords]);

  const timerColor = timeLeft > 20 ? background.textColor : timeLeft > 10 ? '#f59e0b' : '#e94560';

  const BG = background.backgroundColor;
  const TEXT = background.textColor;
  const SUBTEXT = background.secondaryText;
  const CARD = background.cardColor;
  const BORDER = background.borderColor;

  const pangramsFound = foundWords.filter((w) => solution.pangrams.includes(w)).length;
  const showViewResultsPill = mode === 'practice' && gameOver && !resultsVisible;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      <AchievementPopup
        achievement={achievementQueue[0] ?? null}
        onDismiss={() => setAchievementQueue((q) => q.slice(1))}
        backgroundColor={CARD}
        textColor={TEXT}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onGoHome}>
          <Text style={[styles.backText, { color: SUBTEXT }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap} pointerEvents="box-none">
          {mode === 'practice' && !gameOver ? (
            <Text style={[styles.title, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
          ) : showViewResultsPill ? (
            <TouchableOpacity onPress={() => setResultsVisible(true)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.title, { color: ACCENT }]}>View Results</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.title, { color: TEXT }]}>{mode === 'daily' ? 'Daily Hex Hive' : 'Hex Hive'}</Text>
          )}
        </View>
      </View>

      <View style={styles.rankBarWrap}>
        <RankProgressBar
          rankIndex={rank.index}
          score={score}
          accentColor={ACCENT}
          textColor={TEXT}
          borderColor={BORDER}
        />
      </View>

      <View style={styles.boardCard}>
        <HexGrid
          outerLetters={outerLetters}
          center={puzzle.center}
          currentGuess={currentGuess}
          feedback={feedback}
          onLetterPress={handleLetterPress}
          onDelete={handleDelete}
          onShuffle={handleShuffle}
          onSubmit={handleSubmit}
          accentColor={ACCENT}
          textColor={TEXT}
          secondaryTextColor={SUBTEXT}
          tileColor={ACCENT + '17'}
          cardColor={CARD}
          borderColor={BORDER}
        />
      </View>

      <ScrollView
        style={styles.wordListWrap}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <WordList
          foundWords={sortedFound}
          pangrams={new Set(solution.pangrams)}
          textColor={TEXT}
          secondaryTextColor={SUBTEXT}
          accentColor={ACCENT}
          borderColor={BORDER}
        />
      </ScrollView>

      {mode === 'practice' && gameOver && resultsVisible && (
        <View style={[styles.overlay, { backgroundColor: BG }]}>
          <View style={[styles.pageHeader, { borderColor: BORDER }]}>
            <View style={styles.headerSpacer} />
            <Text style={[styles.brand, { color: SUBTEXT }]}>HEX HIVE</Text>
            <Pressable
              style={({ pressed }) => [styles.closeIconButton, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => setResultsVisible(false)}
              hitSlop={10}
            >
              <X size={22} color={SUBTEXT} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={[styles.title2, { color: TEXT }]}>Time&apos;s Up!</Text>
            <Text style={[styles.subtitle, { color: SUBTEXT }]}>
              You found {foundWords.length} word{foundWords.length === 1 ? '' : 's'} this round.
            </Text>

            <View style={[styles.rankBox, { borderColor: BORDER }]}>
              <Text style={[styles.rankBoxLabel, { color: SUBTEXT }]}>RANK</Text>
              <Text style={[styles.rankBoxValue, { color: ACCENT }]}>{rank.name}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: BORDER }]} />
            <Text style={[styles.sectionTitle, { color: TEXT }]}>This Round</Text>
            <View style={styles.statsRow}>
              <StatPill label="Score" value={`${score}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
              <StatPill label="Words" value={`${foundWords.length}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
              <StatPill label="Pangrams" value={`${pangramsFound}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
            </View>

            {finalStats && (
              <>
                <View style={[styles.divider, { backgroundColor: BORDER }]} />
                <Text style={[styles.sectionTitle, { color: TEXT }]}>Stats</Text>
                <View style={styles.statsRow}>
                  <StatPill
                    label="Best Score"
                    value={`${finalStats.practiceBestScore}`}
                    textColor={TEXT}
                    borderColor={BORDER}
                    backgroundColor={CARD}
                  />
                  <StatPill
                    label="Rounds Played"
                    value={`${finalStats.practicePuzzlesPlayed}`}
                    textColor={TEXT}
                    borderColor={BORDER}
                    backgroundColor={CARD}
                  />
                </View>
              </>
            )}

            <View style={styles.buttonRow}>
              <PrimaryButton label="Play Again" onPress={onPlayAgain} borderColor={BORDER} textColor={TEXT} backgroundColor={CARD} />
              <PrimaryButton label="Main Menu" onPress={onGoHome} borderColor={BORDER} textColor={TEXT} backgroundColor={CARD} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.75 : 1 }]}
              onPress={handleShareResult}
            >
              <View style={styles.shareButtonInner}>
                <Share2 size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Share Result</Text>
              </View>
            </Pressable>
          </View>
          </ScrollView>
        </View>
      )}

      {mode === 'daily' && showFullClearCelebration && (
        <View style={[styles.overlay, { backgroundColor: BG }]}>
          <View style={[styles.pageHeader, { borderColor: BORDER }]}>
            <View style={styles.headerSpacer} />
            <Text style={[styles.brand, { color: SUBTEXT }]}>HEX HIVE</Text>
            <Pressable
              style={({ pressed }) => [styles.closeIconButton, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => setShowFullClearCelebration(false)}
              hitSlop={10}
            >
              <X size={22} color={SUBTEXT} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={[styles.title2, { color: TEXT }]}>Full Clear! 🐝</Text>
            <Text style={[styles.subtitle, { color: SUBTEXT }]}>
              You found every word in today&apos;s hive.
            </Text>

            <View style={[styles.rankBox, { borderColor: BORDER }]}>
              <Text style={[styles.rankBoxLabel, { color: SUBTEXT }]}>RANK</Text>
              <Text style={[styles.rankBoxValue, { color: ACCENT }]}>{rank.name}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: BORDER }]} />
            <Text style={[styles.sectionTitle, { color: TEXT }]}>Today</Text>
            <View style={styles.statsRow}>
              <StatPill label="Score" value={`${score}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
              <StatPill label="Words" value={`${foundWords.length}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
              <StatPill label="Pangrams" value={`${pangramsFound}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
            </View>

            <View style={styles.buttonRow}>
              <PrimaryButton
                label="Keep Playing"
                onPress={() => setShowFullClearCelebration(false)}
                borderColor={BORDER}
                textColor={TEXT}
                backgroundColor={CARD}
              />
              <PrimaryButton label="Main Menu" onPress={onGoHome} borderColor={BORDER} textColor={TEXT} backgroundColor={CARD} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.75 : 1 }]}
              onPress={handleShareFullClear}
            >
              <View style={styles.shareButtonInner}>
                <Share2 size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Share Result</Text>
              </View>
            </Pressable>
          </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    position: 'relative',
  },
  backButton: { padding: 8, marginLeft: -8, zIndex: 1 },
  backText: { fontSize: 16, fontWeight: '500' },
  titleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  rankBarWrap: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  boardCard: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  wordListWrap: { flex: 1, marginTop: 14 },

  // Result overlay — mirrors Wordle's full-page WordleResultOverlay layout/colors.
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  scrollContent: { alignItems: 'center', padding: 18 },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 4,
  },
  brand: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title2: { textAlign: 'center', fontSize: 22, fontWeight: '900', marginBottom: 4, marginTop: 12 },
  subtitle: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  rankBox: { borderWidth: 2, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  rankBoxLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  rankBoxValue: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  divider: { height: 1, marginVertical: 12, opacity: 0.35 },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 8, textAlign: 'center', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  statPill: { borderWidth: 2, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, minWidth: 100, alignItems: 'center' },
  statPillLabel: { fontSize: 11, fontWeight: '800', opacity: 0.8, marginBottom: 2 },
  statPillValue: { fontSize: 14, fontWeight: '900' },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12 },
  primaryButton: { borderWidth: 2, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, minWidth: 120, alignItems: 'center' },
  primaryButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  shareButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#22c55e',
  },
  shareButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareButtonText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  secondaryButton: { marginTop: 10, borderWidth: 2, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
