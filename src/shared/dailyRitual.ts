// src/shared/dailyRitual.ts
//
// The cross-game daily layer that sits above all eight games.
//
// ── The design in one paragraph ──────────────────────────────────────────────
// Two tiers. The Fury Streak needs only ONE daily completed, which makes it a
// floor that survives real life — a streak that breaks easily stops being a
// reason to come back and becomes a reason to quit. A Perfect Day is all eight,
// and is never required for anything. The floor protects the habit; the ceiling
// is what walks a Word Ladder devotee into Hex Hive for the first time.
//
// ── Source of truth ─────────────────────────────────────────────────────────
// Per-game "played today" is ALWAYS derived from each game's own storage via
// loadDailyCompletionMap() in dailyReminders.ts. It is never copied in here.
// Two stores holding the same fact is how streak bugs get written, and every
// one of them is visible to the player. The only thing persisted below is the
// cross-game counters, which cannot be derived from anything else.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ALL_GAME_IDS,
  getTodayISODate,
  loadDailyCompletionMap,
  type GameId,
} from './dailyReminders';

const RITUAL_KEY = 'wordfury_daily_ritual_v1';

export const TOTAL_DAILY_GAMES = ALL_GAME_IDS.length; // 8

export interface RitualState {
  /** Last local date on which at least one daily was completed. */
  lastCompletedDateISO: string;
  currentStreak: number;
  bestStreak: number;
  /** Lifetime count of days where all eight were cleared. */
  perfectDays: number;
  /** Guards the celebration so it fires once per day, not on every home focus. */
  lastPerfectDateISO: string;
}

const EMPTY: RitualState = {
  lastCompletedDateISO: '',
  currentStreak: 0,
  bestStreak: 0,
  perfectDays: 0,
  lastPerfectDateISO: '',
};

/** Local YYYY-MM-DD for the day before the given ISO date. */
function previousISODate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export async function loadRitualState(): Promise<RitualState> {
  try {
    const raw = await AsyncStorage.getItem(RITUAL_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY };
    return { ...EMPTY, ...parsed };
  } catch (e) {
    console.warn('loadRitualState error', e);
    return { ...EMPTY };
  }
}

async function saveRitualState(state: RitualState): Promise<void> {
  try {
    await AsyncStorage.setItem(RITUAL_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('saveRitualState error', e);
  }
}

/**
 * What the home screen renders.
 */
export interface DailyRitualSummary {
  /** Per-game completion for today, derived from each game's own storage. */
  completion: Record<GameId, boolean>;
  completedCount: number;
  totalCount: number;
  /** All eight cleared today. */
  isPerfectDay: boolean;
  /**
   * Streak to DISPLAY. Zero when the run is already broken (last completion
   * was neither today nor yesterday) so we never show a stale number that is
   * about to disappear.
   */
  streak: number;
  bestStreak: number;
  perfectDays: number;
  /**
   * True only on the first read of a newly completed Perfect Day, so the
   * celebration fires once. Reading this marks it as shown.
   */
  shouldCelebratePerfectDay: boolean;
}

/**
 * Recompute the ritual from live game state and advance the streak if needed.
 *
 * Safe to call on every home-screen focus: it only writes when something
 * actually changed (a new day's first completion, a new Perfect Day, or the
 * celebration being consumed).
 */
export async function refreshDailyRitual(): Promise<DailyRitualSummary> {
  const today = getTodayISODate();
  const [map, stored] = await Promise.all([loadDailyCompletionMap(), loadRitualState()]);

  const completion = Object.fromEntries(
    ALL_GAME_IDS.map((id) => [id, map[id]?.played ?? false])
  ) as Record<GameId, boolean>;

  const completedCount = ALL_GAME_IDS.reduce(
    (n, id) => n + (completion[id] ? 1 : 0),
    0
  );
  const isPerfectDay = completedCount === TOTAL_DAILY_GAMES;

  let next: RitualState = { ...stored };
  let dirty = false;

  // ── Streak advance ────────────────────────────────────────────────────────
  // Fires on the first completion of a new local day. Yesterday → +1,
  // anything older (or nothing) → restart at 1.
  if (completedCount > 0 && stored.lastCompletedDateISO !== today) {
    const continued = stored.lastCompletedDateISO === previousISODate(today);
    next.currentStreak = continued ? stored.currentStreak + 1 : 1;
    next.bestStreak = Math.max(stored.bestStreak, next.currentStreak);
    next.lastCompletedDateISO = today;
    dirty = true;
  }

  // ── Perfect Day ───────────────────────────────────────────────────────────
  let shouldCelebratePerfectDay = false;
  if (isPerfectDay && next.lastPerfectDateISO !== today) {
    next.perfectDays = next.perfectDays + 1;
    next.lastPerfectDateISO = today;
    shouldCelebratePerfectDay = true;
    dirty = true;
  }

  if (dirty) await saveRitualState(next);

  // ── Display streak ────────────────────────────────────────────────────────
  // Honest display: if the last completion is neither today nor yesterday the
  // run is already over, so show 0 rather than a number about to vanish.
  const last = next.lastCompletedDateISO;
  const stillAlive = last === today || last === previousISODate(today);
  const streak = stillAlive ? next.currentStreak : 0;

  return {
    completion,
    completedCount,
    totalCount: TOTAL_DAILY_GAMES,
    isPerfectDay,
    streak,
    bestStreak: next.bestStreak,
    perfectDays: next.perfectDays,
    shouldCelebratePerfectDay,
  };
}
