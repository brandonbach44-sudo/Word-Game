// app/anagrams/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, View } from 'react-native';
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

  // Defer heavy puzzle generation until after navigation animation completes.
  // Running it synchronously during render (via useMemo) blocks Hermes during
  // the navigation transition and causes SIGSEGV crashes on iOS.
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
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
