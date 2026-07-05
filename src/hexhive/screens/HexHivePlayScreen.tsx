// src/hexhive/screens/HexHivePlayScreen.tsx
// Core gameplay screen — used by both the daily puzzle and Quick Play mode.
// Owns the current guess, found-word set, scoring, achievement checks, and
// persistence for whichever mode it's given.
//
// Quick Play gets a 60-second timer (a fast-burst mode with no streak);
// Daily stays untimed and persistent, matching the reference game.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2 } from 'lucide-react-native';
import { useTheme } from '../../shared/ThemeContext';
import { AchievementPopup } from '../../shared/AchievementPopup';
import HexGrid, { type Feedback } from '../components/HexGrid';
import WordList from '../components/WordList';
import RankProgressBar from '../components/RankProgressBar';
import type { HexHivePuzzle } from '../data/puzzles';
import { getPuzzleSolution, shuffleLetters, getTodayDateString } from '../utils/generator';
import { checkGuess } from '../utils/validator';
import { getRankProgress, scoreWordForPuzzle } from '../utils/scoring';
import {
  bumpStreakForToday,
  loadHexHiveStats,
  saveHexHiveStats,
  saveDailyProgress,
  saveDailyHistoryEntry,
  type HexHiveStats,
} from '../utils/storage';
import { checkWordAchievements, checkProgressAchievements, type Achievement } from '../utils/achievements';

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

  const handleTimeUp = async () => {
    setGameOver(true);
    const stats = statsRef.current ?? (await loadHexHiveStats());
    const updated = { ...stats, practicePuzzlesPlayed: stats.practicePuzzlesPlayed + 1 };
    statsRef.current = updated;
    await saveHexHiveStats(updated);
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

  const queueAchievements = (newOnes: Achievement[]) => {
    if (newOnes.length > 0) setAchievementQueue((q) => [...q, ...newOnes]);
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

    // Update stats
    let stats = statsRef.current ?? (await loadHexHiveStats());
    if (mode === 'daily') {
      stats = bumpStreakForToday(stats);
    } else {
      stats = { ...stats };
    }
    stats.totalWordsFound += 1;
    if (result.isPangram) stats.totalPangramsFound += 1;
    if (word.length > stats.longestWordFound.length) stats.longestWordFound = word;
    if (mode === 'daily') {
      stats.bestDailyScore = Math.max(stats.bestDailyScore, newScore);
      stats.bestDailyRankIndex = Math.max(stats.bestDailyRankIndex, newRank.index);
      if (newFullyCleared) stats.fullClears += 1;
    } else {
      stats.practiceBestScore = Math.max(stats.practiceBestScore, newScore);
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

  const sortedFound = useMemo(() => [...foundWords].sort(), [foundWords]);

  const timerColor = timeLeft > 20 ? background.textColor : timeLeft > 10 ? '#f59e0b' : '#e94560';
  const showResults = mode === 'practice' && gameOver;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      <AchievementPopup
        achievement={achievementQueue[0] ?? null}
        onDismiss={() => setAchievementQueue((q) => q.slice(1))}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onGoHome}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap} pointerEvents="none">
          {mode === 'practice' && !gameOver ? (
            <Text style={[styles.title, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
          ) : (
            <Text style={[styles.title, { color: background.textColor }]}>
              {mode === 'daily' ? 'Daily Hex Hive' : 'Hex Hive'}
            </Text>
          )}
        </View>
      </View>

      {showResults ? (
        <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.resultsCard, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
            <Text style={[styles.brand, { color: background.secondaryText }]}>HEX HIVE</Text>
            <Text style={[styles.gameOverTitle, { color: background.textColor }]}>Time&apos;s Up!</Text>
            <Text style={[styles.gameOverSubtitle, { color: background.secondaryText }]}>
              {foundWords.length} word{foundWords.length !== 1 ? 's' : ''} · {score} points
            </Text>

            <View style={[styles.resultsDivider, { backgroundColor: background.borderColor }]} />
            <View style={styles.statsRow}>
              <View style={[styles.statPill, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}>
                <Text style={[styles.statPillLabel, { color: background.textColor }]}>Rank</Text>
                <Text style={[styles.statPillValue, { color: ACCENT }]}>{rank.name}</Text>
              </View>
              <View style={[styles.statPill, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}>
                <Text style={[styles.statPillLabel, { color: background.textColor }]}>Score</Text>
                <Text style={[styles.statPillValue, { color: ACCENT }]}>{score}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.statPill, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}>
                <Text style={[styles.statPillLabel, { color: background.textColor }]}>Words</Text>
                <Text style={[styles.statPillValue, { color: background.textColor }]}>{foundWords.length}</Text>
              </View>
              <View style={[styles.statPill, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}>
                <Text style={[styles.statPillLabel, { color: background.textColor }]}>Pangrams</Text>
                <Text style={[styles.statPillValue, { color: background.textColor }]}>
                  {foundWords.filter((w) => solution.pangrams.includes(w)).length}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}
              onPress={onGoHome}
            >
              <Text style={[styles.primaryButtonText, { color: background.textColor }]}>Main Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}
              onPress={onPlayAgain}
            >
              <Text style={[styles.primaryButtonText, { color: background.textColor }]}>Play Again</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareResult} activeOpacity={0.85}>
            <View style={styles.shareButtonInner}>
              <Share2 size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Share Result</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <View style={styles.rankBarWrap}>
            <RankProgressBar
              rankIndex={rank.index}
              score={score}
              accentColor={ACCENT}
              textColor={background.textColor}
              borderColor={background.borderColor}
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
              textColor={background.textColor}
              secondaryTextColor={background.secondaryText}
              tileColor={ACCENT + '17'}
              cardColor={background.cardColor}
              borderColor={background.borderColor}
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
              textColor={background.textColor}
              secondaryTextColor={background.secondaryText}
              accentColor={ACCENT}
              borderColor={background.borderColor}
            />
          </ScrollView>
        </>
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

  resultsScroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  resultsCard: { borderRadius: 20, borderWidth: 1.5, padding: 24, alignItems: 'center' },
  brand: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  gameOverTitle: { fontSize: 24, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  gameOverSubtitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  resultsDivider: { height: 1, width: '100%', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 10 },
  statPill: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  statPillLabel: { fontSize: 11, marginBottom: 2 },
  statPillValue: { fontSize: 16, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  primaryButton: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { fontSize: 15, fontWeight: '600' },
  shareButton: { marginTop: 12, borderRadius: 14, backgroundColor: ACCENT, paddingVertical: 14 },
  shareButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
