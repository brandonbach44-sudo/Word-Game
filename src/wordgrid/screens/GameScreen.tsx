// src/wordgrid/screens/GameScreen.tsx
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';
import { AchievementPopup } from '../../wordbuilder/components/AchievementPopup';
import GridWithGesture from '../components/GridWithGesture';
import { FeedbackOverlay } from './FeedbackOverlay';
import { generateGrid } from '../utils/gridGenerator';
import { validatePath, type Position } from '../utils/pathFinder';
import { calculateWordScore } from '../utils/scoring';
import {
  loadWordGridStats,
  updateStatsAfterGame,
  type WordGridStats,
} from '../utils/storage';
import {
  checkAchievements,
  getUnlockedAchievements,
  ACHIEVEMENTS,
  type Achievement,
} from '../utils/achievements';

const { width } = Dimensions.get('window');

type Screen = 'menu' | 'game' | 'results';
type MenuTab = 'play' | 'stats';
type ResultsPage = 'results' | 'words';

const ROUND_DURATION = 60;

type Feedback = { points: number; success: boolean; key: number };

// ─── Stats Card (matches WordBuilder) ────────────────────────────────────────

const StatsCard = ({
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
}) => (
  <View style={[
    styles.statsCard,
    wide && styles.statsCardWide,
    { backgroundColor: cardColor, borderColor },
  ]}>
    <Text style={[styles.statsValue, { color: textColor }]}>{value}</Text>
    <Text style={[styles.statsLabel, { color: secondaryText }]}>{label}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GameScreen() {
  const { background } = useTheme();
  const bg = background;

  // ── Screen / tab state ────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('menu');
  const [menuTab, setMenuTab] = useState<MenuTab>('play');
  const [resultsPage, setResultsPage] = useState<ResultsPage>('results');
  const resultsScrollRef = useRef<ScrollView>(null);

  // Tab swipe animation (2 tabs: play, stats)
  const TABS: MenuTab[] = ['play', 'stats'];
  const tabAnim = useRef(new Animated.Value(0)).current;
  const currentTabIdxRef = useRef(0);
  const dragBase = useRef(0);

  useEffect(() => {
    currentTabIdxRef.current = TABS.indexOf(menuTab);
  }, [menuTab]);

  const switchToTab = useCallback((tab: MenuTab) => {
    const newIdx = TABS.indexOf(tab);
    setMenuTab(tab);
    Animated.spring(tabAnim, {
      toValue: newIdx,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  }, []);

  const menuPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.2,
      onPanResponderGrant: () => {
        tabAnim.stopAnimation();
        dragBase.current = currentTabIdxRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const raw = dragBase.current - gs.dx / width;
        tabAnim.setValue(Math.max(0, Math.min(TABS.length - 1, raw)));
      },
      onPanResponderRelease: (_, gs) => {
        const base = dragBase.current;
        let newIdx = Math.round(base);
        if (gs.dx < -25 || gs.vx < -0.3) newIdx = Math.min(Math.floor(base) + 1, TABS.length - 1);
        else if (gs.dx > 25 || gs.vx > 0.3) newIdx = Math.max(Math.ceil(base) - 1, 0);
        currentTabIdxRef.current = newIdx;
        setMenuTab(TABS[newIdx]);
        Animated.spring(tabAnim, {
          toValue: newIdx,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }).start();
      },
    })
  ).current;

  // ── Stats & achievements ──────────────────────────────────────────────────
  const [stats, setStats] = useState<WordGridStats | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    (Achievement & { unlockedAt: string })[]
  >([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    loadWordGridStats().then(setStats);
    getUnlockedAchievements().then(setUnlockedAchievements);
  }, []);

  useEffect(() => {
    if (!currentAchievement && pendingAchievements.length > 0) {
      const [next, ...rest] = pendingAchievements;
      setCurrentAchievement(next);
      setPendingAchievements(rest);
    }
  }, [currentAchievement, pendingAchievements]);

  // ── Game state ────────────────────────────────────────────────────────────
  const [grid, setGrid] = useState<string[][]>(() => generateGrid(4));
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState<{ word: string; points: number }[]>([]);
  const [foundWordSet, setFoundWordSet] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const feedbackKeyRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePathComplete = useCallback(
    (path: Position[]) => {
      const { word, valid } = validatePath(grid, path);
      const key = ++feedbackKeyRef.current;

      if (valid && !foundWordSet.has(word)) {
        const longestSoFar =
          foundWords.length > 0
            ? foundWords.reduce((max, w) => (w.word.length > max ? w.word.length : max), 0)
            : 0;
        const isLongestWord = word.length > longestSoFar;
        const isAllTile = path.length === 16;
        const points = calculateWordScore(word, { isLongestWord, isAllTile });

        setScore((prev) => prev + points);
        setFoundWords((prev) => [{ word, points }, ...prev]);
        setFoundWordSet((prev) => new Set([...prev, word]));
        setFeedbacks((prev) => [...prev, { points, success: true, key }]);
      } else {
        setFeedbacks((prev) => [...prev, { points: 0, success: false, key }]);
      }
    },
    [grid, foundWords, foundWordSet]
  );

  const removeFeedback = useCallback((key: number) => {
    setFeedbacks((prev) => prev.filter((f) => f.key !== key));
  }, []);

  // Save stats + check achievements when game ends, then go to results screen
  useEffect(() => {
    if (!gameOver) return;
    (async () => {
      const newStats = await updateStatsAfterGame({ score, words: foundWords });
      setStats(newStats);

      const newly = await checkAchievements({
        score,
        words: foundWords,
        gamesPlayed: newStats.gamesPlayed,
        totalWordsFound: newStats.totalWordsFound,
        totalScore: newStats.totalScore,
      });

      if (newly.length > 0) {
        setPendingAchievements((prev) => [...prev, ...newly]);
        getUnlockedAchievements().then(setUnlockedAchievements);
      }

      setResultsPage('results');
      setScreen('results');
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGrid(generateGrid(4));
    setScore(0);
    setFoundWords([]);
    setFoundWordSet(new Set());
    setTimeLeft(ROUND_DURATION);
    setGameOver(false);
    setFeedbacks([]);
    setScreen('game');
    setTimeout(startTimer, 100);
  }, [startTimer]);

  const handlePlayAgain = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGrid(generateGrid(4));
    setScore(0);
    setFoundWords([]);
    setFoundWordSet(new Set());
    setTimeLeft(ROUND_DURATION);
    setGameOver(false);
    setFeedbacks([]);
    setResultsPage('results');
    setScreen('game');
    setTimeout(startTimer, 100);
  }, [startTimer]);

  const handleBackToMenu = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(false);
    setResultsPage('results');
    setScreen('menu');
    switchToTab('play');
  }, [switchToTab]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timerColor =
    timeLeft > 30 ? bg.textColor : timeLeft > 10 ? '#f59e0b' : COLORS.danger;

  const { lockedAchievements } = useMemo(() => {
    const unlockedSet = new Set(unlockedAchievements.map((a) => a.id));
    const clamp = (v: number, t: number) => Math.min(v / t, 1);
    const gp = stats?.gamesPlayed ?? 0;
    const tw = stats?.totalWordsFound ?? 0;
    const ls = stats?.totalScore ?? 0;
    const progressMap: Record<string, number> = {
      games_10:          clamp(gp, 10),
      games_50:          clamp(gp, 50),
      games_100:         clamp(gp, 100),
      games_250:         clamp(gp, 250),
      games_500:         clamp(gp, 500),
      total_words_250:   clamp(tw, 250),
      total_words_1000:  clamp(tw, 1000),
      total_words_5000:  clamp(tw, 5000),
      lifetime_50000:    clamp(ls, 50000),
      lifetime_100000:   clamp(ls, 100000),
      lifetime_500000:   clamp(ls, 500000),
      lifetime_1000000:  clamp(ls, 1000000),
    };
    const lockedAchievements = ACHIEVEMENTS
      .filter((a) => !unlockedSet.has(a.id))
      .map((a) => ({ ...a, progress: progressMap[a.id] ?? 0 }));
    return { unlockedSet, lockedAchievements };
  }, [unlockedAchievements, stats]);

  // ─────────────────────────────────────────────────────────────────────────
  // RESULTS SCREEN — swipeable carousel like WordBuilder
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'results') {
    const bestLen = foundWords.length > 0
      ? foundWords.reduce((max, w) => w.word.length > max ? w.word.length : max, 0)
      : 0;
    const bestPts = foundWords.length > 0
      ? foundWords.reduce((max, w) => w.points > max ? w.points : max, 0)
      : 0;

    const handleResultsScroll = (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / width);
      setResultsPage(page === 0 ? 'results' : 'words');
    };

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg.backgroundColor }]}>
        <StatusBar barStyle={bg.statusBar === 'dark' ? 'dark-content' : 'light-content'} />

        <AchievementPopup
          achievement={currentAchievement}
          onDismiss={() => setCurrentAchievement(null)}
          backgroundColor={bg.cardColor}
          textColor={bg.textColor}
        />

        {/* Horizontal swipe carousel */}
        <ScrollView
          ref={resultsScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleResultsScroll}
          style={{ flex: 1 }}
        >
          {/* ── PAGE 1: RESULTS ── */}
          <View style={[styles.carouselPage, { width }]}>
            <ScrollView
              contentContainerStyle={styles.resultsPageContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.gameOverTitle, { color: bg.textColor }]}>Time's Up!</Text>

              <Text style={[styles.finalScore, { color: COLORS.accent }]}>{score}</Text>
              <Text style={[styles.finalScoreLabel, { color: bg.secondaryText }]}>points</Text>

              <View style={[styles.statsSummary, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: bg.textColor }]}>{foundWords.length}</Text>
                  <Text style={[styles.statLabel, { color: bg.secondaryText }]}>Words</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: bg.borderColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: bg.textColor }]}>{bestLen}</Text>
                  <Text style={[styles.statLabel, { color: bg.secondaryText }]}>Best Length</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: bg.borderColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: bg.textColor }]}>{bestPts}</Text>
                  <Text style={[styles.statLabel, { color: bg.secondaryText }]}>Best Word</Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
                  <Text style={styles.playAgainText}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: bg.backgroundColor, borderColor: bg.borderColor }]}
                  onPress={handleBackToMenu}
                >
                  <Text style={[styles.menuButtonText, { color: bg.textColor }]}>Back to Menu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* ── PAGE 2: WORDS FOUND ── */}
          <View style={[styles.carouselPage, { width }]}>
            <Text style={[styles.wordsPageTitle, { color: bg.textColor }]}>Words Found</Text>
            <Text style={[styles.wordsPageSubtitle, { color: bg.secondaryText }]}>
              {foundWords.length} word{foundWords.length !== 1 ? 's' : ''}
            </Text>

            <FlatList
              data={[...foundWords].sort((a, b) => b.points - a.points)}
              keyExtractor={(item, i) => `${item.word}-${i}`}
              style={styles.wordsList}
              contentContainerStyle={styles.wordsListContent}
              numColumns={2}
              renderItem={({ item }) => (
                <View style={[styles.wordItem, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}>
                  <Text style={[styles.wordText, { color: bg.textColor }]}>{item.word}</Text>
                  <Text style={[styles.wordScore, { color: bg.secondaryText }]}>{item.points} pts</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[styles.noWordsText, { color: bg.secondaryText }]}>No words found this round</Text>
              }
            />

            <TouchableOpacity
              style={[styles.menuButton, styles.wordsPageButton, { backgroundColor: bg.backgroundColor, borderColor: bg.borderColor }]}
              onPress={handleBackToMenu}
            >
              <Text style={[styles.menuButtonText, { color: bg.textColor }]}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Page indicator */}
        <View style={styles.pageIndicatorContainer}>
          <View style={styles.pageIndicatorLabels}>
            <Text style={[styles.pageIndicatorLabel, { color: resultsPage === 'results' ? bg.textColor : bg.secondaryText }]}>
              Results
            </Text>
            <Text style={[styles.pageIndicatorLabel, { color: resultsPage === 'words' ? bg.textColor : bg.secondaryText }]}>
              Words Found
            </Text>
          </View>
          <View style={styles.pageIndicator}>
            <View style={[styles.pageDot, resultsPage === 'results' && styles.pageDotActive]} />
            <View style={[styles.pageDot, resultsPage === 'words' && styles.pageDotActive]} />
          </View>
          {resultsPage === 'results' && (
            <Text style={[styles.swipeHintText, { color: bg.secondaryText }]}>Swipe to see words →</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GAME SCREEN — matches WordBuilder layout
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'game') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg.backgroundColor }]}>
        <StatusBar barStyle={bg.statusBar === 'dark' ? 'dark-content' : 'light-content'} />

        <AchievementPopup
          achievement={currentAchievement}
          onDismiss={() => setCurrentAchievement(null)}
          backgroundColor={bg.cardColor}
          textColor={bg.textColor}
        />

        {/* Header: Back | Timer | Score */}
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={handleBackToMenu}>
            <Text style={[styles.backText, { color: bg.secondaryText }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.timerText, { color: timerColor }, timeLeft <= 10 && styles.timerWarning]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={[styles.scoreText, { color: COLORS.accent }]}>{score} pts</Text>
        </View>

        {/* Spacer pushes grid toward middle/bottom for thumb reach */}
        <View style={{ flex: 1 }} />

        {/* Grid */}
        <View style={styles.gridWrapper}>
          <GridWithGesture
            grid={grid}
            onPathComplete={handlePathComplete}
            disabled={gameOver}
          />
          {feedbacks.map((f) => (
            <FeedbackOverlay
              key={f.key}
              points={f.points}
              success={f.success}
              onComplete={() => removeFeedback(f.key)}
            />
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* Found words — same badge style as WordBuilder */}
        <View style={styles.foundWordsSection}>
          <Text style={[styles.foundWordsTitle, { color: bg.secondaryText }]}>
            Found: {foundWords.length}
          </Text>
          <View style={styles.foundWordsWrap}>
            {foundWords.slice(0, 24).map((item, index) => (
              <View key={index} style={styles.foundWordBadge}>
                <Text style={styles.foundWordText}>{item.word.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MENU SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg.backgroundColor }]}>
      <StatusBar barStyle={bg.statusBar === 'dark' ? 'dark-content' : 'light-content'} />

      <AchievementPopup
        achievement={currentAchievement}
        onDismiss={() => setCurrentAchievement(null)}
        backgroundColor={bg.cardColor}
        textColor={bg.textColor}
      />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: bg.secondaryText }]}>← Games</Text>
        </TouchableOpacity>
        <Text style={[styles.appTitle, { color: bg.textColor }]}>Word Grid</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Segment Switcher pill (matches WordBuilder) */}
      <View style={[styles.segmentSwitcher, { backgroundColor: bg.cardColor }]}>
        {TABS.map((tab) => {
          const isActive = tab === menuTab;
          return (
            <Pressable
              key={tab}
              style={[styles.segmentButton, isActive && { backgroundColor: bg.backgroundColor }]}
              onPress={() => switchToTab(tab)}
            >
              <Text style={[
                styles.segmentButtonText,
                { color: bg.secondaryText },
                isActive && { color: bg.textColor, fontWeight: '600' },
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Swipeable tab strip */}
      <View style={styles.tabStripWrapper} {...menuPanResponder.panHandlers}>
        <Animated.View style={[
          styles.tabStrip,
          {
            transform: [{
              translateX: tabAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -width],
              }),
            }],
          },
        ]}>

          {/* ── PLAY TAB ── */}
          <ScrollView
            style={{ width, flex: 1 }}
            contentContainerStyle={styles.playContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Play button — large, prominent CTA */}
            <TouchableOpacity
              style={styles.quickPlayButton}
              onPress={startGame}
              activeOpacity={0.82}
            >
              <Text style={styles.quickPlayIcon}>▶</Text>
              <View>
                <Text style={styles.quickPlayTitle}>Quick Play</Text>
                <Text style={styles.quickPlaySub}>1 minute · 4×4 letter grid</Text>
              </View>
            </TouchableOpacity>

            {/* How to Play */}
            <View style={[styles.rulesCard, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}>
              <Text style={[styles.rulesTitle, { color: bg.textColor }]}>How to Play</Text>
              {[
                'Swipe across adjacent letters to form a word',
                'Letters must connect — horizontally, vertically, or diagonally',
                'Each letter can only be used once per word',
                'Words must be 3 or more letters long',
                'Score big with long words and rare letters (Q, Z, J, X)',
              ].map((rule, i) => (
                <View key={i} style={styles.ruleItem}>
                  <Text style={[styles.ruleNumber, { color: COLORS.accent }]}>{i + 1}</Text>
                  <Text style={[styles.ruleText, { color: bg.secondaryText }]}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* ── STATS TAB ── */}
          <ScrollView
            style={{ width, flex: 1 }}
            contentContainerStyle={styles.statsContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.statsTitle, { color: bg.textColor }]}>Statistics</Text>

            {stats ? (
              <View style={styles.statsGrid}>
                <StatsCard label="Games Played" value={stats.gamesPlayed.toString()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} />
                <StatsCard label="High Score" value={stats.highScore.toLocaleString()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} />
                <StatsCard label="Total Words" value={stats.totalWordsFound.toLocaleString()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} />
                <StatsCard label="Best Words/Game" value={stats.bestWordsInGame.toString()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} />
                <StatsCard label="Lifetime Score" value={stats.totalScore.toLocaleString()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} wide />
                {stats.longestWord ? (
                  <StatsCard label="Longest Word" value={stats.longestWord.toUpperCase()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} wide />
                ) : null}
              </View>
            ) : (
              <Text style={[styles.loadingText, { color: bg.secondaryText }]}>Loading stats...</Text>
            )}

            {/* Achievements — same grid layout as WordBuilder */}
            <Text style={[styles.statsTitle, { color: bg.textColor, marginTop: 25 }]}>
              Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </Text>

            {/* Unlocked */}
            {unlockedAchievements.length > 0 && (
              <View style={styles.achievementsGrid}>
                {ACHIEVEMENTS.filter(a => unlockedAchievements.some(u => u.id === a.id)).map((achievement) => (
                  <View
                    key={achievement.id}
                    style={[styles.achievementCard, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}
                  >
                    <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                    <Text style={[styles.achievementName, { color: bg.textColor }]}>{achievement.name}</Text>
                    <Text style={[styles.achievementDesc, { color: bg.secondaryText }]}>{achievement.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Locked divider */}
            {unlockedAchievements.length > 0 && lockedAchievements.length > 0 && (
              <View style={styles.lockedDivider}>
                <View style={[styles.dividerLine, { backgroundColor: bg.borderColor }]} />
                <Text style={[styles.dividerText, { color: bg.secondaryText }]}>Locked</Text>
                <View style={[styles.dividerLine, { backgroundColor: bg.borderColor }]} />
              </View>
            )}

            {/* Locked */}
            {lockedAchievements.length > 0 && (
              <View style={styles.achievementsGrid}>
                {lockedAchievements.map((achievement) => (
                  <View
                    key={achievement.id}
                    style={[styles.achievementCard, styles.achievementCardLocked, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}
                  >
                    <Text style={[styles.achievementEmoji, { opacity: 0.5 }]}>{achievement.emoji}</Text>
                    <Text style={[styles.achievementName, { color: bg.textColor, opacity: 0.5 }]}>{achievement.name}</Text>
                    <Text style={[styles.achievementDesc, { color: bg.secondaryText, opacity: 0.5 }]}>{achievement.description}</Text>
                    {achievement.progress > 0 && (
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.round(achievement.progress * 100)}%` }]} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Menu header ──
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  backBtn: { minWidth: 70 },
  backText: { fontSize: 16, fontWeight: '500' },

  // ── Segment switcher ──
  segmentSwitcher: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 999,
    padding: 4,
  },
  segmentButton: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 999 },
  segmentButtonText: { fontSize: 14, fontWeight: '500' },

  // ── Tab strip ──
  tabStripWrapper: { flex: 1, overflow: 'hidden', alignItems: 'flex-start' },
  tabStrip: { width: width * 2, flexDirection: 'row', alignSelf: 'flex-start' },

  // ── Play tab ──
  playContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },
  quickPlayButton: {
    backgroundColor: '#4ecca3',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 28,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    // shadow so it lifts off the page
    shadowColor: '#4ecca3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  quickPlayIcon: {
    fontSize: 32,
    color: '#fff',
  },
  quickPlayTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  quickPlaySub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
  },

  rulesCard: { borderRadius: 14, borderWidth: 1.5, padding: 16 },
  rulesTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  ruleItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  ruleNumber: { fontSize: 18, fontWeight: 'bold', width: 28 },
  ruleText: { fontSize: 14, flex: 1, lineHeight: 20 },

  // ── Stats tab ──
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statsCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsCardWide: { width: '100%' },
  statsValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statsLabel: { fontSize: 12, textAlign: 'center' },
  loadingText: { fontSize: 16, textAlign: 'center', marginTop: 20 },

  // ── Achievements grid ──
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  achievementCardLocked: { opacity: 0.5 },
  achievementEmoji: { fontSize: 32, marginBottom: 6 },
  achievementName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  achievementDesc: { fontSize: 11, textAlign: 'center' },
  progressTrack: { marginTop: 8, width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#22c55e' },
  lockedDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 15, fontSize: 14, fontWeight: '500' },

  // ── Game screen ──
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  timerWarning: {
    color: COLORS.danger,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
  },
  gridWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  foundWordsSection: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 180,
    overflow: 'hidden',
  },
  foundWordsTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  foundWordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foundWordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(78,204,163,0.15)',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  foundWordText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },

  // ── Results screen ──
  carouselPage: {
    flex: 1,
    paddingTop: 20,
  },
  resultsPageContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  finalScore: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  finalScoreLabel: {
    fontSize: 24,
    marginBottom: 15,
  },
  statsSummary: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 25,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  statDivider: { width: 1, marginHorizontal: 15 },
  buttonContainer: { width: '100%', alignItems: 'center' },
  playAgainButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  playAgainText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  menuButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    width: '100%',
    alignItems: 'center',
  },
  menuButtonText: { fontSize: 16, fontWeight: '600' },

  // Words page
  wordsPageTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  wordsPageSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 15 },
  wordsList: { flex: 1, paddingHorizontal: 15 },
  wordsListContent: { paddingBottom: 20 },
  wordItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  wordText: { fontSize: 16, fontWeight: '600' },
  wordScore: { fontSize: 12 },
  wordsPageButton: { alignSelf: 'center', marginVertical: 15, width: 'auto' },
  noWordsText: { fontSize: 15, textAlign: 'center', marginTop: 30 },

  // Page indicator
  pageIndicatorContainer: { alignItems: 'center', paddingVertical: 12, paddingBottom: 20 },
  pageIndicatorLabels: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginBottom: 8 },
  pageIndicatorLabel: { fontSize: 12, fontWeight: '500' },
  pageIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  pageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.2)' },
  pageDotActive: { backgroundColor: COLORS.accent },
  swipeHintText: { fontSize: 13, marginTop: 10, fontStyle: 'italic' },
});
