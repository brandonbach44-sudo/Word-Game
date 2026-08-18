// app/hexhive/daily.tsx
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { getDailyPuzzle, type HexHivePuzzle } from '../../src/hexhive/utils/generator';
import { loadDailyProgress } from '../../src/hexhive/utils/storage';
import HexHivePlayScreen from '../../src/hexhive/screens/HexHivePlayScreen';

export default function HexHiveDailyScreen() {
  const { background } = useTheme();
  const [puzzle, setPuzzle] = useState<HexHivePuzzle | null>(null);
  const [initialFoundWords, setInitialFoundWords] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Defer until after navigation animation to avoid blocking the JS thread
    // with puzzle generation while AsyncStorage callbacks are queued.
    const interaction = InteractionManager.runAfterInteractions(async () => {
      const generated = getDailyPuzzle(new Date());
      setPuzzle(generated);
      const progress = await loadDailyProgress();
      if (progress) setInitialFoundWords(progress.foundWords);
      setLoading(false);
    });

    return () => interaction.cancel();
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
