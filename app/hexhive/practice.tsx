// app/hexhive/practice.tsx
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { getRandomPuzzle } from '../../src/hexhive/utils/generator';
import HexHivePlayScreen from '../../src/hexhive/screens/HexHivePlayScreen';

export default function HexHivePracticeScreen() {
  // Fresh random puzzle each time this screen is entered.
  const puzzle = useMemo(() => getRandomPuzzle(), []);

  return <HexHivePlayScreen puzzle={puzzle} mode="practice" onGoHome={() => router.back()} />;
}
