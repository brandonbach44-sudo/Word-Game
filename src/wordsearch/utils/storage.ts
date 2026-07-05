// src/utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// ============================================================================
// SECTION 1: DATE UTILITIES
// ============================================================================

// Convert date to numeric seed (same for everyone on same day)
export function dateToSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
  // Example: December 23, 2025 → 20251223
}

// Local-timezone "YYYY-MM-DD" — not UTC, so the daily reset lines up with
// the player's actual midnight rather than Greenwich's.
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Get today's date as string "YYYY-MM-DD"
export function getTodayDateString(): string {
  return toLocalDateString(new Date());
}

// Get yesterday's date as string "YYYY-MM-DD"
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

// Format date for display: "Monday, December 23"
export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// SECTION 2: COUNTDOWN HOOK
// ============================================================================

// Hook that returns countdown to midnight: "5h 23m 14s"
export function useCountdownToMidnight(): string {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(now.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

// ============================================================================
// SECTION 3: DAILY CHALLENGE STATS
// ============================================================================

export interface DailyChallengeStats {
  lastPlayedDate: string;        // "YYYY-MM-DD"
  lastDailyResult: 'won' | 'lost' | '';
  lastDailyScore: number;        // For games with scores
  streak: number;                // Current daily streak
  bestStreak: number;            // Best daily streak ever
  dailyGamesPlayed: number;      // Total daily games played
}

// NOTE: Override this key per game, e.g. 'wordsearch_daily_stats'
const DAILY_STATS_KEY = 'game_daily_stats';

const defaultDailyStats: DailyChallengeStats = {
  lastPlayedDate: '',
  lastDailyResult: '',
  lastDailyScore: 0,
  streak: 0,
  bestStreak: 0,
  dailyGamesPlayed: 0,
};

export async function loadDailyStats(): Promise<DailyChallengeStats> {
  try {
    const data = await AsyncStorage.getItem(DAILY_STATS_KEY);
    return data ? { ...defaultDailyStats, ...JSON.parse(data) } : { ...defaultDailyStats };
  } catch {
    return { ...defaultDailyStats };
  }
}

export async function saveDailyStats(stats: DailyChallengeStats): Promise<void> {
  await AsyncStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats));
}

export async function saveDailyResult(
  result: 'won' | 'lost',
  score: number = 0
): Promise<DailyChallengeStats> {
  const stats = await loadDailyStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Already played today - don't update
  if (stats.lastPlayedDate === today) {
    return stats;
  }

  // Calculate streak
  let newStreak: number;
  if (stats.lastPlayedDate === yesterday && result === 'won') {
    // Played yesterday and won today - continue streak
    newStreak = stats.streak + 1;
  } else if (result === 'won') {
    // Didn't play yesterday but won today - start new streak
    newStreak = 1;
  } else {
    // Lost - reset streak
    newStreak = 0;
  }

  const newStats: DailyChallengeStats = {
    lastPlayedDate: today,
    lastDailyResult: result,
    lastDailyScore: score,
    streak: newStreak,
    bestStreak: Math.max(newStreak, stats.bestStreak),
    dailyGamesPlayed: stats.dailyGamesPlayed + 1,
  };

  await saveDailyStats(newStats);
  return newStats;
}

export async function hasPlayedTodayDaily(): Promise<boolean> {
  const stats = await loadDailyStats();
  return stats.lastPlayedDate === getTodayDateString();
}

// ============================================================================
// SECTION 4: SEEDED RANDOM (For Daily Challenges)
// ============================================================================

// Deterministic random number generator
// Same seed = same sequence of random numbers
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Get daily content using seeded random
export function getDailyContent<T>(items: T[], date: Date = new Date()): T {
  const seed = dateToSeed(date);
  const index = seed % items.length;
  return items[index];
}

// Example: Get daily puzzle with multiple random choices
export function generateDailyPuzzle<T>(
  items: T[],
  count: number,
  date: Date = new Date()
): T[] {
  const seed = dateToSeed(date);
  const random = seededRandom(seed);

  const shuffled = [...items].sort(() => random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================================================================
// SECTION 5: GAME STATS STORAGE PATTERN
// ============================================================================

export interface GameStats {
  // Basic stats
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;

  // Scores
  totalScore: number;
  bestScore: number;
  averageScore: number;

  // Streaks
  currentStreak: number;
  bestStreak: number;

  // Day streaks
  lastPlayedDate: string;
  currentDayStreak: number;
  bestDayStreak: number;

  // Add game-specific stats as needed...
}

// NOTE: Override this key per game, e.g. 'wordsearch_stats'
const STATS_KEY = 'game_stats';

const defaultStats: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  totalScore: 0,
  bestScore: 0,
  averageScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: '',
  currentDayStreak: 0,
  bestDayStreak: 0,
};

export async function loadGameStats(): Promise<GameStats> {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    return data ? { ...defaultStats, ...JSON.parse(data) } : { ...defaultStats };
  } catch {
    return { ...defaultStats };
  }
}

export async function saveGameStats(stats: GameStats): Promise<void> {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export async function updateStatsAfterGame(
  won: boolean,
  score: number
): Promise<GameStats> {
  const stats = await loadGameStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Update day streak
  if (stats.lastPlayedDate !== today) {
    if (stats.lastPlayedDate === yesterday) {
      stats.currentDayStreak += 1;
    } else if (stats.lastPlayedDate === '') {
      stats.currentDayStreak = 1;
    } else {
      stats.currentDayStreak = 1; // Reset if missed a day
    }
    stats.bestDayStreak = Math.max(stats.bestDayStreak, stats.currentDayStreak);
    stats.lastPlayedDate = today;
  }

  // Update basic stats
  stats.gamesPlayed += 1;
  stats.totalScore += score;
  stats.averageScore = Math.round(stats.totalScore / stats.gamesPlayed);

  if (won) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    stats.bestScore = Math.max(stats.bestScore, score);
  } else {
    stats.gamesLost += 1;
    stats.currentStreak = 0;
  }

  await saveGameStats(stats);
  return stats;
}

// ============================================================================
// SECTION 6: ACHIEVEMENTS PATTERN
// ============================================================================

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO date string
}

// NOTE: Override this key per game, e.g. 'wordsearch_achievements'
const ACHIEVEMENTS_KEY = 'game_achievements';

export async function loadUnlockedAchievements(): Promise<UnlockedAchievement[]> {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function unlockAchievement(id: string): Promise<boolean> {
  const unlocked = await loadUnlockedAchievements();

  // Already unlocked
  if (unlocked.some(a => a.id === id)) {
    return false;
  }

  // Unlock new achievement
  unlocked.push({
    id,
    unlockedAt: new Date().toISOString(),
  });

  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  return true;
}

// Example: Check achievements after game
export async function checkAchievements(
  stats: GameStats,
  allAchievements: Achievement[]
): Promise<Achievement[]> {
  const newlyUnlocked: Achievement[] = [];

  // Example checks - customize per game
  if (stats.gamesWon >= 1) {
    const success = await unlockAchievement('first_win');
    if (success) {
      const achievement = allAchievements.find(a => a.id === 'first_win');
      if (achievement) newlyUnlocked.push(achievement);
    }
  }

  if (stats.gamesPlayed >= 10) {
    const success = await unlockAchievement('ten_games');
    if (success) {
      const achievement = allAchievements.find(a => a.id === 'ten_games');
      if (achievement) newlyUnlocked.push(achievement);
    }
  }

  if (stats.bestStreak >= 5) {
    const success = await unlockAchievement('five_streak');
    if (success) {
      const achievement = allAchievements.find(a => a.id === 'five_streak');
      if (achievement) newlyUnlocked.push(achievement);
    }
  }

  // Add more checks...

  return newlyUnlocked;
}

// ============================================================================
// SECTION 7: HELPER FUNCTIONS
// ============================================================================

// Calculate win rate percentage
export function getWinRate(stats: GameStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}

// Format large numbers: 1234567 → "1,234,567"
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Format time in seconds to "1:23" or "0:05"
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
