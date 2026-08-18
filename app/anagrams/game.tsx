// app/anagrams/game.tsx — Quick Play (practice) mode, unlimited replays.
// Autosaves progress so returning mid-run resumes from where the player left off.

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import type { AnagramPuzzle } from '../../src/anagrams/utils/generator';
import { generatePracticeAnagrams } from '../../src/anagrams/utils/generator';
import AnagramsPlayScreen from '../../src/anagrams/screens/AnagramsPlayScreen';
import { loadPracticeProgress, clearPracticeProgress, type PracticeProgressState } from '../../src/anagrams/utils/anagramsStorage';

export default function AnagramsGameScreen() {
  const { background } = useTheme();
  const [key, setKey] = useState(0);
  const [puzzle, setPuzzle] = useState<AnagramPuzzle | null>(null);
  const [savedProgress, setSavedProgress] = useState<PracticeProgressState | null>(null);

  // Defer heavy puzzle generation until after navigation animation completes.
  // Running it synchronously during render blocks Hermes and causes SIGSEGV crashes.
  useEffect(() => {
    setPuzzle(null);
    const interaction = InteractionManager.runAfterInteractions(async () => {
      const p = await loadPracticeProgress();
      if (p) {
        setSavedProgress(p);
        setPuzzle({ rounds: p.rounds });
      } else {
        setSavedProgress(null);
        setPuzzle(generatePracticeAnagrams());
      }
    });
    return () => interaction.cancel();
  }, [key]);

  const handlePlayAgain = () => {
    clearPracticeProgress().catch(() => {});
    setKey((k) => k + 1);
  };

  if (!puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: background.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <AnagramsPlayScreen
      key={key}
      puzzle={puzzle}
      mode="practice"
      initialPracticeProgress={savedProgress}
      onGoHome={() => router.back()}
      onPlayAgain={handlePlayAgain}
    />
  );
}
