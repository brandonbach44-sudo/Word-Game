// src/anagrams/utils/anagramsStorage.ts
// AsyncStorage-backed persistence for Anagrams — mirrors the pattern used by
// Word Ladder (prefs, mode stats, daily lock + streak, in-progress autosave).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { TOTAL_ROUNDS } from './generator';
import type { RoundResult } from './scoring';
import { ANAGRAMS_TIER_ORDER, ANAGRAMS_TIERS, DEBUG_UNLOCK_ALL_ANAGRAMS_TILES } from './anagramsTiers';
import type { TierName } from '../../shared/tileTiers';

const STATS_KEY = 'anagrams_stats_v1';
const DAILY_LOCK_KEY = 'anagrams_daily_lock_v1';
const DAILY_PROGRESS_KEY = 'anagrams_daily_progress_v1';
const TILES_KEY = 'anagrams_tiles_v1';

// ── Stats ────────────────────────────────────────────────────────────────
export type AnagramsModeStats = {
  gamesPlayed: number;
  gamesWon: number; // all 5 rounds solved (no rounds skipped)
  currentStreak: number; // daily-only
  bestStreak: number; // daily-only
  totalScore: number;
  bestScore: number | null;
  totalTimeSeconds: number;
  fastestPerfectTimeSeconds: number | null; // fastest total time for a no-skip, no-hint run
  wordsSolved: number;
  roundsSkipped: number;
  hintsUsed: number;
  perfectRuns: number; // all 5 solved, 0 hints
};

export type AnagramsStats = {
  practice: AnagramsModeStats;
  daily: AnagramsModeStats;
  // Running count of consecutive solved words (any mode) without a skip —
  // resets to 0 the moment a round is skipped. Powers the "no skip" streak
  // achievement, which spans across runs rather than within a single one.
  globalNoSkipStreak: number;
};

function emptyModeStats(): AnagramsModeStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalScore: 0,
    bestScore: null,
    totalTimeSeconds: 0,
    fastestPerfectTimeSeconds: null,
    wordsSolved: 0,
    roundsSkipped: 0,
    hintsUsed: 0,
    perfectRuns: 0,
  };
}

export function emptyAnagramsStats(): AnagramsStats {
  return { practice: emptyModeStats(), daily: emptyModeStats(), globalNoSkipStreak: 0 };
}

export async function loadAnagramsStats(): Promise<AnagramsStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return emptyAnagramsStats();
    const parsed = JSON.parse(raw);
    return {
      practice: { ...emptyModeStats(), ...parsed.practice },
      daily: { ...emptyModeStats(), ...parsed.daily },
      globalNoSkipStreak: parsed.globalNoSkipStreak ?? 0,
    };
  } catch (e) {
    console.warn('loadAnagramsStats error', e);
    return emptyAnagramsStats();
  }
}

export async function saveAnagramsStats(stats: AnagramsStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('saveAnagramsStats error', e);
  }
}

// ── Daily lock (one attempt per calendar day) ───────────────────────────
export type DailyLockState = {
  dateISO: string; // YYYY-MM-DD
  won: boolean; // all 5 rounds solved (no skips) — drives streak continuation
  words: string[]; // the 5 target words, for the result/review screen
  roundResults: RoundResult[];
  totalScore: number;
  perfectBonusApplied: boolean;
  timeSeconds: number;
};

export async function loadDailyLock(): Promise<DailyLockState | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_LOCK_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('loadDailyLock error', e);
    return null;
  }
}

export async function saveDailyLock(lock: DailyLockState): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_LOCK_KEY, JSON.stringify(lock));
  } catch (e) {
    console.warn('saveDailyLock error', e);
  }
}

// ── Daily in-progress autosave (resume after closing the app) ──────────
export type DailyProgressState = {
  dateISO: string;
  roundIndex: number;
  roundResults: RoundResult[]; // completed rounds so far
  guessSlots: string[]; // current in-progress round's filled slots
  hintsUsedThisRound: number;
  elapsedSecondsThisRound: number;
};

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDateString(): string {
  return toLocalDateString(new Date());
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export async function loadDailyProgress(): Promise<DailyProgressState | null> {
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

export async function saveDailyProgress(progress: DailyProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('saveDailyProgress error', e);
  }
}

export async function clearDailyProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DAILY_PROGRESS_KEY);
  } catch (e) {
    console.warn('clearDailyProgress error', e);
  }
}

export async function hasPlayedTodayDaily(): Promise<boolean> {
  const lock = await loadDailyLock();
  return !!lock && lock.dateISO === getTodayDateString();
}

// Countdown-to-midnight hook, same UX as the other games' daily cards.
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

// ── Streak update helper ────────────────────────────────────────────────
export function computeNextStreak(
  won: boolean,
  previousLock: DailyLockState | null,
  currentStreak: number
): number {
  if (!won) return 0;
  const yesterday = getYesterdayDateString();
  const continuesStreak = previousLock?.dateISO === yesterday && previousLock.won;
  return continuesStreak ? currentStreak + 1 : 1;
}

export { TOTAL_ROUNDS };

// ── Cube/tile cosmetics (Daily-only lifetime score economy) ────────────
// Mirrors Word Builder's PlayerTiles shape (see src/wordbuilder/utils/
// storage.ts) but keyed entirely off stats.daily.totalScore rather than a
// combined-modes score — see anagramsTiers.ts for why.
export interface AnagramsTierProgress {
  scoreWithTier: number; // Daily score earned while this tier was equipped (drives V2 unlock)
  highestVariantUnlocked: number;
}

export interface AnagramsPlayerTiles {
  equippedTier: TierName;
  equippedVariant: number;
  tierProgress: Record<TierName, AnagramsTierProgress>;
}

function createDefaultAnagramsTierProgress(): Record<TierName, AnagramsTierProgress> {
  const progress = {} as Record<TierName, AnagramsTierProgress>;
  for (const tierName of ANAGRAMS_TIER_ORDER) {
    progress[tierName] = {
      scoreWithTier: 0,
      highestVariantUnlocked: tierName === 'default' || tierName === 'classic' ? 1 : 0,
    };
  }
  return progress;
}

function defaultAnagramsTiles(): AnagramsPlayerTiles {
  return {
    equippedTier: 'default',
    equippedVariant: 1,
    tierProgress: createDefaultAnagramsTierProgress(),
  };
}

export async function loadAnagramsTiles(): Promise<AnagramsPlayerTiles> {
  try {
    const raw = await AsyncStorage.getItem(TILES_KEY);
    if (!raw) return defaultAnagramsTiles();
    const parsed = JSON.parse(raw);
    return {
      equippedTier: parsed.equippedTier ?? 'default',
      equippedVariant: parsed.equippedVariant ?? 1,
      tierProgress: {
        ...createDefaultAnagramsTierProgress(),
        ...parsed.tierProgress,
      },
    };
  } catch (e) {
    console.warn('loadAnagramsTiles error', e);
    return defaultAnagramsTiles();
  }
}

export async function saveAnagramsTiles(tiles: AnagramsPlayerTiles): Promise<void> {
  try {
    await AsyncStorage.setItem(TILES_KEY, JSON.stringify(tiles));
  } catch (e) {
    console.warn('saveAnagramsTiles error', e);
  }
}

/** Whether a tier's V1 skin is unlocked, given the player's Daily lifetime score. */
export function isAnagramsTierUnlocked(tierName: TierName, dailyLifetimeScore: number): boolean {
  if (DEBUG_UNLOCK_ALL_ANAGRAMS_TILES) return true;
  if (tierName === 'default' || tierName === 'classic') return true;
  const tier = ANAGRAMS_TIERS[tierName];
  if (!tier) return false;
  return dailyLifetimeScore >= tier.baseThreshold;
}

/** Equips a tier/variant if it's actually unlocked. Returns false (no-op) otherwise. */
export async function equipAnagramsTile(
  tier: TierName,
  variant: number,
  dailyLifetimeScore: number
): Promise<boolean> {
  if (!isAnagramsTierUnlocked(tier, dailyLifetimeScore)) return false;
  const tiles = await loadAnagramsTiles();

  if (!DEBUG_UNLOCK_ALL_ANAGRAMS_TILES && tier !== 'default' && tier !== 'classic') {
    const progress = tiles.tierProgress[tier];
    if (!progress || variant > Math.max(progress.highestVariantUnlocked, 1)) return false;
  }

  tiles.equippedTier = tier;
  tiles.equippedVariant = variant;
  await saveAnagramsTiles(tiles);
  return true;
}

/**
 * Call after a completed Daily Anagrams run — adds the run's score toward
 * the currently-equipped tier's V2 (glow) unlock, since V2 is specifically
 * "earn X more score while wearing this skin," not just lifetime total.
 */
export async function addDailyScoreToEquippedTier(score: number): Promise<void> {
  const tiles = await loadAnagramsTiles();
  const tier = tiles.equippedTier;
  if (tier === 'default' || tier === 'classic') return;

  const tierConfig = ANAGRAMS_TIERS[tier];
  if (!tierConfig) return;

  const progress = tiles.tierProgress[tier] ?? { scoreWithTier: 0, highestVariantUnlocked: 0 };
  progress.scoreWithTier += score;
  if (progress.highestVariantUnlocked < 2 && progress.scoreWithTier >= tierConfig.v2ScoreThreshold) {
    progress.highestVariantUnlocked = 2;
  }
  tiles.tierProgress[tier] = progress;
  await saveAnagramsTiles(tiles);
}
