// src/wordladder/utils/ladderAchievements.ts
// Word Ladder achievement definitions + unlock logic.
// Shape matches src/wordbuilder/utils/achievements.ts so the shared
// AchievementPopup component can render these directly.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LadderStats } from './ladderStorage';

const ACHIEVEMENTS_KEY = 'wordladder_achievements_v1';

export type LadderAchievementCategory =
  | 'completion'
  | 'difficulty'
  | 'speed'
  | 'streak'
  | 'skill'
  | 'daily';

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  requirement: number;
  category: LadderAchievementCategory;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export const LADDER_ACHIEVEMENTS: Achievement[] = [
  // ── Completion ──────────────────────────────────────────────────────
  { id: 'll_first_win', emoji: '🪜', name: 'First Rung', description: 'Complete your first Word Ladder', requirement: 1, category: 'completion' },
  { id: 'll_games_10', emoji: '🔟', name: 'Climbing', description: 'Complete 10 Word Ladders', requirement: 10, category: 'completion' },
  { id: 'll_games_50', emoji: '🌟', name: 'Ladder Regular', description: 'Complete 50 Word Ladders', requirement: 50, category: 'completion' },
  { id: 'll_games_100', emoji: '💯', name: 'Centurion', description: 'Complete 100 Word Ladders', requirement: 100, category: 'completion' },

  // ── Difficulty ──────────────────────────────────────────────────────
  { id: 'll_easy_win', emoji: '🟢', name: 'Easy Rung', description: 'Win an Easy ladder', requirement: 1, category: 'difficulty' },
  { id: 'll_medium_win', emoji: '🟡', name: 'Medium Rung', description: 'Win a Medium ladder', requirement: 1, category: 'difficulty' },
  { id: 'll_hard_win', emoji: '🔴', name: 'Hard Rung', description: 'Win a Hard ladder', requirement: 1, category: 'difficulty' },
  { id: 'll_hard_10', emoji: '🧗', name: 'Summit Seeker', description: 'Win 10 Hard ladders', requirement: 10, category: 'difficulty' },

  // ── Skill ───────────────────────────────────────────────────────────
  { id: 'll_perfect_1', emoji: '🎯', name: 'Right on Par', description: 'Solve a ladder in exactly par steps', requirement: 1, category: 'skill' },
  { id: 'll_perfect_10', emoji: '🏹', name: 'Precision Climber', description: 'Solve 10 ladders in exactly par steps', requirement: 10, category: 'skill' },
  { id: 'll_no_hint_10', emoji: '🧠', name: 'Self-Made', description: 'Win 10 ladders without using a hint', requirement: 10, category: 'skill' },

  // ── Speed ───────────────────────────────────────────────────────────
  { id: 'll_speedy_60', emoji: '⚡', name: 'Quick Climb', description: 'Solve a ladder in under 60 seconds', requirement: 60, category: 'speed' },
  { id: 'll_speedy_30', emoji: '🚀', name: 'Lightning Ladder', description: 'Solve a ladder in under 30 seconds', requirement: 30, category: 'speed' },

  // ── Streak (daily) ──────────────────────────────────────────────────
  { id: 'll_streak_3', emoji: '🔥', name: 'On a Roll', description: 'Reach a 3-day Daily Ladder streak', requirement: 3, category: 'streak' },
  { id: 'll_streak_7', emoji: '🔥', name: 'Week Streak', description: 'Reach a 7-day Daily Ladder streak', requirement: 7, category: 'streak' },
  { id: 'll_streak_30', emoji: '🏆', name: 'Monthly Climber', description: 'Reach a 30-day Daily Ladder streak', requirement: 30, category: 'streak' },

  // ── Daily ───────────────────────────────────────────────────────────
  { id: 'll_daily_10', emoji: '📅', name: 'Daily Devotee', description: 'Complete 10 Daily Ladders', requirement: 10, category: 'daily' },
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
      const def = LADDER_ACHIEVEMENTS.find((a) => a.id === u.id);
      return def ? { ...def, unlockedAt: u.unlockedAt } : null;
    })
    .filter((a): a is Achievement & { unlockedAt: string } => a !== null);
}

async function unlock(id: string, existing: UnlockedAchievement[]): Promise<Achievement | null> {
  if (existing.some((u) => u.id === id)) return null;
  const def = LADDER_ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return null;
  existing.push({ id, unlockedAt: new Date().toISOString() });
  return def;
}

export interface LadderGameResult {
  mode: 'practice' | 'daily';
  difficulty: 'easy' | 'medium' | 'hard';
  won: boolean;
  steps: number;
  par: number;
  timeSeconds: number;
  hintsUsed: number;
}

/**
 * Checks a single completed game + the just-updated stats snapshot against
 * every achievement, unlocking any newly-earned ones. Returns the list of
 * achievements unlocked by this call (for popup display).
 */
export async function checkLadderAchievements(
  result: LadderGameResult,
  stats: LadderStats
): Promise<Achievement[]> {
  const existing = await loadUnlockedIds();
  const newlyUnlocked: Achievement[] = [];
  const modeStats = result.mode === 'daily' ? stats.daily : stats.practice;
  const combinedWins = stats.practice.gamesWon + stats.daily.gamesWon;

  const tryUnlock = async (id: string) => {
    const a = await unlock(id, existing);
    if (a) newlyUnlocked.push(a);
  };

  if (result.won) {
    if (combinedWins >= 1) await tryUnlock('ll_first_win');
    if (combinedWins >= 10) await tryUnlock('ll_games_10');
    if (combinedWins >= 50) await tryUnlock('ll_games_50');
    if (combinedWins >= 100) await tryUnlock('ll_games_100');

    if (result.difficulty === 'easy') await tryUnlock('ll_easy_win');
    if (result.difficulty === 'medium') await tryUnlock('ll_medium_win');
    if (result.difficulty === 'hard') {
      await tryUnlock('ll_hard_win');
      if (modeStats.hardWins + stats.practice.hardWins + stats.daily.hardWins >= 10) {
        await tryUnlock('ll_hard_10');
      }
    }

    if (result.steps === result.par) {
      await tryUnlock('ll_perfect_1');
      if (stats.practice.perfectSolves + stats.daily.perfectSolves >= 10) {
        await tryUnlock('ll_perfect_10');
      }
    }

    if (stats.practice.hintFreeWins + stats.daily.hintFreeWins >= 10) {
      await tryUnlock('ll_no_hint_10');
    }

    if (result.timeSeconds < 60) await tryUnlock('ll_speedy_60');
    if (result.timeSeconds < 30) await tryUnlock('ll_speedy_30');

    if (result.mode === 'daily') {
      if (stats.daily.currentStreak >= 3) await tryUnlock('ll_streak_3');
      if (stats.daily.currentStreak >= 7) await tryUnlock('ll_streak_7');
      if (stats.daily.currentStreak >= 30) await tryUnlock('ll_streak_30');
      if (stats.daily.gamesWon >= 10) await tryUnlock('ll_daily_10');
    }
  }

  if (newlyUnlocked.length > 0) {
    await saveUnlockedIds(existing);
  }
  return newlyUnlocked;
}
