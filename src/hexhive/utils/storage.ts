// src/hexhive/utils/storage.ts
// AsyncStorage-backed persistence for Hex Hive — mirrors the pattern used by
// Word Ladder / Word Grid (stats, daily progress, streak).
//
// Hex Hive has no win/lose state — the daily puzzle just accumulates found
// words for as long as the player wants to keep going. "Playing" a day is
// defined as finding at least one word, which is when the streak updates.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { getTodayDateString, getYesterdayDateString } from './generator';

const STATS_KEY = 'hexhive_stats_v1';
const DAILY_PROGRESS_KEY = 'hexhive_daily_progress_v1';
const PREFS_KEY = 'hexhive_prefs_v1';

// ── Stats ────────────────────────────────────────────────────────────────
export type HexHiveStats = {
  daysPlayed: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD, '' if never played
  totalWordsFound: number;
  totalPangramsFound: number;
  bestDailyScore: number;
  bestDailyRankIndex: number;
  fullClears: number; // number of daily puzzles fully solved (every word found)
  longestWordFound: string;
  practicePuzzlesPlayed: number;
  practiceBestScore: number;
};

function emptyStats(): HexHiveStats {
  return {
    daysPlayed: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDate: '',
    totalWordsFound: 0,
    totalPangramsFound: 0,
    bestDailyScore: 0,
    bestDailyRankIndex: 0,
    fullClears: 0,
    longestWordFound: '',
    practicePuzzlesPlayed: 0,
    practiceBestScore: 0,
  };
}

export async function loadHexHiveStats(): Promise<HexHiveStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return emptyStats();
    return { ...emptyStats(), ...JSON.parse(raw) };
  } catch (e) {
    console.warn('loadHexHiveStats error', e);
    return emptyStats();
  }
}

export async function saveHexHiveStats(stats: HexHiveStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('saveHexHiveStats error', e);
  }
}

/** Call once per day, the first time a word is found in the daily puzzle. */
export function bumpStreakForToday(stats: HexHiveStats): HexHiveStats {
  const today = getTodayDateString();
  if (stats.lastPlayedDate === today) return stats;

  const yesterday = getYesterdayDateString();
  const continuesStreak = stats.lastPlayedDate === yesterday;
  const currentStreak = continuesStreak ? stats.currentStreak + 1 : 1;

  return {
    ...stats,
    daysPlayed: stats.daysPlayed + 1,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    lastPlayedDate: today,
  };
}

// ── Daily progress (autosave, survives app restarts) ────────────────────
export type DailyProgress = {
  dateISO: string;
  foundWords: string[];
};

export async function loadDailyProgress(): Promise<DailyProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.dateISO !== getTodayDateString()) return null;
    return parsed;
  } catch (e) {
    console.warn('loadDailyProgress error', e);
    return null;
  }
}

export async function saveDailyProgress(progress: DailyProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('saveDailyProgress error', e);
  }
}

// ── Prefs ────────────────────────────────────────────────────────────────
export type HexHivePrefs = {
  lastMode: 'daily' | 'practice';
};

const DEFAULT_PREFS: HexHivePrefs = { lastMode: 'daily' };

export async function loadHexHivePrefs(): Promise<HexHivePrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveHexHivePrefs(prefs: HexHivePrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('saveHexHivePrefs error', e);
  }
}

// ── Countdown-to-midnight hook, same UX as the other games' daily cards ──
export function useCountdownToMidnight(): string {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
}
