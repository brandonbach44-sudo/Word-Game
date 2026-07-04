// app/wordladder/game.tsx
// Practice mode — generates a fresh puzzle on-device for the chosen difficulty.

import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import { generatePracticeLadder, type LadderDifficulty } from '../../src/wordladder/utils/generator';
import LadderPlayScreen from '../../src/wordladder/screens/LadderPlayScreen';

export default function WordLadderGameRoute() {
  const { background } = useTheme();
  const params = useLocalSearchParams();
  const difficulty = ((params.difficulty as string) || 'medium') as LadderDifficulty;

  const [puzzleKey, setPuzzleKey] = useState(0);
  const puzzle = useMemo(() => generatePracticeLadder(difficulty), [difficulty, puzzleKey]);

  if (!puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: background.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <LadderPlayScreen
      key={puzzleKey}
      puzzle={puzzle}
      mode="practice"
      difficulty={difficulty}
      onGoHome={() => router.replace('/wordladder')}
      onPlayAgain={() => setPuzzleKey((k) => k + 1)}
    />
  );
}
