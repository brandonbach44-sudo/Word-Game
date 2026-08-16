// app/wordladder/game.tsx
// Quick Play — generates a fresh puzzle on-device for the chosen difficulty.
// Autosaves progress so returning to the app mid-game resumes seamlessly.

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import { generatePracticeLadder, type LadderDifficulty, type LadderPuzzle } from '../../src/wordladder/utils/generator';
import LadderPlayScreen from '../../src/wordladder/screens/LadderPlayScreen';
import { loadQuickPlayProgress, clearQuickPlayProgress, type QuickPlayProgressState } from '../../src/wordladder/utils/ladderStorage';

export default function WordLadderGameRoute() {
  const { background } = useTheme();
  const params = useLocalSearchParams();
  const difficulty = ((params.difficulty as string) || 'medium') as LadderDifficulty;

  const [puzzleKey, setPuzzleKey] = useState(0);
  const [savedProgress, setSavedProgress] = useState<QuickPlayProgressState | null | undefined>(undefined);
  const hydrated = savedProgress !== undefined;

  // Load any saved in-progress Quick Play on first mount only.
  useEffect(() => {
    loadQuickPlayProgress().then((p) => setSavedProgress(p ?? null));
  }, []);

  // On play-again, wipe the saved progress ref so the new game starts fresh.
  const handlePlayAgain = () => {
    setSavedProgress(null);
    clearQuickPlayProgress().catch(() => {});
    setPuzzleKey((k) => k + 1);
  };

  // Reconstruct the puzzle from saved progress, or generate a fresh one.
  const puzzle = useMemo<LadderPuzzle>(() => {
    if (savedProgress) {
      return {
        start: savedProgress.puzzle.start,
        end: savedProgress.puzzle.end,
        par: savedProgress.puzzle.par,
        wordLength: savedProgress.puzzle.wordLength,
        difficulty: (savedProgress.puzzle.difficulty || difficulty) as LadderDifficulty,
        solutionPath: savedProgress.puzzle.solution,
      };
    }
    return generatePracticeLadder(difficulty);
  }, [difficulty, puzzleKey, savedProgress]);

  if (!hydrated || !puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: background.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <LadderPlayScreen
      key={puzzleKey}
      puzzle={puzzle}
      mode="practice"
      difficulty={difficulty}
      initialPracticeProgress={savedProgress}
      onGoHome={() => router.back()}
      onPlayAgain={handlePlayAgain}
    />
  );
}
