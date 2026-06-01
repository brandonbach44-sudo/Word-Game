// src/wordgrid/screens/GameScreen.tsx
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/ThemeContext';
import GridWithGesture from '../components/GridWithGesture';
import { FeedbackOverlay } from './FeedbackOverlay';
import { generateGrid } from '../utils/gridGenerator';
import { validatePath, type Position } from '../utils/pathFinder';
import { calculateWordScore } from '../utils/scoring';

const ROUND_DURATION = 90; // seconds per round

type Feedback = { points: number; success: boolean; key: number };

export default function GameScreen() {
  const { background } = useTheme();

  const [grid, setGrid] = useState<string[][]>(() => generateGrid(4));
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState<{ word: string; points: number }[]>([]);
  const [foundWordSet, setFoundWordSet] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const feedbackKeyRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/restart timer
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
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const handlePathComplete = useCallback(
    (path: Position[]) => {
      const { word, valid } = validatePath(grid, path);
      const key = ++feedbackKeyRef.current;

      if (valid && !foundWordSet.has(word)) {
        const longestSoFar =
          foundWords.length > 0
            ? Math.max(...foundWords.map((w) => w.word.length))
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

  const handlePlayAgain = useCallback(() => {
    setGrid(generateGrid(4));
    setScore(0);
    setFoundWords([]);
    setFoundWordSet(new Set());
    setTimeLeft(ROUND_DURATION);
    setGameOver(false);
    setFeedbacks([]);
    startTimer();
  }, [startTimer]);

  // Timer color: green → yellow → red
  const timerColor =
    timeLeft > 30
      ? '#4ecca3'
      : timeLeft > 10
      ? '#f59e0b'
      : '#e94560';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background.backgroundColor }]}
    >
      <StatusBar
        barStyle={background.statusBar === 'dark' ? 'dark-content' : 'light-content'}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: background.textColor }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: background.textColor }]}>Word Grid</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Score + Timer row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
          <Text style={[styles.statLabel, { color: background.secondaryText }]}>Score</Text>
          <Text style={[styles.statValue, { color: background.textColor }]}>{score}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
          <Text style={[styles.statLabel, { color: background.secondaryText }]}>Time</Text>
          <Text style={[styles.statValue, { color: timerColor }]}>{timeLeft}s</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
          <Text style={[styles.statLabel, { color: background.secondaryText }]}>Words</Text>
          <Text style={[styles.statValue, { color: background.textColor }]}>{foundWords.length}</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        <GridWithGesture
          grid={grid}
          onPathComplete={handlePathComplete}
          disabled={gameOver}
        />
        {/* Floating feedback overlays */}
        {feedbacks.map((f) => (
          <FeedbackOverlay
            key={f.key}
            points={f.points}
            success={f.success}
            onComplete={() => removeFeedback(f.key)}
          />
        ))}
      </View>

      {/* Found words list */}
      <View style={[styles.wordListContainer, { borderColor: background.borderColor }]}>
        <Text style={[styles.wordListTitle, { color: background.secondaryText }]}>
          Words Found
        </Text>
        <FlatList
          data={foundWords}
          keyExtractor={(item, index) => `${item.word}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.wordChip, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
              <Text style={[styles.wordChipText, { color: background.textColor }]}>
                {item.word}
              </Text>
              <Text style={[styles.wordChipPoints, { color: '#4ecca3' }]}>
                +{item.points}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyWords, { color: background.secondaryText }]}>
              Swipe to connect letters!
            </Text>
          }
        />
      </View>

      {/* Game Over Modal */}
      <Modal visible={gameOver} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: background.cardColor }]}>
            <Text style={[styles.modalTitle, { color: background.textColor }]}>
              Time's Up!
            </Text>
            <Text style={[styles.modalScore, { color: '#4ecca3' }]}>{score} pts</Text>
            <Text style={[styles.modalWordsLabel, { color: background.secondaryText }]}>
              {foundWords.length} word{foundWords.length !== 1 ? 's' : ''} found
            </Text>

            {foundWords.length > 0 && (
              <View style={styles.modalWordList}>
                {foundWords.slice(0, 8).map((w, i) => (
                  <Text key={i} style={[styles.modalWord, { color: background.textColor }]}>
                    {w.word} (+{w.points})
                  </Text>
                ))}
                {foundWords.length > 8 && (
                  <Text style={[styles.modalMoreWords, { color: background.secondaryText }]}>
                    +{foundWords.length - 8} more
                  </Text>
                )}
              </View>
            )}

            <Pressable
              style={styles.playAgainBtn}
              onPress={handlePlayAgain}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.homeBtn}>
              <Text style={[styles.homeBtnText, { color: background.secondaryText }]}>
                Back to Home
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statLabel: { fontSize: 11, marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  gridWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  wordListContainer: {
    flex: 1,
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
  // Modal
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
  modalWordsLabel: { fontSize: 16, marginBottom: 16 },
  modalWordList: { alignItems: 'center', marginBottom: 20, gap: 4 },
  modalWord: { fontSize: 15 },
  modalMoreWords: { fontSize: 13, marginTop: 4 },
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
