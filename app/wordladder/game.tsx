// app/wordladder/game.tsx
// Quick Play — generates a fresh puzzle on-device for the chosen difficulty.
// Autosaves progress so returning to the app mid-game resumes seamlessly.

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const [puzzle, setPuzzle] = useState<LadderPuzzle | null>(null);
  const [savedProgress, setSavedProgress] = useState<QuickPlayProgressState | null>(null);

  // Defer heavy BFS puzzle generation until after navigation animation completes.
  // InteractionManager.runAfterInteractions() does NOT work with Expo Router's
  // native stack — native animations are invisible to JS's InteractionManager,
  // so the callback fires immediately during the animation and the synchronous
  // BFS/word-graph work on the JS thread causes a SIGSEGV crash on iOS.
  // setTimeout(500) reliably waits past the ~300ms navigation animation.
  useEffect(() => {
    setPuzzle(null);
    const timer = setTimeout(async () => {
      const p = await loadQuickPlayProgress();
      if (p) {
        setSavedProgress(p);
        setPuzzle({
          start: p.puzzle.start,
          end: p.puzzle.end,
          par: p.puzzle.par,
          wordLength: p.puzzle.wordLength,
          difficulty: (p.puzzle.difficulty || difficulty) as LadderDifficulty,
          solutionPath: p.puzzle.solution,
        });
      } else {
        setSavedProgress(null);
        setPuzzle(generatePracticeLadder(difficulty));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [puzzleKey]);

  // On play-again, wipe the saved progress and trigger a new generation.
  const handlePlayAgain = () => {
    clearQuickPlayProgress().catch(() => {});
    setSavedProgress(null);
    setPuzzleKey((k) => k + 1);
  };

  if (!puzzle) {
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
