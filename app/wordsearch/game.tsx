// app/wordsearch/game.tsx
// Generates the puzzle here so we never pass large JSON through URL params.

import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import { WORD_SEARCH_THEMES } from '../../src/wordsearch/data/themes';
import PlayScreen from '../../src/wordsearch/PlayScreen';
import { generatePuzzle } from '../../src/wordsearch/utils/generator';
import { DIFFICULTY_CONFIG, type Difficulty } from '../../src/wordsearch/utils/difficultyConfig';

export default function WordSearchGameRoute() {
  const { background } = useTheme();
  const params = useLocalSearchParams();

  const themeId = params.themeId as string | undefined;
  const difficulty = (params.difficulty as string | undefined) as Difficulty | undefined;

  const puzzle = useMemo(() => {
    if (!themeId || !difficulty) return null;
    const theme = WORD_SEARCH_THEMES.find(t => t.id === themeId);
    const config = DIFFICULTY_CONFIG[difficulty];
    if (!theme || !config) return null;
    return generatePuzzle(theme, {
      rows: config.rows,
      cols: config.cols,
      wordsPerPuzzle: config.wordsPerPuzzle,
      allowBackwards: config.allowBackwards,
      allowDiagonal: config.allowDiagonal,
      maxWordLength: config.maxWordLength,
    });
  }, [themeId, difficulty]);

  if (!themeId || !difficulty || !puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: background.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <PlayScreen
      themeId={themeId as any}
      difficulty={difficulty}
      puzzleData={puzzle}
      timeLimit={DIFFICULTY_CONFIG[difficulty].timeLimit}
    />
  );
}
