// src/wordgrid/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'wordgrid_stats';

export interface WordGridStats {
  gamesPlayed: number;
  highScore: number;
  totalScore: number;       // lifetime
  totalWordsFound: number;  // lifetime
  bestWordsInGame: number;  // most words in a single game
  longestWord: string;
}

const defaultStats: WordGridStats = {
  gamesPlayed: 0,
  highScore: 0,
  totalScore: 0,
  totalWordsFound: 0,
  bestWordsInGame: 0,
  longestWord: '',
};

export async function loadWordGridStats(): Promise<WordGridStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (raw) return { ...defaultStats, ...JSON.parse(raw) };
    return defaultStats;
  } catch {
    return defaultStats;
  }
}

export async function saveWordGridStats(stats: WordGridStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // silent
  }
}

export interface GameResult {
  score: number;
  words: { word: string; points: number }[];
}

/** Update stats after a game, return the new stats object. */
export async function updateStatsAfterGame(result: GameResult): Promise<WordGridStats> {
  const stats = await loadWordGridStats();

  stats.gamesPlayed += 1;
  stats.totalScore += result.score;
  stats.highScore = Math.max(stats.highScore, result.score);
  stats.totalWordsFound += result.words.length;
  stats.bestWordsInGame = Math.max(stats.bestWordsInGame, result.words.length);

  const longestThisGame = result.words.reduce(
    (best, w) => (w.word.length > best.length ? w.word : best),
    ''
  );
  if (longestThisGame.length > stats.longestWord.length) {
    stats.longestWord = longestThisGame;
  }

  await saveWordGridStats(stats);
  return stats;
}
