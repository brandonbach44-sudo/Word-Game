// app/wordladder/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import { generateDailyLadder, type LadderPuzzle } from '../../src/wordladder/utils/generator';
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

  useEffect(() => {
    // Defer heavy work until after the navigation animation finishes.
    // This prevents the BFS puzzle generation from blocking the JS thread
    // while queued AsyncStorage TurboModule callbacks are trying to fire,
    // which was causing a SIGSEGV in Hermes's PinnedHermesValue during the
    // "View Results" navigation transition.
    const interaction = InteractionManager.runAfterInteractions(async () => {
      const [existingLock, existingProgress] = await Promise.all([
        loadDailyLock(),
        loadDailyProgress(),
      ]);

      if (existingLock && existingLock.dateISO === getTodayDateString()) {
        // View-results mode: player already completed today's puzzle.
        // The lock holds all the data we need — skip puzzle generation entirely.
        setLock(existingLock);
      } else {
        // New game or mid-session resume: generate today's puzzle now that
        // the navigation animation is complete (safe to do heavy BFS work).
        const generated = generateDailyLadder(new Date());
        setPuzzle(generated);
        if (existingProgress) {
          setProgress(existingProgress);
        }
      }

      setLoading(false);
    });

    return () => interaction.cancel();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: background.backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  const activePuzzle: LadderPuzzle = lock
    ? {
        start: lock.start,
        end: lock.end,
        par: lock.par,
        wordLength: lock.start.length,
        difficulty: 'medium',
        solutionPath: [],
      }
    : puzzle!;

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
