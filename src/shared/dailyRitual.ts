// src/shared/dailyRitual.ts
//
// The cross-game daily layer that sits above all eight games, plus the Streak
// Skip insurance that protects it.
//
// ── The streak design in one paragraph ──────────────────────────────────────
// Two tiers. The Fury Streak needs only ONE daily completed, which makes it a
// floor that survives real life — a streak that breaks easily stops being a
// reason to come back and becomes a reason to quit. A Perfect Day is all eight,
// and is never required for anything. The floor protects the habit; the ceiling
// is what walks a Word Ladder devotee into Hex Hive for the first time.
//
// ── The skip design in one paragraph ────────────────────────────────────────
// A skip covers a missed DAY, not a game: players experience absence as "I
// missed yesterday", not as eight separate losses. A skip is never spent
// automatically and never without being offered — a missed day isn't actually
// resolved at midnight, it's resolved when the player next opens the app, so
// the choice can be made retroactively when they can see what's at stake. It
// only applies to a day with ZERO dailies completed, so it can never revive a
// game streak the player broke by choice.
//
// ── Source of truth ─────────────────────────────────────────────────────────
// Per-game "played today" is ALWAYS derived from each game's own storage via
// loadDailyCompletionMap() in dailyReminders.ts. It is never copied in here.

import {
  ALL_GAME_IDS,
  getTodayISODate,
  loadDailyCompletionMap,
  type GameId,
} from './dailyReminders';
import {
  loadRitualState,
  previousISODate,
  saveRitualState,
  type PendingSkipOffer,
  type RitualState,
} from './ritualStore';

export const TOTAL_DAILY_GAMES = ALL_GAME_IDS.length; // 8

// ── Skip economy ────────────────────────────────────────────────────────────
// Everyone reaches the cap eventually, so the CAP is what balances the feature.
// The earn rates control something more useful: how fast a player gets their
// FIRST protection — day 14 playing casually, ~day 5 clearing all eight a few
// times a week, ~day 3 sweeping daily. Playing broadly doesn't earn more skips,
// it earns them sooner, which is the right incentive for an eight-game app.
export const SKIP_CAP = 2;
const SKIP_STREAK_INTERVAL = 14; // +1 skip per 14 consecutive days
const SKIP_PERFECT_INTERVAL = 3; // +1 skip per 3 Perfect Days
/**
 * Below this, a broken streak just restarts and no skip is touched. Asking
 * someone to spend a saved resource to rescue a 2-day streak is noise, and the
 * answer is almost always no.
 */
const SKIP_OFFER_MIN_STREAK = 5;

// Re-exported so existing callers keep one import for the ritual.
export type { PendingSkipOffer, RitualState };
export { loadRitualState };

/** Grants any skips owed by the streak and Perfect Day milestones. */
function grantSkips(state: RitualState): { state: RitualState; granted: number } {
  let granted = 0;
  const next = { ...state };

  // Consistency path: every 14 consecutive days.
  const streakMilestone =
    Math.floor(next.currentStreak / SKIP_STREAK_INTERVAL) * SKIP_STREAK_INTERVAL;
  if (streakMilestone > next.lastSkipGrantStreak && streakMilestone > 0) {
    granted += 1;
    next.lastSkipGrantStreak = streakMilestone;
  }

  // Breadth path: every 3 Perfect Days.
  const perfectEligible =
    Math.floor(next.perfectDays / SKIP_PERFECT_INTERVAL) * SKIP_PERFECT_INTERVAL;
  if (perfectEligible > next.perfectDaysGranted) {
    granted += (perfectEligible - next.perfectDaysGranted) / SKIP_PERFECT_INTERVAL;
    next.perfectDaysGranted = perfectEligible;
  }

  if (granted > 0) {
    next.skipsAvailable = Math.min(SKIP_CAP, next.skipsAvailable + granted);
  }
  return { state: next, granted };
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

  // ── Skips ──
  skipsAvailable: number;
  /** True on the first read after the player's very first skip is banked. */
  shouldShowSkipIntro: boolean;
  /** Live offer to rescue a missed day, or null. */
  pendingSkipOffer: PendingSkipOffer | null;
  /**
   * The streak is alive but nothing has been played today — the home screen
   * uses this for a quiet "play one daily to keep your streak" nudge.
   */
  streakAtRiskToday: boolean;
}

/**
 * Recompute the ritual from live game state, advance the streak, grant skips,
 * and raise a skip offer when a missed day is repairable.
 *
 * Safe to call on every home-screen focus: it only writes when something
 * actually changed.
 */
export async function refreshDailyRitual(): Promise<DailyRitualSummary> {
  const today = getTodayISODate();
  const yesterday = previousISODate(today);
  const [map, stored] = await Promise.all([loadDailyCompletionMap(), loadRitualState()]);

  const completion = Object.fromEntries(
    ALL_GAME_IDS.map((id) => [id, map[id]?.played ?? false])
  ) as Record<GameId, boolean>;

  const completedCount = ALL_GAME_IDS.reduce((n, id) => n + (completion[id] ? 1 : 0), 0);
  const isPerfectDay = completedCount === TOTAL_DAILY_GAMES;

  let next: RitualState = { ...stored };
  let dirty = false;
  let shouldShowSkipIntro = false;

  // ── Streak advance ────────────────────────────────────────────────────────
  // Fires on the first completion of a new local day.
  if (completedCount > 0 && stored.lastCompletedDateISO !== today) {
    const continued = stored.lastCompletedDateISO === yesterday;

    if (continued) {
      next.currentStreak = stored.currentStreak + 1;
    } else {
      // Is this a repairable one-day gap? The player's last completion must be
      // exactly two days ago (so precisely one day was missed), the streak must
      // be worth saving, and a skip must be banked. If so, HOLD the streak and
      // offer the choice — it's only really broken once they decline.
      const missedDay = yesterday;
      const repairable =
        stored.lastCompletedDateISO === previousISODate(yesterday) &&
        stored.currentStreak >= SKIP_OFFER_MIN_STREAK &&
        stored.skipsAvailable > 0;

      if (repairable) {
        next.currentStreak = stored.currentStreak + 1;
        next.pendingSkipOffer = {
          missedDateISO: missedDay,
          streakAtRisk: next.currentStreak,
          bestBeforeHold: stored.bestStreak,
        };
      } else {
        next.currentStreak = 1;
      }
    }

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

  // ── Skip grants ───────────────────────────────────────────────────────────
  if (dirty) {
    const before = next.skipsAvailable;
    const result = grantSkips(next);
    next = result.state;
    if (next.skipsAvailable > before) {
      dirty = true;
      if (!next.hasSeenSkipIntro) {
        shouldShowSkipIntro = true;
        next.hasSeenSkipIntro = true;
      }
    }
  }

  if (dirty) await saveRitualState(next);

  // ── Display streak ────────────────────────────────────────────────────────
  const last = next.lastCompletedDateISO;
  const stillAlive = last === today || last === yesterday;
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
    skipsAvailable: next.skipsAvailable,
    shouldShowSkipIntro,
    pendingSkipOffer: next.pendingSkipOffer,
    streakAtRiskToday: streak > 0 && completedCount === 0,
  };
}

/**
 * Player accepted the offer: spend the skip and keep the streak that
 * refreshDailyRitual already provisionally held.
 */
export async function acceptSkipOffer(): Promise<RitualState> {
  const state = await loadRitualState();
  if (!state.pendingSkipOffer) return state;
  const next: RitualState = {
    ...state,
    skipsAvailable: Math.max(0, state.skipsAvailable - 1),
    pendingSkipOffer: null,
  };
  await saveRitualState(next);
  return next;
}

/**
 * Player declined: perform the reset that was held back, and clear the offer so
 * it never asks again for this gap.
 */
export async function declineSkipOffer(): Promise<RitualState> {
  const state = await loadRitualState();
  if (!state.pendingSkipOffer) return state;
  const next: RitualState = {
    ...state,
    // They played today, so the new run starts at 1.
    currentStreak: 1,
    // Roll back the optimistic bestStreak — this run was never actually earned.
    bestStreak: state.pendingSkipOffer.bestBeforeHold,
    pendingSkipOffer: null,
  };
  await saveRitualState(next);
  return next;
}

/**
 * Read-only snapshot for surfaces that DISPLAY the ritual without advancing it.
 *
 * refreshDailyRitual() is deliberately not safe to call from a second screen:
 * it writes, and it hands out one-shot flags (shouldCelebratePerfectDay,
 * shouldShowSkipIntro) that are cleared by being read. A history screen calling
 * it would silently swallow the home screen's Perfect Day celebration. So this
 * exists instead: no writes, no flags, and the same "is the run still alive"
 * rule as the summary so the two can never disagree about the streak.
 */
export async function loadRitualDisplay(): Promise<{
  streak: number;
  bestStreak: number;
  perfectDays: number;
  skipsAvailable: number;
}> {
  const state = await loadRitualState();
  const today = getTodayISODate();
  const yesterday = previousISODate(today);
  const last = state.lastCompletedDateISO;
  const stillAlive = last === today || last === yesterday;
  return {
    streak: stillAlive ? state.currentStreak : 0,
    bestStreak: state.bestStreak,
    perfectDays: state.perfectDays,
    skipsAvailable: state.skipsAvailable,
  };
}
