// src/wordsearch/PlayScreen.tsx

import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
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
import type { WordSearchThemeId } from '../../src/wordsearch/data/themes';
import type { PlacedWord, WordSearchPuzzle } from '../../src/wordsearch/utils/generator';
import { saveDailyResult, updateStatsAfterGame } from '../../src/wordsearch/utils/storage';

interface PlayScreenProps {
  themeId: WordSearchThemeId;
  difficulty: string;
  puzzleData: WordSearchPuzzle;
  isDaily?: boolean;
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

/** Given a start and end cell, return all cells in a straight line (H, V, or diagonal). */
function buildSelectionLine(start: Cell, end: Cell): Cell[] {
  const dr = end.row - start.row;
  const dc = end.col - start.col;

  // Must be horizontal, vertical, or 45° diagonal
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);
  if (absR !== 0 && absC !== 0 && absR !== absC) {
    // Not a valid straight line — snap to the dominant axis
    return [start];
  }

  const steps = Math.max(absR, absC);
  if (steps === 0) return [start];

  const stepR = dr === 0 ? 0 : dr / absR;
  const stepC = dc === 0 ? 0 : dc / absC;

  const cells: Cell[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + stepR * i, col: start.col + stepC * i });
  }
  return cells;
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

const PlayScreen: React.FC<PlayScreenProps> = ({
  themeId,
  difficulty,
  puzzleData,
  isDaily = false,
}) => {
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
  const cellSize = useRef(0);
  const numCols = puzzleData.grid[0]?.length ?? 1;
  const numRows = puzzleData.grid.length;

  // Drag state (refs, not state — don't need re-render mid-drag)
  const dragStart = useRef<Cell | null>(null);

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (gameFinished) return;
    timerRef.current = setInterval(() => {
      setGameState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameFinished]);

  // Sound
  useEffect(() => {
    SoundManager.init().catch(() => {});
  }, []);

  const measureGrid = () => {
    gridRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      gridLayout.current = { x: pageX, y: pageY, width, height };
      cellSize.current = width / numCols;
    });
  };

  const getCellFromPoint = (pageX: number, pageY: number): Cell | null => {
    const layout = gridLayout.current;
    if (!layout || cellSize.current === 0) return null;

    const col = Math.floor((pageX - layout.x) / cellSize.current);
    const row = Math.floor((pageY - layout.y) / cellSize.current);

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
        const cell = getCellFromPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        dragStart.current = cell;
        setGameState(prev => ({ ...prev, currentSelection: [cell] }));
      },

      onPanResponderMove: evt => {
        if (!dragStart.current) return;
        const cell = getCellFromPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        const line = buildSelectionLine(dragStart.current, cell);
        setGameState(prev => ({ ...prev, currentSelection: line }));
      },

      onPanResponderRelease: evt => {
        if (!dragStart.current) return;
        const cell = getCellFromPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        const line = cell ? buildSelectionLine(dragStart.current, cell) : [dragStart.current];
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
      },
    });
  };

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
          <Text style={[styles.infoLabel, { color: background.secondaryText }]}>Time</Text>
          <Text style={[styles.infoValue, { color: background.textColor }]}>{formatTime(gameState.elapsedSeconds)}</Text>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: background.borderColor }]} />
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: background.secondaryText }]}>Found</Text>
          <Text style={[styles.infoValue, { color: background.textColor }]}>{gameState.foundWords.length}/{puzzleData.words.length}</Text>
        </View>
      </View>

      {/* Word list */}
      <View style={styles.wordListContainer}>
        <View style={styles.wordList}>
          {puzzleData.words.map((word, idx) => {
            const found = gameState.foundWords.some(fw => fw.word === word.word);
            return (
              <Text
                key={idx}
                style={[
                  styles.wordChip,
                  {
                    color: found ? background.cardColor : background.textColor,
                    backgroundColor: found ? COLORS.accent : background.cardColor,
                    borderColor: found ? COLORS.accent : background.borderColor,
                    textDecorationLine: found ? 'line-through' : 'none',
                    opacity: found ? 0.85 : 1,
                  },
                ]}
              >
                {word.word}
              </Text>
            );
          })}
        </View>
      </View>

      {/* Grid */}
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

      {/* Finish button */}
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
  wordListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  wordList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wordChip: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  foundCount: {
    fontSize: 11,
    marginTop: 6,
  },
  gridContainer: {
    marginHorizontal: 12,
    marginVertical: 8,
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
  finishButton: {
    marginHorizontal: 16,
    marginBottom: 16,
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
