// app/wordsearch/daily.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../../src/shared/theme';
import { useTheme } from '../../src/shared/ThemeContext';
import { WORD_SEARCH_THEMES } from '../../src/wordsearch/data/themes';
import PlayScreen from '../../src/wordsearch/PlayScreen';
import { generatePuzzleWithSeed, type WordSearchPuzzle } from '../../src/wordsearch/utils/generator';
import { dateToSeed, getTodayDateString } from '../../src/wordsearch/utils/storage';
import {
  loadWordSearchDailyProgress,
  loadWordSearchDailyLock,
  loadWordSearchDailyStats,
  type WordSearchDailyProgress,
  type WordSearchDailyLock,
} from '../../src/wordsearch/utils/wsStorage';

export default function WordSearchDailyScreen() {
  const { background } = useTheme();
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null);
  const [progress, setProgress] = useState<WordSearchDailyProgress | null>(null);
  const [lock, setLock] = useState<WordSearchDailyLock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateDailyPuzzle = async () => {
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
          wordsPerPuzzle: 10,
          allowBackwards: true,
          allowDiagonal: true,
          maxWordLength: 10,
        });

        setPuzzle(generatedPuzzle);

        // Already finished today's attempt? Show that result instead of
        // starting a fresh puzzle — this is what "View Results" needed.
        const existingLock = await loadWordSearchDailyLock();
        if (existingLock) {
          setLock(existingLock);
        } else {
          // Defensive fallback: the separate (older) daily-stats record can
          // say today is already played with no matching lock — e.g. data
          // saved before the lock feature existed, or storage corruption.
          // Without this, that state would silently fall through to a
          // fresh, replayable puzzle, defeating "one attempt per day."
          // Reconstruct a best-effort lock from what stats we do have
          // instead (exact found-word list is lost, so the answer key
          // reveal won't be accurate for this one legacy day).
          const dailyStats = await loadWordSearchDailyStats();
          if (dailyStats.lastPlayedDate === getTodayDateString()) {
            setLock({
              dateISO: getTodayDateString(),
              score: dailyStats.lastDailyScore,
              // If they won, every word was found — otherwise the exact
              // list is genuinely lost, so it falls back to none.
              foundWordTexts: dailyStats.lastDailyResult === 'won'
                ? generatedPuzzle.words.map(w => w.word)
                : [],
              totalWords: generatedPuzzle.words.length,
              allFound: dailyStats.lastDailyResult === 'won',
              timeString: '—',
              elapsedSeconds: 0,
              multiplier: 1,
              timeBonus: 0,
            });
          } else {
            // Otherwise resume an in-progress attempt if the app was closed mid-game
            const existingProgress = await loadWordSearchDailyProgress();
            if (existingProgress) setProgress(existingProgress);
          }
        }
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
      timeLimit={240} // 4-minute countdown for daily (Challenge settings)
      initialProgress={progress}
      lockedResult={lock}
    />
  );
}
