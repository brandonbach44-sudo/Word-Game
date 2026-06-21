// src/wordsearch/PlayScreen.tsx

import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  ScrollView,
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
import { saveDailyResult, updateStatsAfterGame } from '../../src/wordsearch/utils/storage';

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
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    foundWords: [],
    elapsedSeconds: 0,
    foundCells: [],
    currentSelection: [],
  });
  const [gameFinished, setGameFinished] = useState(false);

  // Grid layout measured values
  const gridRef = useRef<View>(null);
  const gridLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const cellWidth = useRef(0);
  const cellHeight = useRef(0);
  const numCols = puzzleData.grid[0]?.length ?? 1;
  const numRows = puzzleData.grid.length;

  // Drag state (refs, not state — don't need re-render mid-drag)
  const dragStart = useRef<Cell | null>(null);

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

  // Keep a ref to gameState for use inside PanResponder closures
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

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
        setGameState(prev => ({ ...prev, currentSelection: [cell] }));
      },

      onPanResponderMove: evt => {
        if (!dragStart.current) return;
        const cell = getCellFromPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        const line = buildSelectionLine(dragStart.current, cell, numRows, numCols);
        setGameState(prev => ({ ...prev, currentSelection: line }));
      },

      onPanResponderRelease: evt => {
        if (!dragStart.current) return;
        const cell = getCellFromPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        const line = cell
          ? buildSelectionLine(dragStart.current, cell, numRows, numCols)
          : [dragStart.current];
        dragStart.current = null;

        const state = gameStateRef.current;
        let wordFound = false;

        for (const placedWord of puzzleData.words) {
          if (state.foundWords.some(fw => fw.word === placedWord.word)) continue;
          const wordCells = getWordCells(placedWord);
          if (selectionMatchesWord(line, wordCells)) {
            SoundManager.success();
            const scoreGain = placedWord.word.length * 10;
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
    const timeBonus = Math.max(0, Math.floor(300 / Math.max(state.elapsedSeconds, 1)));
    const finalScore = state.score + timeBonus;
    const allWordsFound = state.foundWords.length === puzzleData.words.length;

    try {
      if (isDaily) {
        await saveDailyResult(allWordsFound ? 'won' : 'lost', finalScore);
      } else {
        await updateStatsAfterGame(allWordsFound, finalScore);
      }
    } catch (error) {
      console.error('Failed to update stats:', error);
    }

    setGameFinished(true);

    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = state.elapsedSeconds % 60;
    const timeString = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    router.push({
      pathname: '/wordsearch/results',
      params: {
        score: finalScore.toString(),
        foundWords: state.foundWords.length.toString(),
        totalWords: puzzleData.words.length.toString(),
        allFound: allWordsFound ? 'true' : 'false',
        isDaily: isDaily ? 'true' : 'false',
        time: timeString,
        themeName,
        difficulty,
      },
    });
  };

  // Register triggerFinish in ref so the timer interval can call it
  useEffect(() => {
    triggerFinishRef.current = triggerFinish;
  });

  const handleManualFinish = () => triggerFinish();

  const handleBack = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Countdown display — only when isDaily and timeLimit is set
  const remainingSeconds = timeLimit ? Math.max(0, timeLimit - gameState.elapsedSeconds) : null;
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
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Back</Text>
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
          <Text style={[styles.infoLabel, { color: background.secondaryText }]}>
            {remainingSeconds !== null ? 'Time Left' : 'Time'}
          </Text>
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

      {/* Grid — PanResponder captures touches here, preventing ScrollView interference */}
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

              let cellBg = background.cardColor;
              let textColor = background.textColor;
              if (isFound) {
                cellBg = COLORS.accent;
                textColor = '#fff';
              } else if (isSelected) {
                cellBg = COLORS.accent + '55';
                textColor = background.textColor;
              }

              return (
                <View
                  key={`${rIdx}-${cIdx}`}
                  style={[
                    styles.gridCell,
                    {
                      backgroundColor: cellBg,
                      borderColor: isSelected ? COLORS.accent : background.borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.cellText, { color: textColor }]}>{letter}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Word list + finish button — scrollable below the grid */}
      <ScrollView
        style={styles.bottomScroll}
        contentContainerStyle={styles.bottomScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wordGrid}>
          {puzzleData.words.map((word, idx) => {
            const found = gameState.foundWords.some(fw => fw.word === word.word);
            return (
              <View key={idx} style={styles.wordRow}>
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
                : 'Finish Early'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 0,
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

export default PlayScreen;
