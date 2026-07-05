// src/hexhive/screens/HexHivePlayScreen.tsx
// Core gameplay screen — used by both the daily puzzle and untimed Quick
// Play mode. Owns the current guess, found-word set, scoring, achievement
// checks, and persistence for whichever mode it's given.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

interface HexHivePlayScreenProps {
  puzzle: HexHivePuzzle;
  mode: 'daily' | 'practice';
  initialFoundWords?: string[];
  onGoHome: () => void;
}

export default function HexHivePlayScreen({ puzzle, mode, initialFoundWords, onGoHome }: HexHivePlayScreenProps) {
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

  const flashFeedback = (fb: Feedback) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(fb);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1200);
  };

  const queueAchievements = (newOnes: Achievement[]) => {
    if (newOnes.length > 0) setAchievementQueue((q) => [...q, ...newOnes]);
  };

  const handleSubmit = async () => {
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

  const handleLetterPress = (letter: string) => setCurrentGuess((g) => (g.length < 20 ? g + letter : g));
  const handleDelete = () => setCurrentGuess((g) => g.slice(0, -1));
  const handleShuffle = () => setOuterLetters((prev) => shuffleLetters(prev));

  const sortedFound = useMemo(() => [...foundWords].sort(), [foundWords]);

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
        <Text style={[styles.title, { color: background.textColor }]}>
          {mode === 'daily' ? 'Daily Hex Hive' : 'Hex Hive'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

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
    paddingTop: 10,
    paddingBottom: 6,
  },
  backButton: { padding: 8, marginLeft: -8 },
  backText: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold' },
  headerPlaceholder: { width: 60 },
  rankBarWrap: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  boardCard: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  wordListWrap: { flex: 1, marginTop: 14 },
});
