// app/hexhive/practice.tsx
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { getRandomPuzzle } from '../../src/hexhive/utils/generator';
import HexHivePlayScreen from '../../src/hexhive/screens/HexHivePlayScreen';

export default function HexHivePracticeScreen() {
  // Bumping puzzleKey both picks a fresh random puzzle and forces a full
  // remount of HexHivePlayScreen, cleanly resetting the 60s timer and all
  // in-game state for "Play Again".
  const [puzzleKey, setPuzzleKey] = useState(0);
  const puzzle = useMemo(() => getRandomPuzzle(), [puzzleKey]);

  return (
    <HexHivePlayScreen
      key={puzzleKey}
      puzzle={puzzle}
      mode="practice"
      onGoHome={() => router.back()}
      onPlayAgain={() => setPuzzleKey((k) => k + 1)}
    />
  );
}
