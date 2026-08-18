// app/hexhive/daily.tsx
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { getDailyPuzzle, type HexHivePuzzle } from '../../src/hexhive/utils/generator';
import { loadDailyProgress } from '../../src/hexhive/utils/storage';
import HexHivePlayScreen from '../../src/hexhive/screens/HexHivePlayScreen';

export default function HexHiveDailyScreen() {
  const { background } = useTheme();
  const [puzzle, setPuzzle] = useState<HexHivePuzzle | null>(null);
  const [initialFoundWords, setInitialFoundWords] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Generate immediately on mount. InteractionManager.runAfterInteractions()
  // does not work with Expo Router's native stack — native animations are
  // invisible to JS, so the callback fired straight away anyway while still
  // showing players a loading spinner. Hex Hive puzzles are curated letter
  // sets, so generation is a lookup, not a search.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const generated = getDailyPuzzle(new Date());
      const progress = await loadDailyProgress();
      if (cancelled) return;
      setPuzzle(generated);
      if (progress) setInitialFoundWords(progress.foundWords);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
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
        <ActivityIndicator color="#D4A017" size="large" />
      </View>
    );
  }

  return (
    <HexHivePlayScreen
      puzzle={puzzle}
      mode="daily"
      initialFoundWords={initialFoundWords}
      onGoHome={() => router.back()}
    />
  );
}
