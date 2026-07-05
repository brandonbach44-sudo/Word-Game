// app/hexhive/daily.tsx
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../src/shared/ThemeContext';
import { getDailyPuzzle } from '../../src/hexhive/utils/generator';
import { loadDailyProgress } from '../../src/hexhive/utils/storage';
import HexHivePlayScreen from '../../src/hexhive/screens/HexHivePlayScreen';

export default function HexHiveDailyScreen() {
  const { background } = useTheme();
  const [initialFoundWords, setInitialFoundWords] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const puzzle = useMemo(() => getDailyPuzzle(new Date()), []);

  useEffect(() => {
    (async () => {
      const progress = await loadDailyProgress();
      if (progress) setInitialFoundWords(progress.foundWords);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: background.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
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
