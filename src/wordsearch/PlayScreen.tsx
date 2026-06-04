// src/wordsearch/PlayScreen.tsx

import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

interface GameState {
  score: number;
  foundWords: PlacedWord[];
  elapsedSeconds: number;
  selectedCells: Array<{ row: number; col: number }>;
  currentSelection: Array<{ row: number; col: number }>;
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
    selectedCells: [],
    currentSelection: [],
  });

  const [gameFinished, setGameFinished] = useState(false);
  const [cellSize, setCellSize] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panResponderRef = useRef<any>(null);

  // Initialize sound manager
  useEffect(() => {
    const initSound = async () => {
      try {
        await SoundManager.init();
      } catch (error) {
        console.error('Failed to init sound:', error);
      }
    };
    initSound();
  }, []);

  // Timer
  useEffect(() => {
    if (gameFinished) return;

    timerRef.current = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameFinished]);

  // Pan responder for touch/drag
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (cellSize === 0) return;

        const gridX = gestureState.x0 - 16; // Account for padding
        const gridY = gestureState.y0 - 100; // Account for header

        const col = Math.floor(gridX / cellSize);
        const row = Math.floor(gridY / cellSize);

        if (
          row >= 0 &&
          row < puzzleData.grid.length &&
          col >= 0 &&
          col < puzzleData.grid[0].length
        ) {
          setGameState(prev => ({
            ...prev,
            currentSelection: [{ row, col }],
          }));
        }
      },
      onPanResponderRelease: () => {
        checkWord();
      },
    });
  }, [cellSize, puzzleData, gameState.foundWords]);

  const checkWord = () => {
    // Check if current selection matches any unfound word
    const selection = gameState.currentSelection;
    if (selection.length < 2) {
      setGameState(prev => ({
        ...prev,
        currentSelection: [],
      }));
      return;
    }

    // Simplified word checking - check against unfound words
    for (const placedWord of puzzleData.words) {
      if (gameState.foundWords.some(fw => fw.word === placedWord.word)) continue;

      // Check if selection matches this word
      const wordCells = getWordCells(placedWord);
      if (cellsMatch(selection, wordCells)) {
        // Word found!
        SoundManager.success();
        const scoreGain = placedWord.word.length * 10;
        setGameState(prev => ({
          ...prev,
          foundWords: [...prev.foundWords, placedWord],
          score: prev.score + scoreGain,
          currentSelection: [],
          selectedCells: [...prev.selectedCells, ...wordCells],
        }));

        // Check if all words found
        if (gameState.foundWords.length + 1 === puzzleData.words.length) {
          setTimeout(handleFinishGame, 500);
        }
        return;
      }
    }

    // Not a valid word
    SoundManager.error();
    setGameState(prev => ({
      ...prev,
      currentSelection: [],
    }));
  };

  const getWordCells = (word: PlacedWord) => {
    const cells: Array<{ row: number; col: number }> = [];
    const directions: Record<string, { dr: number; dc: number }> = {
      RIGHT: { dr: 0, dc: 1 },
      LEFT: { dr: 0, dc: -1 },
      DOWN: { dr: 1, dc: 0 },
      UP: { dr: -1, dc: 0 },
      DOWNRIGHT: { dr: 1, dc: 1 },
      DOWNLEFT: { dr: 1, dc: -1 },
      UPRIGHT: { dr: -1, dc: 1 },
      UPLEFT: { dr: -1, dc: -1 },
    };

    const dir = directions[word.direction];
    for (let i = 0; i < word.length; i++) {
      cells.push({
        row: word.row + dir.dr * i,
        col: word.col + dir.dc * i,
      });
    }
    return cells;
  };

  const cellsMatch = (
    selection: Array<{ row: number; col: number }>,
    wordCells: Array<{ row: number; col: number }>
  ) => {
    if (selection.length !== wordCells.length) return false;
    return selection.every((cell, i) => cell.row === wordCells[i].row && cell.col === wordCells[i].col);
  };

  const handleFinishGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const timeBonus = Math.max(0, Math.floor(300 / Math.max(gameState.elapsedSeconds, 1)));
    const finalScore = gameState.score + timeBonus;
    const allWordsFound = gameState.foundWords.length === puzzleData.words.length;

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

    const mins = Math.floor(gameState.elapsedSeconds / 60);
    const secs = gameState.elapsedSeconds % 60;
    const timeString = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    router.push({
      pathname: '/wordsearch/results',
      params: {
        score: finalScore.toString(),
        foundWords: gameState.foundWords.length.toString(),
        totalWords: puzzleData.words.length.toString(),
        allFound: allWordsFound ? 'true' : 'false',
        isDaily: isDaily ? 'true' : 'false',
        time: timeString,
      },
    });
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.statsContainer}>
          <Text style={[styles.stat, { color: background.textColor }]}>
            Score: {gameState.score}
          </Text>
          <Text style={[styles.stat, { color: background.textColor }]}>
            {formatTime(gameState.elapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Found words */}
      <View style={styles.foundWordsContainer}>
        <Text style={[styles.foundWordsLabel, { color: background.secondaryText }]}>
          Found: {gameState.foundWords.length}/{puzzleData.words.length}
        </Text>
        <View style={styles.foundWordsList}>
          {gameState.foundWords.map((word, idx) => (
            <Text key={idx} style={[styles.foundWord, { color: COLORS.accent }]}>
              {word.word}
            </Text>
          ))}
        </View>
      </View>

      {/* Grid */}
      <View
        style={[styles.gridContainer, { backgroundColor: background.cardColor }]}
        onLayout={evt => {
          const size = (evt.nativeEvent.layout.width - 32) / puzzleData.grid[0].length;
          setCellSize(size);
        }}
        {...(panResponderRef.current?.panHandlers || {})}
      >
        {puzzleData.grid.map((row: string[], rIdx: number) => (
          <View key={rIdx} style={styles.gridRow}>
            {row.map((cell: string, cIdx: number) => {
              const isFound = gameState.selectedCells.some(c => c.row === rIdx && c.col === cIdx);
              const isSelected = gameState.currentSelection.some(
                c => c.row === rIdx && c.col === cIdx
              );

              return (
                <View
                  key={`${rIdx}-${cIdx}`}
                  style={[
                    styles.gridCell,
                    {
                      width: cellSize || 40,
                      height: cellSize || 40,
                      backgroundColor: isFound
                        ? COLORS.accent
                        : isSelected
                        ? background.borderColor
                        : background.cardColor,
                      borderColor: background.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      {
                        color: isFound ? background.cardColor : background.textColor,
                      },
                    ]}
                  >
                    {cell}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* All words list */}
      <View style={styles.allWordsContainer}>
        <Text style={[styles.allWordsLabel, { color: background.secondaryText }]}>All Words:</Text>
        <View style={styles.allWordsList}>
          {puzzleData.words.map((word: PlacedWord, idx: number) => (
            <Text
              key={idx}
              style={[
                styles.wordItem,
                {
                  color: gameState.foundWords.some(fw => fw.word === word.word)
                    ? COLORS.accent
                    : background.textColor,
                  textDecorationLine: gameState.foundWords.some(fw => fw.word === word.word)
                    ? 'line-through'
                    : 'none',
                },
              ]}
            >
              {word.word}
            </Text>
          ))}
        </View>
      </View>

      {/* Finish button */}
      {gameState.foundWords.length > 0 && (
        <TouchableOpacity
          style={[styles.finishButton, { backgroundColor: COLORS.accent }]}
          onPress={handleFinishGame}
        >
          <Text style={styles.finishButtonText}>Finish Game</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backText: { fontSize: 16, fontWeight: '600' },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: { fontSize: 14, fontWeight: '600' },
  foundWordsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  foundWordsLabel: { fontSize: 12, marginBottom: 4 },
  foundWordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foundWord: { fontSize: 12, fontWeight: '700' },
  gridContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gridRow: { flexDirection: 'row' },
  gridCell: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 4,
  },
  cellText: { fontSize: 14, fontWeight: '600' },
  allWordsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  allWordsLabel: { fontSize: 12, marginBottom: 8 },
  allWordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordItem: { fontSize: 12, fontWeight: '500' },
  finishButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PlayScreen;
