// src/shared/ritualStore.ts
//
// Persistence for the cross-game ritual: the storage key, the state shape, and
// the read/write pair. Nothing else.
//
// ── Why this is separate from dailyRitual.ts ────────────────────────────────
// dailyRitual.ts imports dailyReminders.ts (for ALL_GAME_IDS and the per-game
// completion map). So the moment dailyReminders wanted to READ the Fury Streak
// -- to write a reminder that says something useful -- the two files would have
// imported each other. Metro tolerates some cycles and then fails in ways that
// look like unrelated undefined-at-runtime bugs, which is not a thing to build
// on top of.
//
// The alternative was reading the ritual key straight out of AsyncStorage from
// dailyReminders, which would have duplicated the key string and the state
// shape -- the same two-sources-of-truth pattern that produced the Word Grid
// daily bug and the duplicated tile palette.
//
// So the leaf sits at the bottom instead: this file imports only AsyncStorage,
// and both dailyRitual and dailyReminders import it.

import AsyncStorage from '@react-native-async-storage/async-storage';

const RITUAL_KEY = 'wordfury_daily_ritual_v1';

export interface PendingSkipOffer {
  /** The single missed day a skip would cover. */
  missedDateISO: string;
  /** Streak the player keeps if they accept. */
  streakAtRisk: number;
  /**
   * bestStreak as it was BEFORE the provisional hold. While an offer is live
   * the streak is held optimistically, which can push bestStreak up to a value
   * the player hasn't actually earned yet — declining must roll it back, or
   * they'd keep a personal best for a streak they chose not to save.
   */
  bestBeforeHold: number;
}

export interface RitualState {
  /** Last local date on which at least one daily was completed. */
  lastCompletedDateISO: string;
  currentStreak: number;
  bestStreak: number;
  /** Lifetime count of days where all eight were cleared. */
  perfectDays: number;
  /** Guards the celebration so it fires once per day, not on every home focus. */
  lastPerfectDateISO: string;

  // ── Skips ──
  skipsAvailable: number;
  /** Highest streak milestone already converted into a skip. */
  lastSkipGrantStreak: number;
  /** Perfect Days already converted into skips. */
  perfectDaysGranted: number;
  /** Live offer, awaiting the player's decision. */
  pendingSkipOffer: PendingSkipOffer | null;
  /** One-time explainer guard for the first skip earned. */
  hasSeenSkipIntro: boolean;
}

export const EMPTY_RITUAL_STATE: RitualState = {
  lastCompletedDateISO: '',
  currentStreak: 0,
  bestStreak: 0,
  perfectDays: 0,
  lastPerfectDateISO: '',
  skipsAvailable: 0,
  lastSkipGrantStreak: 0,
  perfectDaysGranted: 0,
  pendingSkipOffer: null,
  hasSeenSkipIntro: false,
};

/** Local YYYY-MM-DD for the day before the given ISO date. */
export function previousISODate(iso: string): string {
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
    if (!raw) return { ...EMPTY_RITUAL_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_RITUAL_STATE };
    return { ...EMPTY_RITUAL_STATE, ...parsed };
  } catch (e) {
    console.warn('loadRitualState error', e);
    return { ...EMPTY_RITUAL_STATE };
  }
}

export async function saveRitualState(state: RitualState): Promise<void> {
  try {
    await AsyncStorage.setItem(RITUAL_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('saveRitualState error', e);
  }
}
