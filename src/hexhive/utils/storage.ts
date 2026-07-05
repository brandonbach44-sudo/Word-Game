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
const DAILY_HISTORY_KEY = 'hexhive_daily_history_v1';

// ── Stats ────────────────────────────────────────────────────────────────
export type HexHiveStats = {
  // Daily
  daysPlayed: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD, '' if never played
  dailyWordsFound: number;
  dailyPangramsFound: number;
  bestDailyScore: number;
  bestDailyRankIndex: number;
  bestDailyWordCount: number; // most words found in a single daily puzzle
  fullClears: number; // number of daily puzzles fully solved (every word found)
  currentFullClearStreak: number; // consecutive days ending in a full clear
  bestFullClearStreak: number;
  lastFullClearDate: string; // YYYY-MM-DD, '' if never

  // Quick Play
  practicePuzzlesPlayed: number;
  practiceWordsFound: number;
  practicePangramsFound: number;
  practiceBestScore: number;
  practiceBestWordCount: number; // most words found in a single Quick Play round

  // Lifetime (combined daily + practice)
  totalWordsFound: number;
  totalPangramsFound: number;
  longestWordFound: string;
};

function emptyStats(): HexHiveStats {
  return {
    daysPlayed: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDate: '',
    dailyWordsFound: 0,
    dailyPangramsFound: 0,
    bestDailyScore: 0,
    bestDailyRankIndex: 0,
    bestDailyWordCount: 0,
    fullClears: 0,
    currentFullClearStreak: 0,
    bestFullClearStreak: 0,
    lastFullClearDate: '',

    practicePuzzlesPlayed: 0,
    practiceWordsFound: 0,
    practicePangramsFound: 0,
    practiceBestScore: 0,
    practiceBestWordCount: 0,

    totalWordsFound: 0,
    totalPangramsFound: 0,
    longestWordFound: '',
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

/**
 * Call the moment a daily puzzle first becomes fully cleared. Tracks a
 * separate "full clear streak" (consecutive days ending in every word
 * found) alongside the regular play streak, since fully clearing a puzzle
 * is a much higher bar than just playing.
 */
export function bumpFullClearStreakForToday(stats: HexHiveStats): HexHiveStats {
  const today = getTodayDateString();
  if (stats.lastFullClearDate === today) return stats;

  const yesterday = getYesterdayDateString();
  const continuesStreak = stats.lastFullClearDate === yesterday;
  const currentFullClearStreak = continuesStreak ? stats.currentFullClearStreak + 1 : 1;

  return {
    ...stats,
    currentFullClearStreak,
    bestFullClearStreak: Math.max(stats.bestFullClearStreak, currentFullClearStreak),
    lastFullClearDate: today,
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

// ── Daily history (one entry per calendar day ever played, kept forever) ──
// Powers the Stats calendar so a player can look back and see exactly what
// they scored on any past day, not just their all-time best.
export type DailyHistoryEntry = {
  dateISO: string;
  score: number;
  maxScore: number;
  wordsFound: number;
  totalWords: number;
  rankIndex: number;
  rankName: string;
  fullyCleared: boolean;
};

export type DailyHistory = Record<string, DailyHistoryEntry>; // keyed by dateISO

export async function loadDailyHistory(): Promise<DailyHistory> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.warn('loadDailyHistory error', e);
    return {};
  }
}

/** Upserts today's entry with the latest cumulative values — safe to call after every word found. */
export async function saveDailyHistoryEntry(entry: DailyHistoryEntry): Promise<DailyHistory> {
  try {
    const history = await loadDailyHistory();
    const updated: DailyHistory = { ...history, [entry.dateISO]: entry };
    await AsyncStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('saveDailyHistoryEntry error', e);
    return {};
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
