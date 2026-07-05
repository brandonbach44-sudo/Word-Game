// app/hexhive/practice.tsx
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { getRandomPuzzleWithIndex } from '../../src/hexhive/utils/generator';
import HexHivePlayScreen from '../../src/hexhive/screens/HexHivePlayScreen';

export default function HexHivePracticeScreen() {
  // Bumping puzzleKey both picks a fresh random puzzle and forces a full
  // remount of HexHivePlayScreen, cleanly resetting the 60s timer and all
  // in-game state for "Play Again". lastIndexRef excludes the just-played
  // puzzle so "Play Again" can't hand back the exact same hive twice in a row.
  const [puzzleKey, setPuzzleKey] = useState(0);
  const lastIndexRef = useRef<number | undefined>(undefined);
  const puzzle = useMemo(() => {
    const { puzzle: p, index } = getRandomPuzzleWithIndex(lastIndexRef.current);
    lastIndexRef.current = index;
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey]);

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
