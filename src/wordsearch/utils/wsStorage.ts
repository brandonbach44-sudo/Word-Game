// src/wordsearch/utils/wsStorage.ts
// Word Search specific stats and daily storage (uses proper per-game keys)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayDateString, getYesterdayDateString } from './storage';

// ============================================================================
// WORD SEARCH STATS
// ============================================================================

export interface WordSearchStats {
  // Overall
  gamesPlayed: number;
  gamesWon: number;           // all words found
  lifetimeScore: number;
  bestScore: number;

  // Cumulative words found across all games
  totalWordsFound: number;

  // Per-difficulty best scores
  bestScoreEasy: number;
  bestScoreChallenge: number;
  bestScoreExtreme: number;

  // Per-difficulty fastest completion times (seconds), 0 = never completed
  fastestTimeEasy: number;
  fastestTimeChallenge: number;
  fastestTimeExtreme: number;

  // Per-difficulty completion counts (all words found)
  easyCompleted: number;
  challengeCompleted: number;
  extremeCompleted: number;

  // Daily challenge counts
  dailyGamesPlayed: number;
  dailyGamesWon: number;

  // Win streak (consecutive all-words-found)
  currentStreak: number;
  bestStreak: number;

  // Daily play streak
  lastPlayedDate: string;
  currentDayStreak: number;
  bestDayStreak: number;
}

const STATS_KEY = 'wordsearch_stats';

const defaultStats: WordSearchStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  lifetimeScore: 0,
  bestScore: 0,
  totalWordsFound: 0,
  bestScoreEasy: 0,
  bestScoreChallenge: 0,
  bestScoreExtreme: 0,
  fastestTimeEasy: 0,
  fastestTimeChallenge: 0,
  fastestTimeExtreme: 0,
  easyCompleted: 0,
  challengeCompleted: 0,
  extremeCompleted: 0,
  dailyGamesPlayed: 0,
  dailyGamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: '',
  currentDayStreak: 0,
  bestDayStreak: 0,
};

export async function loadWordSearchStats(): Promise<WordSearchStats> {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    return data ? { ...defaultStats, ...JSON.parse(data) } : { ...defaultStats };
  } catch {
    return { ...defaultStats };
  }
}

export async function saveWordSearchStats(stats: WordSearchStats): Promise<void> {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export interface GameResult {
  won: boolean;             // all words found
  score: number;
  elapsedSeconds: number;
  difficulty: 'easy' | 'challenge' | 'extreme' | string;
  wordsFound: number;       // how many words were found this game
  isDaily?: boolean;
}

export async function updateWordSearchStats(result: GameResult): Promise<WordSearchStats> {
  const stats = await loadWordSearchStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Day streak
  if (stats.lastPlayedDate !== today) {
    if (stats.lastPlayedDate === yesterday) {
      stats.currentDayStreak += 1;
    } else {
      stats.currentDayStreak = 1;
    }
    stats.bestDayStreak = Math.max(stats.bestDayStreak, stats.currentDayStreak);
    stats.lastPlayedDate = today;
  }

  // Basic counts
  stats.gamesPlayed += 1;
  stats.lifetimeScore += result.score;
  stats.bestScore = Math.max(stats.bestScore, result.score);
  stats.totalWordsFound += result.wordsFound;

  // Daily counts
  if (result.isDaily) {
    stats.dailyGamesPlayed += 1;
    if (result.won) stats.dailyGamesWon += 1;
  }

  // Per-difficulty scores, times, and completion counts
  if (result.won && result.elapsedSeconds > 0) {
    if (result.difficulty === 'easy') {
      stats.bestScoreEasy = Math.max(stats.bestScoreEasy, result.score);
      stats.fastestTimeEasy =
        stats.fastestTimeEasy === 0
          ? result.elapsedSeconds
          : Math.min(stats.fastestTimeEasy, result.elapsedSeconds);
      stats.easyCompleted += 1;
    } else if (result.difficulty === 'challenge') {
      stats.bestScoreChallenge = Math.max(stats.bestScoreChallenge, result.score);
      stats.fastestTimeChallenge =
        stats.fastestTimeChallenge === 0
          ? result.elapsedSeconds
          : Math.min(stats.fastestTimeChallenge, result.elapsedSeconds);
      stats.challengeCompleted += 1;
    } else if (result.difficulty === 'extreme') {
      stats.bestScoreExtreme = Math.max(stats.bestScoreExtreme, result.score);
      stats.fastestTimeExtreme =
        stats.fastestTimeExtreme === 0
          ? result.elapsedSeconds
          : Math.min(stats.fastestTimeExtreme, result.elapsedSeconds);
      stats.extremeCompleted += 1;
    }
  }

  // Win streak
  if (result.won) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  await saveWordSearchStats(stats);
  return stats;
}

// ============================================================================
// WORD SEARCH DAILY STATS
// ============================================================================

export interface WordSearchDailyStats {
  lastPlayedDate: string;
  lastDailyResult: 'won' | 'lost' | '';
  lastDailyScore: number;
  streak: number;
  bestStreak: number;
  dailyGamesPlayed: number;
}

const DAILY_STATS_KEY = 'wordsearch_daily_stats';

const defaultDailyStats: WordSearchDailyStats = {
  lastPlayedDate: '',
  lastDailyResult: '',
  lastDailyScore: 0,
  streak: 0,
  bestStreak: 0,
  dailyGamesPlayed: 0,
};

export async function loadWordSearchDailyStats(): Promise<WordSearchDailyStats> {
  try {
    const data = await AsyncStorage.getItem(DAILY_STATS_KEY);
    return data ? { ...defaultDailyStats, ...JSON.parse(data) } : { ...defaultDailyStats };
  } catch {
    return { ...defaultDailyStats };
  }
}

export async function saveWordSearchDailyResult(
  result: 'won' | 'lost',
  score: number = 0
): Promise<WordSearchDailyStats> {
  const stats = await loadWordSearchDailyStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (stats.lastPlayedDate === today) return stats;

  let newStreak: number;
  if (stats.lastPlayedDate === yesterday && result === 'won') {
    newStreak = stats.streak + 1;
  } else if (result === 'won') {
    newStreak = 1;
  } else {
    newStreak = 0;
  }

  const newStats: WordSearchDailyStats = {
    lastPlayedDate: today,
    lastDailyResult: result,
    lastDailyScore: score,
    streak: newStreak,
    bestStreak: Math.max(newStreak, stats.bestStreak),
    dailyGamesPlayed: stats.dailyGamesPlayed + 1,
  };

  await AsyncStorage.setItem(DAILY_STATS_KEY, JSON.stringify(newStats));
  return newStats;
}
