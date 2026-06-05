// src/wordgrid/screens/GameScreen.tsx
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';

import { useTheme } from '../../shared/ThemeContext';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'menu' | 'game';
type MenuTab = 'play' | 'stats';

const ROUND_DURATION = 90;

type Feedback = { points: number; success: boolean; key: number };

// ─── Shared stat box ──────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  textColor,
  secondaryText,
  cardColor,
  borderColor,
  wide = false,
}: {
  label: string;
  value: string | number;
  textColor: string;
  secondaryText: string;
  cardColor: string;
  borderColor: string;
  wide?: boolean;
}) {
  return (
    <View
      style={[
        styles.statBox,
        wide && styles.statBoxWide,
        { backgroundColor: cardColor, borderColor },
      ]}
    >
      <Text style={[styles.statBoxValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statBoxLabel, { color: secondaryText }]}>{label}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GameScreen() {
  const { background } = useTheme();
  const bg = background;

  // ── Screen / tab state ────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('menu');
  const [menuTab, setMenuTab] = useState<MenuTab>('play');

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

  // Pop achievement queue one at a time
  useEffect(() => {
    if (!currentAchievement && pendingAchievements.length > 0) {
      const [next, ...rest] = pendingAchievements;
      setCurrentAchievement(next);
      setPendingAchievements(rest);
    }
  }, [currentAchievement, pendingAchievements]);

  // ── Tab switching ─────────────────────────────────────────────────────────
  const switchToTab = useCallback((tab: MenuTab) => {
    setMenuTab(tab);
  }, []);

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

  // Save stats + check achievements when game ends
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
    setTimeout(startTimer, 100);
  }, [startTimer]);

  const handleBackToMenu = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(false);
    setScreen('menu');
    switchToTab('play');
  }, [switchToTab]);

  const timerColor =
    timeLeft > 30 ? '#4ecca3' : timeLeft > 10 ? '#f59e0b' : '#e94560';

  // Achievements split for display
  const { unlockedSet, lockedAchievements } = useMemo(() => {
    const unlockedSet = new Set(unlockedAchievements.map((a) => a.id));
    const lockedAchievements = ACHIEVEMENTS.filter((a) => !unlockedSet.has(a.id));
    return { unlockedSet, lockedAchievements };
  }, [unlockedAchievements]);

  // ─────────────────────────────────────────────────────────────────────────
  // GAME SCREEN
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

        <View style={styles.header}>
          <Pressable onPress={handleBackToMenu} style={styles.backBtn}>
            <Text style={[styles.backText, { color: bg.textColor }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: bg.textColor }]}>Word Grid</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.inGameStatsRow}>
          <View style={[styles.inGameStat, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}>
            <Text style={[styles.inGameStatLabel, { color: bg.secondaryText }]}>Score</Text>
            <Text style={[styles.inGameStatValue, { color: bg.textColor }]}>{score}</Text>
          </View>
          <View style={[styles.inGameStat, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}>
            <Text style={[styles.inGameStatLabel, { color: bg.secondaryText }]}>Time</Text>
            <Text style={[styles.inGameStatValue, { color: timerColor }]}>{timeLeft}s</Text>
          </View>
          <View style={[styles.inGameStat, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}>
            <Text style={[styles.inGameStatLabel, { color: bg.secondaryText }]}>Words</Text>
            <Text style={[styles.inGameStatValue, { color: bg.textColor }]}>{foundWords.length}</Text>
          </View>
        </View>

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

        <View style={[styles.wordListContainer, { borderColor: bg.borderColor }]}>
          <Text style={[styles.wordListTitle, { color: bg.secondaryText }]}>Words Found</Text>
          <FlatList
            data={foundWords}
            keyExtractor={(item, index) => `${item.word}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.wordChip, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}>
                <Text style={[styles.wordChipText, { color: bg.textColor }]}>{item.word}</Text>
                <Text style={[styles.wordChipPoints, { color: '#4ecca3' }]}>+{item.points}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyWords, { color: bg.secondaryText }]}>
                Swipe to connect letters!
              </Text>
            }
          />
        </View>

        <Modal visible={gameOver} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: bg.cardColor }]}>
              <Text style={[styles.modalTitle, { color: bg.textColor }]}>Time's Up!</Text>
              <Text style={[styles.modalScore, { color: '#4ecca3' }]}>{score} pts</Text>
              <Text style={[styles.modalSub, { color: bg.secondaryText }]}>
                {foundWords.length} word{foundWords.length !== 1 ? 's' : ''} found
              </Text>
              {stats && score > 0 && score >= stats.highScore && (
                <Text style={styles.newHighScore}>🏆 New High Score!</Text>
              )}
              {foundWords.length > 0 && (
                <View style={styles.modalWordList}>
                  {foundWords.slice(0, 8).map((w, i) => (
                    <Text key={i} style={[styles.modalWord, { color: bg.textColor }]}>
                      {w.word} (+{w.points})
                    </Text>
                  ))}
                  {foundWords.length > 8 && (
                    <Text style={[styles.modalMore, { color: bg.secondaryText }]}>
                      +{foundWords.length - 8} more
                    </Text>
                  )}
                </View>
              )}
              <Pressable style={styles.playAgainBtn} onPress={handlePlayAgain}>
                <Text style={styles.playAgainText}>Play Again</Text>
              </Pressable>
              <Pressable onPress={handleBackToMenu} style={styles.homeBtn}>
                <Text style={[styles.homeBtnText, { color: bg.secondaryText }]}>Back to Menu</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: bg.textColor }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: bg.textColor }]}>Word Grid</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Pill segment switcher */}
      <View style={[styles.segmentSwitcher, { backgroundColor: bg.cardColor }]}>
        {(['play', 'stats'] as MenuTab[]).map((tab) => {
          const isActive = menuTab === tab;
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

      {menuTab === 'play' ? (
        /* ─── PLAY TAB ─── */
        <ScrollView
          style={styles.playScrollView}
          contentContainerStyle={styles.playContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Daily Challenge card */}
          <View style={[styles.dailyCard, { backgroundColor: bg.cardColor, borderColor: '#4ecca3' }]}>
            <View style={styles.dailyCardLeft}>
              <Text style={[styles.dailyCardTitle, { color: bg.textColor }]}>📅 Daily Challenge</Text>
              <Text style={[styles.dailyCardDesc, { color: bg.secondaryText }]}>
                A new grid every day — same puzzle for everyone!
              </Text>
            </View>
            <Pressable style={styles.dailyPlayBtn} onPress={startGame}>
              <Text style={styles.dailyPlayBtnText}>Play</Text>
            </Pressable>
          </View>

          {/* Play card */}
          <Pressable
            style={[styles.gameModeCard, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}
            onPress={startGame}
          >
            <Text style={[styles.gameModeTitle, { color: bg.textColor }]}>Quick Play</Text>
            <Text style={[styles.gameModeDesc, { color: bg.secondaryText }]}>
              90 seconds — find as many words as you can in the 4×4 grid
            </Text>
          </Pressable>

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
                <Text style={[styles.ruleNumber, { color: '#4ecca3' }]}>{i + 1}</Text>
                <Text style={[styles.ruleText, { color: bg.secondaryText }]}>{rule}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* ─── STATS TAB ─── */
        <ScrollView
          contentContainerStyle={styles.statsContainer}
          showsVerticalScrollIndicator={false}
        >
          {stats ? (
            <>
              <Text style={[styles.sectionTitle, { color: bg.textColor }]}>Statistics</Text>
              <View style={styles.statsGrid}>
                <StatBox label="Games Played" value={stats.gamesPlayed} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} />
                <StatBox label="High Score" value={stats.highScore.toLocaleString()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} />
                <StatBox label="Total Words" value={stats.totalWordsFound.toLocaleString()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} />
                <StatBox label="Best Words/Game" value={stats.bestWordsInGame} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} />
                <StatBox label="Lifetime Score" value={stats.totalScore.toLocaleString()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} wide />
                {stats.longestWord ? (
                  <StatBox label="Longest Word" value={stats.longestWord.toUpperCase()} textColor={bg.textColor} secondaryText={bg.secondaryText} cardColor={bg.cardColor} borderColor={bg.borderColor} wide />
                ) : null}
              </View>

              <View style={styles.achievementsHeader}>
                <Trophy size={18} color="#4ecca3" />
                <Text style={[styles.sectionTitle, { color: bg.textColor, marginBottom: 0, marginLeft: 8 }]}>
                  Achievements
                </Text>
                <Text style={[styles.achievementCount, { color: bg.secondaryText }]}>
                  {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </Text>
              </View>

              {unlockedAchievements.map((a) => (
                <View
                  key={a.id}
                  style={[styles.achievementRow, { backgroundColor: bg.cardColor, borderColor: '#4ecca3' }]}
                >
                  <Text style={styles.achievementEmoji}>{a.emoji}</Text>
                  <View style={styles.achievementText}>
                    <Text style={[styles.achievementName, { color: bg.textColor }]}>{a.name}</Text>
                    <Text style={[styles.achievementDesc, { color: bg.secondaryText }]}>{a.description}</Text>
                  </View>
                  <Text style={styles.achievementCheck}>✓</Text>
                </View>
              ))}

              {lockedAchievements.length > 0 && (
                <Text style={[styles.lockedDivider, { color: bg.secondaryText }]}>── Locked ──</Text>
              )}

              {lockedAchievements.map((a) => (
                <View
                  key={a.id}
                  style={[styles.achievementRow, styles.achievementRowLocked, { backgroundColor: bg.cardColor, borderColor: bg.borderColor }]}
                >
                  <Text style={[styles.achievementEmoji, { opacity: 0.4 }]}>{a.emoji}</Text>
                  <View style={styles.achievementText}>
                    <Text style={[styles.achievementName, { color: bg.secondaryText }]}>{a.name}</Text>
                    <Text style={[styles.achievementDesc, { color: bg.secondaryText, opacity: 0.6 }]}>{a.description}</Text>
                  </View>
                </View>
              ))}

              <View style={{ height: 24 }} />
            </>
          ) : (
            <Text style={[styles.noStats, { color: bg.secondaryText }]}>Loading stats…</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { width: 70 },
  backText: { fontSize: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 'bold' },
  headerRight: { width: 70 },

  // Pill segment switcher (matches Hangman)
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

  // Play tab
  playScrollView: { flex: 1 },
  playContainer: { alignItems: 'stretch', paddingHorizontal: 20, paddingTop: 16, gap: 14 },

  // Daily Challenge card
  dailyCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyCardLeft: { flex: 1, gap: 4 },
  dailyCardTitle: { fontSize: 16, fontWeight: '700' },
  dailyCardDesc: { fontSize: 13, lineHeight: 18 },
  dailyPlayBtn: {
    backgroundColor: '#4ecca3',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  dailyPlayBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Game mode card
  gameModeCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
  },
  gameModeTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  gameModeDesc: { fontSize: 14, textAlign: 'center' },

  // How to Play
  rulesCard: { borderRadius: 14, borderWidth: 1.5, padding: 16 },
  rulesTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  ruleItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  ruleNumber: { fontSize: 18, fontWeight: 'bold', width: 28 },
  ruleText: { fontSize: 14, flex: 1, lineHeight: 20 },

  // Shared stat box
  statBox: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statBoxWide: { flex: 2, minWidth: '95%' },
  statBoxValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  statBoxLabel: { fontSize: 11, textAlign: 'center' },

  // Stats tab
  statsContainer: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  achievementCount: { marginLeft: 'auto', fontSize: 13 },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  achievementRowLocked: { opacity: 0.5 },
  achievementEmoji: { fontSize: 28 },
  achievementText: { flex: 1 },
  achievementName: { fontSize: 15, fontWeight: '700' },
  achievementDesc: { fontSize: 12, marginTop: 2 },
  achievementCheck: { color: '#4ecca3', fontSize: 18, fontWeight: 'bold' },
  lockedDivider: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 10,
    letterSpacing: 1,
  },
  noStats: { textAlign: 'center', marginTop: 40, fontSize: 16 },

  // In-game stats
  inGameStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  inGameStat: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  inGameStatLabel: { fontSize: 11, marginBottom: 2 },
  inGameStatValue: { fontSize: 20, fontWeight: 'bold' },

  gridWrapper: { alignItems: 'center', position: 'relative', flex: 1, justifyContent: 'center' },

  wordListContainer: {
    height: 90,
    marginHorizontal: 16,
    marginTop: 8,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  wordListTitle: {
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  wordChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordChipText: { fontSize: 14, fontWeight: '600' },
  wordChipPoints: { fontSize: 12 },
  emptyWords: { fontSize: 14, paddingVertical: 4 },

  // Game over modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  modalScore: { fontSize: 48, fontWeight: 'bold', marginBottom: 4 },
  modalSub: { fontSize: 16, marginBottom: 8 },
  newHighScore: { color: '#f59e0b', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  modalWordList: { alignItems: 'center', marginBottom: 20, gap: 4 },
  modalWord: { fontSize: 15 },
  modalMore: { fontSize: 13, marginTop: 4 },
  playAgainBtn: {
    backgroundColor: '#4ecca3',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  playAgainText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  homeBtn: { paddingVertical: 8 },
  homeBtnText: { fontSize: 15 },
});
