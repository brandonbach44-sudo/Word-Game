// app/hexhive/practice.tsx
// Autosaves in-progress Quick Play so returning mid-game resumes seamlessly.
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getRandomPuzzleWithIndex } from '../../src/hexhive/utils/generator';
import { PUZZLES } from '../../src/hexhive/data/puzzles';
import HexHivePlayScreen from '../../src/hexhive/screens/HexHivePlayScreen';
import { loadQuickPlayProgress, clearQuickPlayProgress, type QuickPlayProgress } from '../../src/hexhive/utils/storage';
import type { HexHivePuzzle } from '../../src/hexhive/data/puzzles';

export default function HexHivePracticeScreen() {
  const [puzzleKey, setPuzzleKey] = useState(0);
  const lastIndexRef = useRef<number | undefined>(undefined);
  const [savedProgress, setSavedProgress] = useState<QuickPlayProgress | null | undefined>(undefined);
  const hydrated = savedProgress !== undefined;

  // Load any in-progress Quick Play session on first mount only.
  useEffect(() => {
    loadQuickPlayProgress().then((p) => setSavedProgress(p ?? null));
  }, []);

  const handlePlayAgain = () => {
    setSavedProgress(null);
    clearQuickPlayProgress().catch(() => {});
    setPuzzleKey((k) => k + 1);
  };

  const { puzzle, initialFoundWords, initialTimeLeft } = useMemo<{
    puzzle: HexHivePuzzle;
    initialFoundWords?: string[];
    initialTimeLeft?: number;
  }>(() => {
    // If there's a saved session, find the matching puzzle by center+letters.
    if (savedProgress) {
      const match = PUZZLES.find(
        (p) =>
          p.center === savedProgress.puzzleCenter &&
          p.letters.length === savedProgress.puzzleLetters.length &&
          savedProgress.puzzleLetters.every((l, i) => p.letters[i] === l)
      );
      if (match) {
        return {
          puzzle: match,
          initialFoundWords: savedProgress.foundWords,
          initialTimeLeft: savedProgress.timeLeft > 0 ? savedProgress.timeLeft : undefined,
        };
      }
    }
    // No saved session (or puzzle not found) — generate a fresh one.
    const { puzzle: p, index } = getRandomPuzzleWithIndex(lastIndexRef.current);
    lastIndexRef.current = index;
    return { puzzle: p };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey, savedProgress]);

  if (!hydrated) return null;

  return (
    <HexHivePlayScreen
      key={puzzleKey}
      puzzle={puzzle}
      mode="practice"
      initialFoundWords={initialFoundWords}
      initialTimeLeft={initialTimeLeft}
      onGoHome={() => router.back()}
      onPlayAgain={handlePlayAgain}
    />
  );
}
