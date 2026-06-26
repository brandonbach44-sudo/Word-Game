// src/wordgrid/utils/dailyChallenge.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { generateGrid } from './gridGenerator';

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function dateToSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────

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

// ─── Seeded Daily Grid ────────────────────────────────────────────────────────

// Simple LCG seeded random — deterministic for same date
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Generates the same 4×4 grid for everyone on a given date by temporarily
 * replacing Math.random with a deterministic seeded version.
 */
export function generateDailyGrid(date: Date = new Date()): string[][] {
  const seed = dateToSeed(date);
  const rng = seededRandom(seed);
  const orig = Math.random;
  Math.random = rng;
  try {
    return generateGrid(4);
  } finally {
    Math.random = orig;
  }
}

// ─── Stats Interface & Storage ────────────────────────────────────────────────

export interface DailyWordGridStats {
  lastPlayedDate: string;
  lastScore: number;
  lastWordsCount: number;
  streak: number;
  bestStreak: number;
  gamesPlayed: number;
  totalDailyScore: number;
  bestDailyScore: number;
}

const STORAGE_KEY = 'wordgrid_daily_challenge_stats';

const defaultStats: DailyWordGridStats = {
  lastPlayedDate: '',
  lastScore: 0,
  lastWordsCount: 0,
  streak: 0,
  bestStreak: 0,
  gamesPlayed: 0,
  totalDailyScore: 0,
  bestDailyScore: 0,
};

export async function loadDailyWordGridStats(): Promise<DailyWordGridStats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? { ...defaultStats, ...JSON.parse(data) } : { ...defaultStats };
  } catch {
    return { ...defaultStats };
  }
}

export async function saveDailyWordGridResult(
  score: number,
  wordsCount: number,
): Promise<DailyWordGridStats> {
  const stats = await loadDailyWordGridStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Already played today — don't overwrite
  if (stats.lastPlayedDate === today) return stats;

  const playedYesterday = stats.lastPlayedDate === yesterday;
  const streak = playedYesterday ? stats.streak + 1 : 1;
  const bestStreak = Math.max(streak, stats.bestStreak);

  const newStats: DailyWordGridStats = {
    lastPlayedDate: today,
    lastScore: score,
    lastWordsCount: wordsCount,
    streak,
    bestStreak,
    gamesPlayed: stats.gamesPlayed + 1,
    totalDailyScore: stats.totalDailyScore + score,
    bestDailyScore: Math.max(stats.bestDailyScore, score),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  return newStats;
}

// ─── Share Emoji Blocks ───────────────────────────────────────────────────────

/**
 * 5 blocks representing score tiers:
 *  ⬜ < 50  🟨 50-99  🟧 100-149  🟩 150-199  🟦 200+
 * Filled left-to-right: e.g. score=130 → 🟩🟩🟩⬜⬜
 */
export function buildScoreBlocks(score: number): string {
  const thresholds = [50, 100, 150, 200, 250];
  return thresholds
    .map(t => (score >= t ? '🟩' : '⬜'))
    .join('');
}
