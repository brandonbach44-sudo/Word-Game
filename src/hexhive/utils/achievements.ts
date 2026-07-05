// src/hexhive/utils/achievements.ts
// Hex Hive achievement definitions + unlock logic.
// Shape matches src/wordladder/utils/ladderAchievements.ts so the shared
// AchievementPopup component can render these directly.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HexHiveStats } from './storage';

const ACHIEVEMENTS_KEY = 'hexhive_achievements_v1';

export type HexHiveAchievementCategory = 'milestone' | 'volume' | 'streak' | 'skill' | 'daily';

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  requirement: number;
  category: HexHiveAchievementCategory;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export const HEXHIVE_ACHIEVEMENTS: Achievement[] = [
  // ── Milestone ───────────────────────────────────────────────────────
  { id: 'hh_first_word', emoji: '✏️', name: 'First Word', description: 'Find your first word in Hex Hive', requirement: 1, category: 'milestone' },
  { id: 'hh_first_pangram', emoji: '⭐', name: 'First Pangram', description: 'Find a word using all 7 letters', requirement: 1, category: 'milestone' },
  { id: 'hh_first_full_clear', emoji: '🏆', name: 'Full Clear', description: 'Find every word in a daily puzzle', requirement: 1, category: 'milestone' },

  // ── Volume ──────────────────────────────────────────────────────────
  { id: 'hh_words_50', emoji: '📝', name: 'Wordsmith', description: 'Find 50 total words', requirement: 50, category: 'volume' },
  { id: 'hh_words_250', emoji: '📚', name: 'Lexicon', description: 'Find 250 total words', requirement: 250, category: 'volume' },
  { id: 'hh_words_1000', emoji: '🗂️', name: 'Encyclopedic', description: 'Find 1,000 total words', requirement: 1000, category: 'volume' },
  { id: 'hh_pangrams_10', emoji: '🌟', name: 'Pangram Hunter', description: 'Find 10 total pangrams', requirement: 10, category: 'volume' },
  { id: 'hh_pangrams_25', emoji: '✨', name: 'Pangram Master', description: 'Find 25 total pangrams', requirement: 25, category: 'volume' },

  // ── Skill ───────────────────────────────────────────────────────────
  { id: 'hh_reach_amazing', emoji: '🎯', name: 'Amazing', description: 'Reach Amazing rank in a daily puzzle', requirement: 1, category: 'skill' },
  { id: 'hh_reach_genius', emoji: '🧠', name: 'Genius', description: 'Reach Genius rank in a daily puzzle', requirement: 1, category: 'skill' },
  { id: 'hh_reach_master', emoji: '👑', name: 'Master', description: 'Reach Master rank in a daily puzzle', requirement: 1, category: 'skill' },
  { id: 'hh_long_word_9', emoji: '📏', name: 'Long Haul', description: 'Find a word with 9 or more letters', requirement: 9, category: 'skill' },

  // ── Streak ──────────────────────────────────────────────────────────
  { id: 'hh_streak_3', emoji: '🔥', name: 'On a Roll', description: 'Reach a 3-day streak', requirement: 3, category: 'streak' },
  { id: 'hh_streak_7', emoji: '🔥', name: 'Week Streak', description: 'Reach a 7-day streak', requirement: 7, category: 'streak' },
  { id: 'hh_streak_30', emoji: '🏅', name: 'Monthly Regular', description: 'Reach a 30-day streak', requirement: 30, category: 'streak' },

  // ── Daily ───────────────────────────────────────────────────────────
  { id: 'hh_days_10', emoji: '📅', name: 'Regular Player', description: 'Play 10 daily puzzles', requirement: 10, category: 'daily' },
  { id: 'hh_days_50', emoji: '🗓️', name: 'Dedicated', description: 'Play 50 daily puzzles', requirement: 50, category: 'daily' },
];

async function loadUnlockedIds(): Promise<UnlockedAchievement[]> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.unlocked) ? parsed.unlocked : [];
  } catch {
    return [];
  }
}

async function saveUnlockedIds(unlocked: UnlockedAchievement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify({ unlocked }));
  } catch (e) {
    console.warn('saveUnlockedIds error', e);
  }
}

export async function getUnlockedAchievements(): Promise<(Achievement & { unlockedAt: string })[]> {
  const unlocked = await loadUnlockedIds();
  return unlocked
    .map((u) => {
      const def = HEXHIVE_ACHIEVEMENTS.find((a) => a.id === u.id);
      return def ? { ...def, unlockedAt: u.unlockedAt } : null;
    })
    .filter((a): a is Achievement & { unlockedAt: string } => a !== null);
}

async function unlock(id: string, existing: UnlockedAchievement[]): Promise<Achievement | null> {
  if (existing.some((u) => u.id === id)) return null;
  const def = HEXHIVE_ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return null;
  existing.push({ id, unlockedAt: new Date().toISOString() });
  return def;
}

export interface WordFoundEvent {
  word: string;
  isPangram: boolean;
}

/**
 * Checks a just-found word plus the just-updated stats snapshot against
 * every achievement, unlocking any newly-earned ones. Returns the list of
 * achievements unlocked by this call (for popup display).
 */
export async function checkWordAchievements(
  event: WordFoundEvent,
  stats: HexHiveStats
): Promise<Achievement[]> {
  const existing = await loadUnlockedIds();
  const newlyUnlocked: Achievement[] = [];

  const tryUnlock = async (id: string) => {
    const a = await unlock(id, existing);
    if (a) newlyUnlocked.push(a);
  };

  if (stats.totalWordsFound >= 1) await tryUnlock('hh_first_word');
  if (stats.totalWordsFound >= 50) await tryUnlock('hh_words_50');
  if (stats.totalWordsFound >= 250) await tryUnlock('hh_words_250');
  if (stats.totalWordsFound >= 1000) await tryUnlock('hh_words_1000');

  if (event.isPangram) {
    if (stats.totalPangramsFound >= 1) await tryUnlock('hh_first_pangram');
    if (stats.totalPangramsFound >= 10) await tryUnlock('hh_pangrams_10');
    if (stats.totalPangramsFound >= 25) await tryUnlock('hh_pangrams_25');
  }

  if (event.word.length >= 9) await tryUnlock('hh_long_word_9');

  if (newlyUnlocked.length > 0) {
    await saveUnlockedIds(existing);
  }
  return newlyUnlocked;
}

/** Checks rank-, streak-, and daily-count-based achievements. */
export async function checkProgressAchievements(
  stats: HexHiveStats,
  rankIndex: number,
  rankName: string,
  fullyCleared: boolean
): Promise<Achievement[]> {
  const existing = await loadUnlockedIds();
  const newlyUnlocked: Achievement[] = [];

  const tryUnlock = async (id: string) => {
    const a = await unlock(id, existing);
    if (a) newlyUnlocked.push(a);
  };

  if (rankName === 'Amazing' || rankIndex >= 7) await tryUnlock('hh_reach_amazing');
  if (rankName === 'Genius' || rankIndex >= 8) await tryUnlock('hh_reach_genius');
  if (rankName === 'Master' || rankIndex >= 9) await tryUnlock('hh_reach_master');
  if (fullyCleared) await tryUnlock('hh_first_full_clear');

  if (stats.currentStreak >= 3) await tryUnlock('hh_streak_3');
  if (stats.currentStreak >= 7) await tryUnlock('hh_streak_7');
  if (stats.currentStreak >= 30) await tryUnlock('hh_streak_30');

  if (stats.daysPlayed >= 10) await tryUnlock('hh_days_10');
  if (stats.daysPlayed >= 50) await tryUnlock('hh_days_50');

  if (newlyUnlocked.length > 0) {
    await saveUnlockedIds(existing);
  }
  return newlyUnlocked;
}
