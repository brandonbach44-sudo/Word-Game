// app/wordladder/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
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
  const [loading, setLoading] = useState(true);

  const puzzle = useMemo(() => generateDailyLadder(new Date()), []);

  useEffect(() => {
    (async () => {
      const [existingLock, existingProgress] = await Promise.all([loadDailyLock(), loadDailyProgress()]);
      if (existingLock && existingLock.dateISO === getTodayDateString()) {
        setLock(existingLock);
      } else if (existingProgress) {
        // loadDailyProgress() already filters to today's date internally.
        setProgress(existingProgress);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
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
