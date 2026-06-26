// src/wordsearch/PlayScreen.tsx

import { router } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
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
import { WORD_SEARCH_THEMES, type WordSearchThemeId } from '../../src/wordsearch/data/themes';
import type { PlacedWord, WordSearchPuzzle } from '../../src/wordsearch/utils/generator';
import { DIFFICULTY_CONFIG } from '../../src/wordsearch/utils/difficultyConfig';
import { checkWordSearchAchievements, WS_ACHIEVEMENTS, type WSAchievement } from '../../src/wordsearch/utils/wsAchievements';
import {
  saveWordSearchDailyResult,
  updateWordSearchStats,
  loadWordSearchStats,
  type WordSearchStats,
} from '../../src/wordsearch/utils/wsStorage';
import { useCountdownToMidnight } from '../../src/wordsearch/utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Result data shape ─────────────────────────────────────────────────────────
interface ResultData {
  score: number;
  foundWords: number;
  totalWords: number;
  allFound: boolean;
  timeString: string;
  multiplier: number;
  timeBonus: number;
  newAchievements: WSAchievement[];
}

// ── Achievement popup ─────────────────────────────────────────────────────────
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
        style={[overlayStyles.popupContainer, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[overlayStyles.popup, { backgroundColor: cardColor, borderColor: COLORS.accent }]}
          onPress={dismiss}
          activeOpacity={0.9}
        >
          <Text style={overlayStyles.popupUnlockLabel}>Achievement Unlocked!</Text>
          <View style={overlayStyles.popupContent}>
            <Text style={overlayStyles.popupEmoji}>{achievement.emoji}</Text>
            <View style={overlayStyles.popupText}>
              <Text style={[overlayStyles.popupName, { color: textColor }]}>{achievement.name}</Text>
              <Text style={[overlayStyles.popupDesc, { color: textColor, opacity: 0.7 }]}>{achievement.description}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, textColor, borderColor, backgroundColor }: {
  label: string; value: string; textColor: string; borderColor: string; backgroundColor: string;
}) {
  return (
    <View style={[overlayStyles.statPill, { borderColor, backgroundColor }]}>
      <Text style={[overlayStyles.statPillLabel, { color: textColor }]}>{label}</Text>
      <Text style={[overlayStyles.statPillValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
function PrimaryButton({ label, onPress, borderColor, textColor, backgroundColor }: {
  label: string; onPress: () => void; borderColor: string; textColor: string; backgroundColor: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [overlayStyles.primaryButton, { borderColor, backgroundColor, opacity: pressed ? 0.75 : 1 }]}
      onPress={onPress}
    >
      <Text style={[overlayStyles.primaryButtonText, { color: textColor }]}>{label}</Text>
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

interface PlayScreenProps {
  themeId: WordSearchThemeId;
  difficulty: string;
  puzzleData: WordSearchPuzzle;
  isDaily?: boolean;
  timeLimit?: number; // seconds — for daily countdown mode
}

interface Cell { row: number; col: number }

interface GameState {
  score: number;
  foundWords: PlacedWord[];
  elapsedSeconds: number;
  /** Cells permanently highlighted (found words) */
  foundCells: Cell[];
  /** Cells currently being dragged over */
  currentSelection: Cell[];
}

// All 8 valid word-search directions
const DIRECTIONS = [
  { dr: 0,  dc: 1  }, // RIGHT
  { dr: 0,  dc: -1 }, // LEFT
  { dr: 1,  dc: 0  }, // DOWN
  { dr: -1, dc: 0  }, // UP
  { dr: 1,  dc: 1  }, // DOWNRIGHT
  { dr: 1,  dc: -1 }, // DOWNLEFT
  { dr: -1, dc: 1  }, // UPRIGHT
  { dr: -1, dc: -1 }, // UPLEFT
];

/**
 * Given a start and end cell, snap the drag to the nearest of the 8 valid
 * directions and return every cell along that line. Never returns empty —
 * falls back to [start] if the drag is zero length.
 */
function buildSelectionLine(
  start: Cell,
  end: Cell,
  numRows: number,
  numCols: number,
): Cell[] {
  const dr = end.row - start.row;
  const dc = end.col - start.col;

  if (dr === 0 && dc === 0) return [start];

  // Find the direction whose unit vector best matches the drag vector.
  // Cosine similarity: largest dot product with the normalised drag = best match.
  const dragMag = Math.sqrt(dr * dr + dc * dc);
  let bestDir = DIRECTIONS[0];
  let bestCos = -Infinity;
  for (const d of DIRECTIONS) {
    const dirMag = Math.sqrt(d.dr * d.dr + d.dc * d.dc); // 1 for cardinal, √2 for diagonal
    const cos = (dr * d.dr + dc * d.dc) / (dragMag * dirMag);
    if (cos > bestCos) {
      bestCos = cos;
      bestDir = d;
    }
  }

  // Project the drag vector onto the chosen direction to get number of steps.
  // lenSq = 1 for cardinal, 2 for diagonal — this correctly scales the projection.
  const lenSq = bestDir.dr * bestDir.dr + bestDir.dc * bestDir.dc;
  const steps = Math.max(0, Math.round((dr * bestDir.dr + dc * bestDir.dc) / lenSq));

  const cells: Cell[] = [];
  for (let i = 0; i <= steps; i++) {
    const r = start.row + bestDir.dr * i;
    const c = start.col + bestDir.dc * i;
    // Clamp to grid bounds
    if (r >= 0 && r < numRows && c >= 0 && c < numCols) {
      cells.push({ row: r, col: c });
    }
  }
  return cells.length > 0 ? cells : [start];
}

/** Get cells for a placed word */
function getWordCells(word: PlacedWord): Cell[] {
  const vectors: Record<string, { dr: number; dc: number }> = {
    RIGHT: { dr: 0, dc: 1 },
    LEFT: { dr: 0, dc: -1 },
    DOWN: { dr: 1, dc: 0 },
    UP: { dr: -1, dc: 0 },
    DOWNRIGHT: { dr: 1, dc: 1 },
    DOWNLEFT: { dr: 1, dc: -1 },
    UPRIGHT: { dr: -1, dc: 1 },
    UPLEFT: { dr: -1, dc: -1 },
  };
  const { dr, dc } = vectors[word.direction];
  const cells: Cell[] = [];
  for (let i = 0; i < word.length; i++) {
    cells.push({ row: word.row + dr * i, col: word.col + dc * i });
  }
  return cells;
}

/** Check if two cell arrays match (same cells in any order — forward or backward) */
function selectionMatchesWord(selection: Cell[], wordCells: Cell[]): boolean {
  if (selection.length !== wordCells.length) return false;
  const fwd = selection.every((c, i) => c.row === wordCells[i].row && c.col === wordCells[i].col);
  const rev = selection.every(
    (c, i) =>
      c.row === wordCells[wordCells.length - 1 - i].row &&
      c.col === wordCells[wordCells.length - 1 - i].col
  );
  return fwd || rev;
}

// Padding inside the grid container — must stay in sync with styles.gridContainer
const GRID_PADDING = 8;

const PlayScreen: React.FC<PlayScreenProps> = ({
  themeId,
  difficulty,
  puzzleData,
  isDaily = false,
  timeLimit,
}) => {
  const themeName = WORD_SEARCH_THEMES.find(t => t.id === themeId)?.name ?? themeId;
  const { background } = useTheme();
  const countdown = useCountdownToMidnight();

  // Results overlay state
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [lifetimeStats, setLifetimeStats] = useState<WordSearchStats | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<WSAchievement[]>([]);
  const [currentPopup, setCurrentPopup] = useState<WSAchievement | null>(null);

  useEffect(() => {
    if (pendingAchievements.length > 0 && !currentPopup) {
      setCurrentPopup(pendingAchievements[0]);
      setPendingAchievements(prev => prev.slice(1));
    }
  }, [pendingAchievements, currentPopup]);

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    foundWords: [],
    elapsedSeconds: 0,
    foundCells: [],
    currentSelection: [],
  });
  const [gameFinished, setGameFinished] = useState(false);

  // Combo system
  const lastWordFoundAt = useRef<number>(0);
  const comboCount = useRef<number>(0);
  const [comboDisplay, setComboDisplay] = useState<{ multiplier: number; count: number } | null>(null);
  const comboClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hints (Easy only)
  const diffConfig = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
  const [hintsRemaining, setHintsRemaining] = useState(diffConfig?.hints ?? 0);
  const [hintCell, setHintCell] = useState<Cell | null>(null);
  const hintClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintAnim = useRef(new Animated.Value(1)).current;

  // Grid layout measured values
  const gridRef = useRef<View>(null);
  const gridLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const cellWidth = useRef(0);
  const cellHeight = useRef(0);
  const numCols = puzzleData.grid[0]?.length ?? 1;
  const numRows = puzzleData.grid.length;

  // Drag state (refs, not state — don't need re-render mid-drag)
  const dragStart = useRef<Cell | null>(null);
  const lastValidCell = useRef<Cell | null>(null);
  const gameFinishedRef = useRef(false);

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLimitRef = useRef(timeLimit);
  const triggerFinishRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (gameFinished) return;
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        const next = prev.elapsedSeconds + 1;
        // Auto-finish when countdown expires
        if (timeLimitRef.current && next >= timeLimitRef.current) {
          setTimeout(() => triggerFinishRef.current?.(), 0);
        }
        return { ...prev, elapsedSeconds: next };
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameFinished]);

  // Sound
  useEffect(() => {
    SoundManager.init().catch(() => {});
  }, []);

  const measureGrid = () => {
    // measureInWindow gives coordinates relative to the window, which matches
    // the pageX/pageY values from touch events — more reliable than measure().
    gridRef.current?.measureInWindow((x, y, width, height) => {
      gridLayout.current = { x, y, width, height };
      // Cell size accounts for the container padding on both sides
      cellWidth.current = (width - GRID_PADDING * 2) / numCols;
      cellHeight.current = (height - GRID_PADDING * 2) / numRows;
    });
  };

  const getCellFromPoint = (pageX: number, pageY: number): Cell | null => {
    const layout = gridLayout.current;
    if (!layout || cellWidth.current === 0) return null;

    // Subtract container origin AND inner padding before dividing by cell size
    const col = Math.floor((pageX - layout.x - GRID_PADDING) / cellWidth.current);
    const row = Math.floor((pageY - layout.y - GRID_PADDING) / cellHeight.current);

    if (row >= 0 && row < numRows && col >= 0 && col < numCols) {
      return { row, col };
    }
    return null;
  };

  // Keep refs in sync for use inside PanResponder closures
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { gameFinishedRef.current = gameFinished; }, [gameFinished]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !gameFinishedRef.current,
      onMoveShouldSetPanResponder: () => !gameFinishedRef.current,

      onPanResponderGrant: evt => {
        // Re-measure every touch so the grid position is always fresh
        // (handles scrolling, keyboard appearing, orientation changes, etc.)
        gridRef.current?.measureInWindow((x, y, width, height) => {
          gridLayout.current = { x, y, width, height };
          cellWidth.current = (width - GRID_PADDING * 2) / numCols;
          cellHeight.current = (height - GRID_PADDING * 2) / numRows;
        });
        const cell = getCellFromPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        dragStart.current = cell;
        lastValidCell.current = cell;
        setGameState(prev => ({ ...prev, currentSelection: [cell] }));
      },

      onPanResponderMove: evt => {
        if (!dragStart.current) return;
        const cell = getCellFromPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        lastValidCell.current = cell;
        const line = buildSelectionLine(dragStart.current, cell, numRows, numCols);
        setGameState(prev => ({ ...prev, currentSelection: line }));
      },

      onPanResponderRelease: evt => {
        if (!dragStart.current) return;
        // Use last valid cell as fallback when finger lifts outside the grid
        const cell = getCellFromPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY)
          ?? lastValidCell.current;
        const line = cell
          ? buildSelectionLine(dragStart.current, cell, numRows, numCols)
          : [dragStart.current];
        lastValidCell.current = null;
        dragStart.current = null;

        const state = gameStateRef.current;
        let wordFound = false;

        for (const placedWord of puzzleData.words) {
          if (state.foundWords.some(fw => fw.word === placedWord.word)) continue;
          const wordCells = getWordCells(placedWord);
          if (selectionMatchesWord(line, wordCells)) {
            SoundManager.success();
            const dc = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
            const diffMult = dc?.multiplier ?? 1;

            // Combo: word found within 5s of previous = streak
            const now = Date.now();
            const gap = lastWordFoundAt.current > 0
              ? (now - lastWordFoundAt.current) / 1000
              : 999;
            if (gap <= 5 && lastWordFoundAt.current > 0) {
              comboCount.current = Math.min(comboCount.current + 1, 4);
            } else {
              comboCount.current = 1;
            }
            lastWordFoundAt.current = now;

            const combo = comboCount.current;
            const comboMult = combo >= 4 ? 3 : combo >= 3 ? 2 : combo >= 2 ? 1.5 : 1;
            const scoreGain = Math.round(placedWord.word.length * 10 * diffMult * comboMult);

            // Show combo badge if multiplier is active
            if (combo >= 2) {
              if (comboClearTimer.current) clearTimeout(comboClearTimer.current);
              setComboDisplay({ multiplier: comboMult, count: combo });
              comboClearTimer.current = setTimeout(() => setComboDisplay(null), 1500);
            }

            const newFoundWords = [...state.foundWords, placedWord];
            const newFoundCells = [...state.foundCells, ...wordCells];
            wordFound = true;

            setGameState(prev => ({
              ...prev,
              foundWords: newFoundWords,
              score: prev.score + scoreGain,
              foundCells: newFoundCells,
              currentSelection: [],
            }));

            if (newFoundWords.length === puzzleData.words.length) {
              setTimeout(() => triggerFinish(), 500);
            }
            break;
          }
        }

        if (!wordFound) {
          SoundManager.error();
          setGameState(prev => ({ ...prev, currentSelection: [] }));
        }
      },

      onPanResponderTerminate: () => {
        dragStart.current = null;
        setGameState(prev => ({ ...prev, currentSelection: [] }));
      },
    })
  ).current;

  const triggerFinish = async () => {
    if (gameFinished) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const state = gameStateRef.current;
    const diffConfig = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
    const multiplier = diffConfig?.multiplier ?? 1;
    const timeBonus = Math.max(0, Math.floor((300 / Math.max(state.elapsedSeconds, 1)) * multiplier));
    const finalScore = state.score + timeBonus;
    const allWordsFound = state.foundWords.length === puzzleData.words.length;

    let dailyStreak = 0;
    let newlyUnlockedIds: string[] = [];

    try {
      // Load prev best before updating
      const { loadWordSearchStats } = await import('../../src/wordsearch/utils/wsStorage');
      const prevStats = await loadWordSearchStats();
      const prevBestScore = prevStats.bestScore;

      if (isDaily) {
        const dailyStats = await saveWordSearchDailyResult(
          allWordsFound ? 'won' : 'lost',
          finalScore
        );
        dailyStreak = dailyStats.streak;
      }

      const updatedStats = await updateWordSearchStats({
        won: allWordsFound,
        score: finalScore,
        elapsedSeconds: state.elapsedSeconds,
        difficulty,
        wordsFound: state.foundWords.length,
        isDaily,
      });

      const newAchievements = await checkWordSearchAchievements({
        stats: updatedStats,
        prevBestScore,
        currentGameScore: finalScore,
        currentGameSeconds: state.elapsedSeconds,
        currentGameDifficulty: difficulty,
        currentGameWon: allWordsFound,
        dailyStreak,
      });

      newlyUnlockedIds = newAchievements.map(a => a.id);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }

    setGameFinished(true);

    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = state.elapsedSeconds % 60;
    const timeString = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const newAchievements = newlyUnlockedIds
      .map(id => WS_ACHIEVEMENTS.find(a => a.id === id))
      .filter(Boolean) as WSAchievement[];

    SoundManager.gameOver();
    loadWordSearchStats().then(setLifetimeStats);
    if (newAchievements.length > 0) setPendingAchievements(newAchievements);

    setResultData({
      score: finalScore,
      foundWords: state.foundWords.length,
      totalWords: puzzleData.words.length,
      allFound: allWordsFound,
      timeString,
      multiplier,
      timeBonus,
      newAchievements,
    });
  };

  // Register triggerFinish in ref so the timer interval can call it
  useEffect(() => {
    triggerFinishRef.current = triggerFinish;
  });

  const handleManualFinish = () => triggerFinish();

  const handlePlayAgain = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    dragStart.current = null;
    lastValidCell.current = null;
    comboCount.current = 0;
    lastWordFoundAt.current = 0;
    setResultData(null);
    setLifetimeStats(null);
    setPendingAchievements([]);
    setCurrentPopup(null);
    setGameFinished(false);
    setGameState({
      score: 0,
      foundWords: [],
      elapsedSeconds: 0,
      foundCells: [],
      currentSelection: [],
    });
    const diffConfig = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
    setHintsRemaining(diffConfig?.hints ?? 0);
    setHintCell(null);
    setComboDisplay(null);
  };

  const handleHint = (word: typeof puzzleData.words[0]) => {
    if (hintsRemaining <= 0) return;
    if (gameState.foundWords.some(fw => fw.word === word.word)) return;
    // Highlight the word's starting cell
    const startCell = { row: word.row, col: word.col };
    setHintCell(startCell);
    setHintsRemaining(h => h - 1);
    // Flash animation
    hintAnim.setValue(1);
    Animated.sequence([
      Animated.timing(hintAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    if (hintClearTimer.current) clearTimeout(hintClearTimer.current);
    hintClearTimer.current = setTimeout(() => setHintCell(null), 2000);
  };

  const handleBack = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // All games are timed — always show countdown
  const remainingSeconds = timeLimit != null
    ? Math.max(0, timeLimit - gameState.elapsedSeconds)
    : null;
  const isLowTime = remainingSeconds !== null && remainingSeconds <= 30;
  const timerDisplay = remainingSeconds !== null
    ? formatTime(remainingSeconds)
    : formatTime(gameState.elapsedSeconds);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Games</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: background.textColor }]}>Word Search</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Info bar */}
      <View style={[styles.infoBar, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: background.secondaryText }]}>Score</Text>
          <Text style={[styles.infoValue, { color: COLORS.accent }]}>{gameState.score}</Text>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: background.borderColor }]} />
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: background.secondaryText }]}>Time Left</Text>
          <Text style={[styles.infoValue, { color: isLowTime ? '#ef4444' : background.textColor }]}>
            {timerDisplay}
          </Text>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: background.borderColor }]} />
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: background.secondaryText }]}>Found</Text>
          <Text style={[styles.infoValue, { color: background.textColor }]}>{gameState.foundWords.length}/{puzzleData.words.length}</Text>
        </View>
      </View>

      {/* Grid wrapper — position:relative for combo badge overlay */}
      <View style={styles.gridWrapper}>
        {/* Combo badge */}
        {comboDisplay && (
          <View style={styles.comboBadge} pointerEvents="none">
            <Text style={styles.comboBadgeText}>
              🔥 {comboDisplay.multiplier}× COMBO!
            </Text>
          </View>
        )}

        {/* Grid — PanResponder captures touches here */}
        <View
          ref={gridRef}
          style={[styles.gridContainer, { backgroundColor: background.cardColor }]}
          onLayout={measureGrid}
          {...panResponder.panHandlers}
        >
          {puzzleData.grid.map((row: string[], rIdx: number) => (
            <View key={rIdx} style={styles.gridRow}>
              {row.map((letter: string, cIdx: number) => {
                const isFound = gameState.foundCells.some(c => c.row === rIdx && c.col === cIdx);
                const isSelected = gameState.currentSelection.some(
                  c => c.row === rIdx && c.col === cIdx
                );
                const isHint = hintCell?.row === rIdx && hintCell?.col === cIdx;

                let cellBg = background.cardColor;
                let textColor = background.textColor;
                if (isFound) {
                  cellBg = COLORS.accent;
                  textColor = '#fff';
                } else if (isHint) {
                  cellBg = '#facc15'; // yellow hint
                  textColor = '#000';
                } else if (isSelected) {
                  cellBg = COLORS.accent + '55';
                  textColor = background.textColor;
                }

                const cellView = (
                  <View
                    key={`${rIdx}-${cIdx}`}
                    style={[
                      styles.gridCell,
                      {
                        backgroundColor: cellBg,
                        borderColor: isSelected ? COLORS.accent : isHint ? '#f59e0b' : background.borderColor,
                      },
                    ]}
                  >
                    {isHint ? (
                      <Animated.Text style={[styles.cellText, { color: textColor, opacity: hintAnim }]}>
                        {letter}
                      </Animated.Text>
                    ) : (
                      <Text style={[styles.cellText, { color: textColor }]}>{letter}</Text>
                    )}
                  </View>
                );

                return cellView;
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Word list + finish button — scrollable below the grid */}
      <ScrollView
        style={styles.bottomScroll}
        contentContainerStyle={styles.bottomScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hints remaining indicator (Easy only) */}
        {difficulty === 'easy' && hintsRemaining > 0 && (
          <Text style={[styles.hintsLabel, { color: background.secondaryText }]}>
            💡 {hintsRemaining} hint{hintsRemaining !== 1 ? 's' : ''} — tap a word to reveal its start
          </Text>
        )}

        <View style={styles.wordGrid}>
          {puzzleData.words.map((word, idx) => {
            const found = gameState.foundWords.some(fw => fw.word === word.word);
            const canHint = difficulty === 'easy' && !found && hintsRemaining > 0;

            const inner = (
              <Text
                style={[
                  styles.wordText,
                  {
                    color: found ? COLORS.accent : background.textColor,
                    textDecorationLine: found ? 'line-through' : 'none',
                    opacity: found ? 0.6 : 1,
                  },
                ]}
              >
                {word.word}
              </Text>
            );

            return canHint ? (
              <TouchableOpacity key={idx} style={styles.wordRow} onPress={() => handleHint(word)}>
                {inner}
              </TouchableOpacity>
            ) : (
              <View key={idx} style={styles.wordRow}>
                {inner}
              </View>
            );
          })}
        </View>

        {gameState.foundWords.length > 0 && (
          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: COLORS.accent }]}
            onPress={handleManualFinish}
          >
            <Text style={styles.finishButtonText}>
              {gameState.foundWords.length === puzzleData.words.length
                ? 'See Results'
                : "I'm Done"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Achievement popup ── */}
      <AchievementPopup
        achievement={currentPopup}
        onDismiss={() => setCurrentPopup(null)}
        cardColor={background.cardColor}
        textColor={background.textColor}
      />

      {/* ── Results overlay (replaces separate results route) ── */}
      {resultData && (
        <Modal visible animationType="slide" statusBarTranslucent>
          <SafeAreaView style={[overlayStyles.container, { backgroundColor: background.backgroundColor }]}>
            <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
            <ScrollView contentContainerStyle={overlayStyles.scroll} showsVerticalScrollIndicator={false}>
              <View style={[overlayStyles.card, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>

                <Text style={[overlayStyles.brand, { color: background.secondaryText }]}>WORD SEARCH</Text>

                {/* Title */}
                <Text style={[overlayStyles.title, { color: background.textColor }]}>
                  {resultData.allFound
                    ? 'Nice!'
                    : resultData.foundWords / resultData.totalWords >= 0.75
                    ? 'Great Job!'
                    : resultData.foundWords / resultData.totalWords >= 0.5
                    ? 'Good Effort!'
                    : "Time's Up!"}
                </Text>
                <Text style={[overlayStyles.subtitle, { color: background.secondaryText }]}>
                  {resultData.allFound
                    ? `You found all ${resultData.totalWords} words in ${resultData.timeString}!`
                    : `You found ${resultData.foundWords}/${resultData.totalWords} words in ${resultData.timeString}.`}
                </Text>

                {/* Theme pill */}
                <View style={[overlayStyles.themePill, { borderColor: COLORS.accent }]}>
                  <Text style={[overlayStyles.themePillText, { color: COLORS.accent }]}>
                    {themeName}{difficulty ? ` · ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}${resultData.multiplier > 1 ? ` · ${resultData.multiplier}×` : ''}` : ''}
                  </Text>
                </View>

                {/* This game */}
                <View style={[overlayStyles.divider, { backgroundColor: background.borderColor }]} />
                <Text style={[overlayStyles.sectionTitle, { color: background.textColor }]}>THIS GAME</Text>
                <View style={overlayStyles.statsRow}>
                  <StatPill label="Found" value={`${resultData.foundWords}/${resultData.totalWords}`} textColor={background.textColor} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                  <StatPill label="Time" value={resultData.timeString} textColor={background.textColor} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                </View>
                <View style={overlayStyles.statsRow}>
                  <StatPill label="Score" value={resultData.score.toLocaleString()} textColor={COLORS.accent} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                  <StatPill label="Complete" value={`${Math.round((resultData.foundWords / Math.max(resultData.totalWords, 1)) * 100)}%`} textColor={resultData.allFound ? COLORS.accent : background.textColor} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                </View>

                {/* Score breakdown */}
                {resultData.allFound && (
                  <>
                    <View style={[overlayStyles.divider, { backgroundColor: background.borderColor }]} />
                    <Text style={[overlayStyles.sectionTitle, { color: background.textColor }]}>SCORE BREAKDOWN</Text>
                    <View style={overlayStyles.statsRow}>
                      <StatPill label="Words" value={`${resultData.score - resultData.timeBonus} pts`} textColor={background.textColor} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                      <StatPill label="Time Bonus" value={`+${resultData.timeBonus}`} textColor={COLORS.accent} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                    </View>
                    {resultData.multiplier > 1 && (
                      <View style={overlayStyles.statsRow}>
                        <StatPill label="Multiplier" value={`${resultData.multiplier}×`} textColor="#f59e0b" borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                      </View>
                    )}
                  </>
                )}

                {/* Lifetime stats */}
                {lifetimeStats && lifetimeStats.gamesPlayed > 0 && (
                  <>
                    <View style={[overlayStyles.divider, { backgroundColor: background.borderColor }]} />
                    <Text style={[overlayStyles.sectionTitle, { color: background.textColor }]}>YOUR STATS</Text>
                    <View style={overlayStyles.statsRow}>
                      <StatPill label="Best Score" value={lifetimeStats.bestScore.toLocaleString()} textColor={background.textColor} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                      <StatPill label="Streak" value={`${lifetimeStats.currentStreak}`} textColor={background.textColor} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                    </View>
                    <View style={overlayStyles.statsRow}>
                      <StatPill label="Games" value={`${lifetimeStats.gamesPlayed}`} textColor={background.textColor} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                      <StatPill label="Words Found" value={lifetimeStats.totalWordsFound.toLocaleString()} textColor={background.textColor} borderColor={background.borderColor} backgroundColor={background.backgroundColor} />
                    </View>
                  </>
                )}

                {/* Daily countdown */}
                {isDaily && (() => {
                  const parts = countdown.split(':').map(Number);
                  const secs = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
                  return secs > 0 ? (
                    <>
                      <View style={[overlayStyles.divider, { backgroundColor: background.borderColor }]} />
                      <Text style={[overlayStyles.countdownLabel, { color: background.secondaryText }]}>Next Daily in</Text>
                      <Text style={[overlayStyles.countdownValue, { color: background.textColor }]}>{formatCountdown(secs)}</Text>
                    </>
                  ) : null;
                })()}

                {/* Buttons */}
                <View style={overlayStyles.buttonRow}>
                  <PrimaryButton
                    label="Main Menu"
                    onPress={() => router.navigate('/wordsearch')}
                    borderColor={background.borderColor}
                    textColor={background.textColor}
                    backgroundColor={background.backgroundColor}
                  />
                  <PrimaryButton
                    label={isDaily ? 'Play' : 'Play Again'}
                    onPress={isDaily ? () => router.navigate('/wordsearch') : handlePlayAgain}
                    borderColor={background.borderColor}
                    textColor={background.textColor}
                    backgroundColor={background.backgroundColor}
                  />
                </View>

                {/* Share */}
                <Pressable
                  style={({ pressed }) => [overlayStyles.shareButton, { opacity: pressed ? 0.75 : 1 }]}
                  onPress={async () => {
                    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const result = resultData.allFound ? `${resultData.foundWords}/${resultData.totalWords} ✅` : `${resultData.foundWords}/${resultData.totalWords}`;
                    const text = isDaily
                      ? `🔍 Word Search Daily\n${themeName} · ${dateStr}\n${result} words · ${resultData.timeString}\nScore: ${resultData.score}\n#WordFury`
                      : `🔍 Word Search\nTheme: ${themeName}\nFound ${result} words · ${resultData.timeString}\nScore: ${resultData.score}\n#WordFury`;
                    try { await Share.share({ message: text }); } catch {}
                  }}
                >
                  <View style={overlayStyles.shareButtonInner}>
                    <Share2 size={18} color="#fff" />
                    <Text style={overlayStyles.shareButtonText}>Share Result</Text>
                  </View>
                </Pressable>

              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: { padding: 8 },
  backText: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: 'bold' },
  headerPlaceholder: { width: 60 },
  infoBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 'bold' },
  infoDivider: { width: 1, marginHorizontal: 8 },
  gridContainer: {
    padding: 8,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
    borderRadius: 3,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomScroll: {
    flex: 1,
  },
  bottomScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  gridWrapper: {
    position: 'relative',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  comboBadge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  comboBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  hintsLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  wordRow: {
    width: '33.33%',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  wordText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  finishButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

const overlayStyles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 2, padding: 16 },
  brand: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '900', marginBottom: 4 },
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
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12 },
  primaryButton: { borderWidth: 2, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, minWidth: 120, alignItems: 'center' },
  primaryButtonText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  shareButton: { marginTop: 10, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', backgroundColor: '#22c55e' },
  shareButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareButtonText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  popupContainer: { position: 'absolute', top: 60, left: 20, right: 20, alignItems: 'center', zIndex: 999 },
  popup: { width: SCREEN_WIDTH - 40, borderRadius: 16, padding: 16, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  popupUnlockLabel: { fontSize: 12, fontWeight: '600', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  popupContent: { flexDirection: 'row', alignItems: 'center' },
  popupEmoji: { fontSize: 40, marginRight: 15 },
  popupText: { flex: 1 },
  popupName: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  popupDesc: { fontSize: 14 },
});

export default PlayScreen;
