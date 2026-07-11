// app/anagrams/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
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
  const [loading, setLoading] = useState(true);

  const puzzle = useMemo(() => generateDailyAnagrams(new Date()), []);

  useEffect(() => {
    (async () => {
      const [existingLock, existingProgress] = await Promise.all([loadDailyLock(), loadDailyProgress()]);
      if (existingLock && existingLock.dateISO === getTodayDateString()) {
        setLock(existingLock);
      } else if (existingProgress) {
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
