import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Convert date to numeric seed for deterministic word selection
export function dateToSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

// Select daily word index (same for everyone that day)
export function getDailyWordIndex(wordList: any[], date: Date = new Date()): number {
  const seed = dateToSeed(date);
  return seed % wordList.length;
}

// Today's date: "YYYY-MM-DD", in the device's local timezone — not UTC, so
// the daily reset lines up with the player's actual midnight.
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function getTodayDateString(): string {
  return toLocalDateString(new Date());
}
// Yesterday's date: "YYYY-MM-DD"
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}
// Display date (e.g. "Tuesday, December 17")
export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}

// Countdown to next midnight
export function useCountdownToMidnight(): string {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const next = new Date(now);
      next.setDate(now.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

// Streak/stat logic
export interface DailyChallengeStats {
  lastPlayedDate: string;
  lastDailyResult: 'won' | 'lost' | '';
  lastDailyWord: string;
  lastIncorrectCount: number;
  streak: number;
  bestStreak: number;
  gamesPlayed: number;
  dailyWins: number;
}

const STORAGE_KEY = 'hangman_daily_challenge_stats';
const defaultStats: DailyChallengeStats = {
  lastPlayedDate: '',
  lastDailyResult: '',
  lastDailyWord: '',
  lastIncorrectCount: 0,
  streak: 0,
  bestStreak: 0,
  gamesPlayed: 0,
  dailyWins: 0,
};

export async function loadDailyStats(): Promise<DailyChallengeStats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? { ...defaultStats, ...JSON.parse(data) } : { ...defaultStats };
  } catch {
    return { ...defaultStats };
  }
}
export async function saveDailyStats(s: DailyChallengeStats) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
export async function saveDailyResult(result: 'won' | 'lost', word: string, incorrectCount: number = 0) {
  const stats = await loadDailyStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  if (stats.lastPlayedDate === today) return stats;

  let streak = (stats.lastPlayedDate === yesterday && stats.lastDailyResult !== '') ? (result === 'won' ? stats.streak + 1 : 0) : (result === 'won' ? 1 : 0);
  let bestStreak = Math.max(streak, stats.bestStreak);

  const newStats: DailyChallengeStats = {
    lastPlayedDate: today,
    lastDailyResult: result,
    lastDailyWord: word,
    lastIncorrectCount: incorrectCount,
    streak,
    bestStreak,
    gamesPlayed: stats.gamesPlayed + 1,
    dailyWins: (stats.dailyWins || 0) + (result === 'won' ? 1 : 0),
  };
  await saveDailyStats(newStats);
  return newStats;
}

export async function hasPlayedTodayDaily(): Promise<boolean> {
  const stats = await loadDailyStats();
  return stats.lastPlayedDate === getTodayDateString();
}

// ── Daily in-progress autosave (resume after closing the app mid-game) ──
// Lets a Daily attempt survive the app being backgrounded, force-quit, or
// swiped away mid-game — reopening the same day resumes the exact guessed
// letters instead of losing progress or a free redo.

const PROGRESS_KEY = 'hangman_daily_progress';

export interface HangmanDailyProgress {
  dateISO: string; // YYYY-MM-DD — progress from a different day is stale/ignored
  word: string;
  category: string;
  guessedLetters: string[];
  incorrectGuesses: string[];
  correctGuesses: string[];
}

export async function loadDailyProgress(): Promise<HangmanDailyProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.dateISO !== getTodayDateString()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveDailyProgress(progress: HangmanDailyProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('saveDailyProgress error', e);
  }
}

export async function clearDailyProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
  } catch (e) {
    console.warn('clearDailyProgress error', e);
  }
}
