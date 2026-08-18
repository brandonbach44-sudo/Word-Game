// app/wordladder/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import type { LadderPuzzle } from '../../src/wordladder/utils/generator';
import { generateDailyLadder } from '../../src/wordladder/utils/generator';
import {
  DailyLockState,
  DailyProgressState,
  getTodayDateString,
  loadDailyLock,
  loadDailyProgress,
} from '../../src/wordladder/utils/ladderStorage';
import LadderPlayScreen from '../../src/wordladder/screens/LadderPlayScreen';

export default function WordLadderDailyScreen() {
  const { background } = useTheme();
  const [lock, setLock] = useState<DailyLockState | null>(null);
  const [progress, setProgress] = useState<DailyProgressState | null>(null);
  const [puzzle, setPuzzle] = useState<LadderPuzzle | null>(null);
  const [loading, setLoading] = useState(true);

  // Defer puzzle generation until AFTER the iOS navigation animation finishes.
  // InteractionManager.runAfterInteractions() does NOT work with Expo Router's
  // native stack — native animations are invisible to JS's InteractionManager,
  // so the callback fires immediately during the animation and the synchronous
  // BFS/word-graph work on the JS thread causes a SIGSEGV crash on iOS.
  // setTimeout(500) reliably waits past the ~300ms navigation animation.
  useEffect(() => {
    const timer = setTimeout(() => {
      (async () => {
        const generatedPuzzle = generateDailyLadder(new Date());
        const [existingLock, existingProgress] = await Promise.all([
          loadDailyLock(),
          loadDailyProgress(),
        ]);
        if (existingLock && existingLock.dateISO === getTodayDateString()) {
          setLock(existingLock);
        } else if (existingProgress) {
          setProgress(existingProgress);
        }
        setPuzzle(generatedPuzzle);
        setLoading(false);
      })();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: background.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  const activePuzzle = lock
    ? { start: lock.start, end: lock.end, par: lock.par, wordLength: lock.start.length, difficulty: 'medium' as const, solutionPath: [] }
    : puzzle;

  return (
    <LadderPlayScreen
      puzzle={activePuzzle}
      mode="daily"
      difficulty="medium"
      lockedResult={lock}
      initialProgress={progress}
      onGoHome={() => router.back()}
    />
  );
}
