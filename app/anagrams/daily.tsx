// app/anagrams/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import type { AnagramPuzzle } from '../../src/anagrams/utils/generator';
import { generateDailyAnagrams } from '../../src/anagrams/utils/generator';
import {
  DailyLockState,
  DailyProgressState,
  getTodayDateString,
  loadDailyLock,
  loadDailyProgress,
} from '../../src/anagrams/utils/anagramsStorage';
import AnagramsPlayScreen from '../../src/anagrams/screens/AnagramsPlayScreen';

export default function AnagramsDailyScreen() {
  const { background } = useTheme();
  const [lock, setLock] = useState<DailyLockState | null>(null);
  const [progress, setProgress] = useState<DailyProgressState | null>(null);
  const [puzzle, setPuzzle] = useState<AnagramPuzzle | null>(null);
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
        const generatedPuzzle = generateDailyAnagrams(new Date());
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

  return (
    <AnagramsPlayScreen
      puzzle={puzzle}
      mode="daily"
      lockedResult={lock}
      initialProgress={progress}
      onGoHome={() => router.back()}
    />
  );
}
