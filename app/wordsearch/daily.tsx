// app/wordsearch/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../../src/shared/theme';
import { useTheme } from '../../src/shared/ThemeContext';
import { WORD_SEARCH_THEMES } from '../../src/wordsearch/data/themes';
import PlayScreen from '../../src/wordsearch/PlayScreen';
import { generatePuzzleWithSeed, type WordSearchPuzzle } from '../../src/wordsearch/utils/generator';
import { dateToSeed } from '../../src/wordsearch/utils/storage';

export default function WordSearchDailyScreen() {
  const { background } = useTheme();
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateDailyPuzzle = () => {
      try {
        // Get today's seed (same for all users)
        const seed = dateToSeed(new Date());

        // Pick a theme deterministically based on seed
        const themeIndex = seed % WORD_SEARCH_THEMES.length;
        const dailyTheme = WORD_SEARCH_THEMES[themeIndex];

        // Generate puzzle with seeded randomness
        const generatedPuzzle = generatePuzzleWithSeed(dailyTheme, seed, {
          rows: 12,
          cols: 12,
          wordsPerPuzzle: 15,
          allowBackwards: true,
          allowDiagonal: true,
        });

        setPuzzle(generatedPuzzle);
      } catch (error) {
        console.error('Failed to generate daily puzzle:', error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    generateDailyPuzzle();
  }, []);

  if (loading || !puzzle) {
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

  return (
    <PlayScreen
      themeId={puzzle.themeId as any}
      difficulty="challenge"
      puzzleData={puzzle}
      isDaily={true}
    />
  );
}
