// app/anagrams/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import { generateDailyAnagrams, type AnagramPuzzle } from '../../src/anagrams/utils/generator';
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

  useEffect(() => {
    // Defer heavy work until after the navigation animation finishes.
    // generateDailyAnagrams was running synchronously in useMemo on every
    // mount — including view-results mode where the generated puzzle was
    // never used. The computation blocked the Hermes JS thread while queued
    // AsyncStorage TurboModule callbacks fired into an inconsistent GC state,
    // causing EXC_BAD_ACCESS (SIGSEGV) in HermesRuntimeImpl::createArray.
    const interaction = InteractionManager.runAfterInteractions(async () => {
      const [existingLock, existingProgress] = await Promise.all([
        loadDailyLock(),
        loadDailyProgress(),
      ]);

      if (existingLock && existingLock.dateISO === getTodayDateString()) {
        // View-results mode: player already completed today's puzzle.
        // The lock has all the data needed — skip puzzle generation entirely.
        setLock(existingLock);
      } else {
        // New game or mid-session resume: generate puzzle now that the
        // navigation animation is complete (safe to do heavy work).
        const generated = generateDailyAnagrams(new Date());
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

  // For view-results mode, reconstruct the puzzle shape from lock data.
  // The result overlay only needs the word list — scrambled tiles aren't used.
  const activePuzzle: AnagramPuzzle = lock
    ? { rounds: lock.words.map((word) => ({ word, scrambled: [] })) }
    : puzzle!;

  return (
    <AnagramsPlayScreen
      puzzle={activePuzzle}
      mode="daily"
      lockedResult={lock}
      initialProgress={progress}
      onGoHome={() => router.back()}
    />
  );
}
