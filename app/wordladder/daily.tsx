// app/wordladder/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, View } from 'react-native';
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

  // Defer heavy puzzle generation until after navigation animation completes.
  // Running it synchronously during render (via useMemo) blocks Hermes during
  // the navigation transition and causes SIGSEGV crashes on iOS.
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      (async () => {
        const generatedPuzzle = generateDailyLadder(new Date());
        const [existingLock, existingProgress] = await Promise.all([
          loadDailyLock(),
          loadDailyProgress(),
        ]);
        if (existingLock && existingLock.dateISO === getTodayDateString()) {
          setLock(existingLock);
        } else if (existingProgress) {
          // loadDailyProgress() already filters to today's date internally.
          setProgress(existingProgress);
        }
        setPuzzle(generatedPuzzle);
        setLoading(false);
      })();
    });
    return () => interaction.cancel();
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
