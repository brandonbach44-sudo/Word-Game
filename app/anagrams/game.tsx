// app/anagrams/game.tsx — Quick Play (practice) mode, unlimited replays.
// Autosaves progress so returning mid-run resumes from where the player left off.

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import type { AnagramPuzzle } from '../../src/anagrams/utils/generator';
import { generatePracticeAnagrams } from '../../src/anagrams/utils/generator';
import AnagramsPlayScreen from '../../src/anagrams/screens/AnagramsPlayScreen';
import { loadPracticeProgress, clearPracticeProgress, type PracticeProgressState } from '../../src/anagrams/utils/anagramsStorage';

export default function AnagramsGameScreen() {
  const [key, setKey] = useState(0);
  const [savedProgress, setSavedProgress] = useState<PracticeProgressState | null | undefined>(undefined);
  const hydrated = savedProgress !== undefined;

  // Load any saved in-progress practice run on first mount only.
  useEffect(() => {
    loadPracticeProgress().then((p) => setSavedProgress(p ?? null));
  }, []);

  const handlePlayAgain = () => {
    setSavedProgress(null);
    clearPracticeProgress().catch(() => {});
    setKey((k) => k + 1);
  };

  // Reconstruct puzzle from saved progress or generate a fresh one.
  const puzzle: AnagramPuzzle = savedProgress
    ? { rounds: savedProgress.rounds }
    : generatePracticeAnagrams();

  if (!hydrated) return null;

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
