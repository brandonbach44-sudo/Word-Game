// src/shared/dailyReminders.ts
//
// One local (on-device, no server) evening reminder per day, at most — never
// more than that, by construction. Reads each game's own storage directly
// (never a second source of truth) to figure out which opted-in games still
// have an unplayed Daily by reminder time, and cancels/reschedules itself
// every time that could have changed: on app foreground, and right after any
// game's Daily completes.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { loadDailyChallenge } from '../wordbuilder/utils/storage';
import { loadWordleStats } from '../wordle/storage/wordleStorage';
import { loadDailyStats as loadHangmanDailyStats } from '../hangman/utils/dailyChallenge';
import { loadDailyWordGridStats } from '../wordgrid/utils/dailyChallenge';
import { loadWordSearchDailyStats } from '../wordsearch/utils/wsStorage';
import { hasPlayedTodayDaily as ladderHasPlayedToday, loadLadderStats } from '../wordladder/utils/ladderStorage';
import { loadHexHiveStats } from '../hexhive/utils/storage';
import { hasPlayedTodayDaily as anagramsHasPlayedToday, loadAnagramsStats } from '../anagrams/utils/anagramsStorage';

// Local YYYY-MM-DD — every game's own daily reset already keys off local
// midnight, so this has to match that, not UTC.
function getTodayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type GameId =
  | 'wordsmith'
  | 'furdle'
  | 'hangman'
  | 'wordgrid'
  | 'wordsearch'
  | 'wordladder'
  | 'hexhive'
  | 'anagrams';

export const GAME_LABELS: Record<GameId, string> = {
  wordsmith: 'Wordsmith',
  furdle: 'Furdle',
  hangman: 'Hangman',
  wordgrid: 'Word Grid',
  wordsearch: 'Word Search',
  wordladder: 'Word Ladder',
  hexhive: 'Hex Hive',
  anagrams: 'Anagrams',
};

export const ALL_GAME_IDS: GameId[] = Object.keys(GAME_LABELS) as GameId[];

interface GameDailyState {
  played: boolean;
  streak: number;
}

// One state-getter per game, each reading straight from that game's own
// storage module. This is the only file that needs to know all 8 shapes at
// once — every other file in the app only knows its own.
const GAME_STATE: Record<GameId, () => Promise<GameDailyState>> = {
  wordsmith: async () => {
    const daily = await loadDailyChallenge();
    return { played: daily.lastPlayedDate === getTodayISODate(), streak: daily.dailyStreak ?? 0 };
  },
  furdle: async () => {
    const stats = await loadWordleStats();
    const today = getTodayISODate();
    return {
      played: !!stats?.dailyHistory?.[today],
      streak: stats?.daily?.currentStreak ?? 0,
    };
  },
  hangman: async () => {
    const stats = await loadHangmanDailyStats();
    return { played: stats.lastPlayedDate === getTodayISODate(), streak: stats.streak ?? 0 };
  },
  wordgrid: async () => {
    const stats = await loadDailyWordGridStats();
    return { played: stats.lastPlayedDate === getTodayISODate(), streak: stats.streak ?? 0 };
  },
  wordsearch: async () => {
    const stats = await loadWordSearchDailyStats();
    return { played: stats.lastPlayedDate === getTodayISODate(), streak: stats.streak ?? 0 };
  },
  wordladder: async () => {
    const [played, stats] = await Promise.all([ladderHasPlayedToday(), loadLadderStats()]);
    return { played, streak: stats.daily?.currentStreak ?? 0 };
  },
  hexhive: async () => {
    const stats = await loadHexHiveStats();
    return { played: stats.lastPlayedDate === getTodayISODate(), streak: stats.currentStreak ?? 0 };
  },
  anagrams: async () => {
    const [played, stats] = await Promise.all([anagramsHasPlayedToday(), loadAnagramsStats()]);
    return { played, streak: stats.daily?.currentStreak ?? 0 };
  },
};

// ============================================================================
// PREFERENCES
// ============================================================================

const PREFS_KEY = 'dailyReminders_prefs_v1';

export interface ReminderPrefs {
  enabled: boolean;
  games: Record<GameId, boolean>;
}

function defaultPrefs(): ReminderPrefs {
  return {
    enabled: false,
    games: ALL_GAME_IDS.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {} as Record<GameId, boolean>),
  };
}

export async function loadReminderPrefs(): Promise<ReminderPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw);
    const fallback = defaultPrefs();
    return {
      enabled: parsed.enabled ?? fallback.enabled,
      games: { ...fallback.games, ...parsed.games },
    };
  } catch {
    return defaultPrefs();
  }
}

export async function saveReminderPrefs(prefs: ReminderPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('saveReminderPrefs error', e);
  }
}

// ============================================================================
// SOFT OPT-IN PROMPT (shown once, at the first real streak moment)
// ============================================================================

const OPT_IN_SHOWN_KEY = 'dailyReminders_optInShown_v1';
const OPT_IN_PENDING_KEY = 'dailyReminders_optInPending_v1';
const OPT_IN_STREAK_THRESHOLD = 2;

/**
 * Call this after any game's daily win, passing that game's new streak.
 * Marks a "show the soft prompt" flag the first time any game reaches a
 * 2-day streak, ever — never again after that, whether or not they accept.
 * The actual prompt is rendered from the home screen (see
 * consumeReminderOptInPending) since it can be triggered from any of the 8
 * game screens but should only ever appear once the player's back at a
 * natural, unhurried moment.
 */
export async function maybeFlagReminderOptIn(streak: number): Promise<void> {
  try {
    if (streak < OPT_IN_STREAK_THRESHOLD) return;
    const alreadyShown = await AsyncStorage.getItem(OPT_IN_SHOWN_KEY);
    if (alreadyShown) return;
    await AsyncStorage.setItem(OPT_IN_PENDING_KEY, '1');
  } catch (e) {
    console.warn('maybeFlagReminderOptIn error', e);
  }
}

/** Home screen calls this on focus. Returns true at most once, ever. */
export async function consumeReminderOptInPending(): Promise<boolean> {
  try {
    const pending = await AsyncStorage.getItem(OPT_IN_PENDING_KEY);
    if (!pending) return false;
    await AsyncStorage.removeItem(OPT_IN_PENDING_KEY);
    await AsyncStorage.setItem(OPT_IN_SHOWN_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// PERMISSION + SCHEDULING
// ============================================================================

const NOTIF_STATE_KEY = 'dailyReminders_notifState_v1';
const REMINDER_HOUR = 21; // 9:00 PM local — late enough that most people who
// intend to play today already have, early enough there's still real time
// left to act on it.

interface NotifState {
  dateISO: string;
  notificationId: string | null; // null = deliberately silent today (all done, or too late to schedule)
}

async function loadNotifState(): Promise<NotifState | null> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveNotifState(state: NotifState): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIF_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('saveNotifState error', e);
  }
}

export type ReminderPermissionResult = 'granted' | 'denied' | 'blocked';

/**
 * Shows the OS permission dialog. Only call this right after the player
 * accepts our own soft prompt (or flips the Settings toggle themselves) —
 * never cold, never on first launch.
 *
 * iOS only shows the real dialog once. After that, requestPermissionsAsync
 * resolves instantly with the previous answer and no UI at all — so a
 * player who denied it once and comes back to flip our toggle back on would
 * otherwise see nothing happen, with no explanation. 'blocked' distinguishes
 * that case (canAskAgain: false) from a fresh, in-the-moment 'denied' so the
 * caller can point them at iOS Settings instead of silently failing.
 */
export async function requestReminderPermission(): Promise<ReminderPermissionResult> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') {
      const prefs = await loadReminderPrefs();
      await saveReminderPrefs({ ...prefs, enabled: true });
      await syncDailyReminder();
      return 'granted';
    }
    if (!existing.canAskAgain) {
      return 'blocked';
    }
    const result = await Notifications.requestPermissionsAsync();
    if (result.status === 'granted') {
      const prefs = await loadReminderPrefs();
      await saveReminderPrefs({ ...prefs, enabled: true });
      await syncDailyReminder();
      return 'granted';
    }
    return result.canAskAgain === false ? 'blocked' : 'denied';
  } catch (e) {
    console.warn('requestReminderPermission error', e);
    return 'denied';
  }
}

// Mirrors the routes in app/index.tsx's GAMES array — kept here too so a
// notification tap can deep-link straight into the one game it's about,
// instead of dropping the player back at the home grid to go find it
// themselves.
const GAME_ROUTES: Record<GameId, string> = {
  wordsmith: '/wordbuilder',
  furdle: '/wordle',
  hangman: '/hangman',
  wordgrid: '/wordgrid',
  wordsearch: '/wordsearch',
  wordladder: '/wordladder',
  hexhive: '/hexhive',
  anagrams: '/anagrams',
};

function buildReminderContent(
  labels: string[],
  singleGameStreak: number
): { title: string; body: string } {
  if (labels.length === 1) {
    if (singleGameStreak >= 1) {
      return {
        title: 'Streak at risk!',
        body: `Your ${labels[0]} streak resets in a few hours — don't lose it!`,
      };
    }
    return {
      title: 'Word Fury',
      body: `Today's ${labels[0]} challenge is still waiting for you.`,
    };
  }
  return {
    title: 'Word Fury',
    body: `${labels.length} daily challenges are still open — keep your streaks alive.`,
  };
}

/**
 * Recomputes and reschedules (or cancels) today's single reminder slot.
 * Safe and cheap to call often — call it on every app foreground and right
 * after any game's daily completes, so the content shown (if it fires at
 * all) always reflects the true state at send time, not this morning's.
 */
export async function syncDailyReminder(): Promise<void> {
  try {
    const prefs = await loadReminderPrefs();
    const today = getTodayISODate();
    const existing = await loadNotifState();

    if (existing?.dateISO === today && existing.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
      } catch {}
    }

    if (!prefs.enabled) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      // Permission was revoked in iOS Settings since we last checked —
      // reflect that back into our own prefs so the Settings toggle in the
      // app doesn't lie about being on.
      await saveReminderPrefs({ ...prefs, enabled: false });
      return;
    }

    const fireDate = new Date();
    fireDate.setHours(REMINDER_HOUR, 0, 0, 0);
    if (fireDate.getTime() <= Date.now()) {
      await saveNotifState({ dateISO: today, notificationId: null });
      return;
    }

    const activeIds = ALL_GAME_IDS.filter((id) => prefs.games[id]);
    const states = await Promise.all(activeIds.map((id) => GAME_STATE[id]()));
    const unplayed = activeIds
      .map((id, i) => ({ id, ...states[i] }))
      .filter((g) => !g.played);

    if (unplayed.length === 0) {
      await saveNotifState({ dateISO: today, notificationId: null });
      return;
    }

    const labels = unplayed.map((g) => GAME_LABELS[g.id]);
    const singleStreak = unplayed.length === 1 ? unplayed[0].streak : 0;
    const { title, body } = buildReminderContent(labels, singleStreak);
    // Only deep-link when there's exactly one unplayed game to send someone
    // to — with several open, the home grid is the more honest destination.
    const data = unplayed.length === 1 ? { route: GAME_ROUTES[unplayed[0].id] } : undefined;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });

    await saveNotifState({ dateISO: today, notificationId });
  } catch (e) {
    console.warn('syncDailyReminder error', e);
  }
}

/** Settings screen calls this when the player turns reminders off entirely. */
export async function disableReminders(): Promise<void> {
  const prefs = await loadReminderPrefs();
  await saveReminderPrefs({ ...prefs, enabled: false });
  const existing = await loadNotifState();
  if (existing?.notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
    } catch {}
  }
  await saveNotifState({ dateISO: getTodayISODate(), notificationId: null });
}
