// src/wordsearch/utils/wsAchievements.ts
// Word Search achievement definitions and unlock logic

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordSearchStats } from './wsStorage';

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export type WSAchievementCategory =
  | 'completion'
  | 'difficulty'
  | 'speed'
  | 'streak'
  | 'score'
  | 'lifetime'
  | 'words'
  | 'daily'
  | 'special';

export interface WSAchievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: WSAchievementCategory;
}

export const WS_ACHIEVEMENTS: WSAchievement[] = [

  // ── COMPLETION MILESTONES ────────────────────────────────────────────────
  {
    id: 'ws_first_win',
    emoji: '🎉',
    name: 'First Find',
    description: 'Complete your first Word Search puzzle',
    category: 'completion',
  },
  {
    id: 'ws_games_10',
    emoji: '🔟',
    name: 'Getting Warmed Up',
    description: 'Play 10 Word Search puzzles',
    category: 'completion',
  },
  {
    id: 'ws_games_50',
    emoji: '🌟',
    name: 'Word Hunter',
    description: 'Play 50 Word Search puzzles',
    category: 'completion',
  },
  {
    id: 'ws_games_100',
    emoji: '💯',
    name: 'Centurion',
    description: 'Play 100 Word Search puzzles',
    category: 'completion',
  },
  {
    id: 'ws_games_250',
    emoji: '🏅',
    name: 'Dedicated Searcher',
    description: 'Play 250 Word Search puzzles',
    category: 'completion',
  },
  {
    id: 'ws_games_500',
    emoji: '⭐',
    name: 'Word Search Veteran',
    description: 'Play 500 Word Search puzzles',
    category: 'completion',
  },

  // ── DIFFICULTY BADGES ────────────────────────────────────────────────────
  {
    id: 'ws_easy_done',
    emoji: '✅',
    name: 'Easy Does It',
    description: 'Complete an Easy puzzle with all words found',
    category: 'difficulty',
  },
  {
    id: 'ws_easy_5',
    emoji: '🟢',
    name: 'Easy Street',
    description: 'Complete 5 Easy puzzles',
    category: 'difficulty',
  },
  {
    id: 'ws_challenge_done',
    emoji: '🔥',
    name: 'Challenge Accepted',
    description: 'Complete a Challenge puzzle with all words found',
    category: 'difficulty',
  },
  {
    id: 'ws_challenge_5',
    emoji: '🟡',
    name: 'Rising to It',
    description: 'Complete 5 Challenge puzzles',
    category: 'difficulty',
  },
  {
    id: 'ws_extreme_done',
    emoji: '💀',
    name: 'Extreme Explorer',
    description: 'Complete an Extreme puzzle with all words found',
    category: 'difficulty',
  },
  {
    id: 'ws_extreme_5',
    emoji: '🔴',
    name: 'Extreme Regular',
    description: 'Complete 5 Extreme puzzles',
    category: 'difficulty',
  },
  {
    id: 'ws_extreme_master',
    emoji: '👑',
    name: 'Extreme Master',
    description: 'Complete 10 Extreme puzzles',
    category: 'difficulty',
  },
  {
    id: 'ws_all_three',
    emoji: '🎖️',
    name: 'All-Rounder',
    description: 'Complete at least one puzzle on all three difficulties',
    category: 'difficulty',
  },

  // ── SPEED ACHIEVEMENTS ───────────────────────────────────────────────────
  {
    id: 'ws_speed_2min',
    emoji: '⚡',
    name: 'Quick Finder',
    description: 'Complete any puzzle in under 2 minutes',
    category: 'speed',
  },
  {
    id: 'ws_speed_1min',
    emoji: '🚀',
    name: 'Speed Seeker',
    description: 'Complete any puzzle in under 1 minute',
    category: 'speed',
  },
  {
    id: 'ws_speed_30sec',
    emoji: '🌪️',
    name: 'Lightning Eyes',
    description: 'Complete any puzzle in under 30 seconds',
    category: 'speed',
  },
  {
    id: 'ws_extreme_fast',
    emoji: '🏎️',
    name: 'Extreme Speed',
    description: 'Complete an Extreme puzzle in under 3 minutes',
    category: 'speed',
  },

  // ── WIN STREAK ───────────────────────────────────────────────────────────
  {
    id: 'ws_streak_3',
    emoji: '🔥',
    name: 'On a Roll',
    description: 'Win 3 games in a row (all words found)',
    category: 'streak',
  },
  {
    id: 'ws_streak_7',
    emoji: '🌊',
    name: 'Unstoppable',
    description: 'Win 7 games in a row',
    category: 'streak',
  },
  {
    id: 'ws_streak_10',
    emoji: '💥',
    name: 'On Fire',
    description: 'Win 10 games in a row',
    category: 'streak',
  },
  {
    id: 'ws_streak_20',
    emoji: '🧱',
    name: 'Unbreakable',
    description: 'Win 20 games in a row',
    category: 'streak',
  },
  {
    id: 'ws_streak_30',
    emoji: '🏆',
    name: 'Legendary Run',
    description: 'Win 30 games in a row',
    category: 'streak',
  },

  // ── DAILY STREAK ─────────────────────────────────────────────────────────
  {
    id: 'ws_daily_3',
    emoji: '📅',
    name: '3-Day Streak',
    description: 'Play the Daily Challenge 3 days in a row',
    category: 'daily',
  },
  {
    id: 'ws_daily_7',
    emoji: '🗓️',
    name: 'Week Warrior',
    description: 'Play the Daily Challenge 7 days in a row',
    category: 'daily',
  },
  {
    id: 'ws_daily_14',
    emoji: '📆',
    name: 'Two-Week Streak',
    description: 'Play the Daily Challenge 14 days in a row',
    category: 'daily',
  },
  {
    id: 'ws_daily_30',
    emoji: '🌙',
    name: 'Monthly Regular',
    description: 'Play the Daily Challenge 30 days in a row',
    category: 'daily',
  },
  {
    id: 'ws_daily_60',
    emoji: '🌕',
    name: 'Two Months Strong',
    description: 'Play the Daily Challenge 60 days in a row',
    category: 'daily',
  },
  {
    id: 'ws_daily_100',
    emoji: '💯',
    name: 'Daily Devotee',
    description: 'Play the Daily Challenge 100 days in a row',
    category: 'daily',
  },
  {
    id: 'ws_daily_365',
    emoji: '🎆',
    name: 'Year One',
    description: 'Play the Daily Challenge 365 days in a row',
    category: 'daily',
  },

  // ── DAILY PLAYED COUNT ───────────────────────────────────────────────────
  {
    id: 'ws_daily_plays_10',
    emoji: '🎯',
    name: 'Daily Regular',
    description: 'Complete 10 Daily Challenges',
    category: 'daily',
  },
  {
    id: 'ws_daily_plays_30',
    emoji: '🎲',
    name: 'Daily Enthusiast',
    description: 'Complete 30 Daily Challenges',
    category: 'daily',
  },
  {
    id: 'ws_daily_plays_100',
    emoji: '🏅',
    name: 'Daily Champion',
    description: 'Complete 100 Daily Challenges',
    category: 'daily',
  },
  {
    id: 'ws_daily_plays_250',
    emoji: '🏆',
    name: 'Daily Legend',
    description: 'Complete 250 Daily Challenges',
    category: 'daily',
  },

  // ── SINGLE-GAME SCORE MILESTONES ─────────────────────────────────────────
  {
    id: 'ws_score_500',
    emoji: '💎',
    name: 'High Scorer',
    description: 'Score 500 or more in a single game',
    category: 'score',
  },
  {
    id: 'ws_score_1000',
    emoji: '🏅',
    name: 'Score Legend',
    description: 'Score 1,000 or more in a single game',
    category: 'score',
  },
  {
    id: 'ws_score_1500',
    emoji: '👑',
    name: 'Score King',
    description: 'Score 1,500 or more in a single game',
    category: 'score',
  },
  {
    id: 'ws_score_2000',
    emoji: '🌟',
    name: 'Score God',
    description: 'Score 2,000 or more in a single game',
    category: 'score',
  },
  {
    id: 'ws_new_best',
    emoji: '🏆',
    name: 'Personal Best',
    description: 'Set a new all-time high score',
    category: 'score',
  },

  // ── LIFETIME SCORE ───────────────────────────────────────────────────────
  {
    id: 'ws_lifetime_1000',
    emoji: '🪙',
    name: 'Copper',
    description: 'Reach 1,000 lifetime score',
    category: 'lifetime',
  },
  {
    id: 'ws_lifetime_5000',
    emoji: '🥉',
    name: 'Bronze',
    description: 'Reach 5,000 lifetime score',
    category: 'lifetime',
  },
  {
    id: 'ws_lifetime_10000',
    emoji: '🥈',
    name: 'Silver',
    description: 'Reach 10,000 lifetime score',
    category: 'lifetime',
  },
  {
    id: 'ws_lifetime_50000',
    emoji: '🥇',
    name: 'Gold',
    description: 'Reach 50,000 lifetime score',
    category: 'lifetime',
  },
  {
    id: 'ws_lifetime_100000',
    emoji: '❤️',
    name: 'Ruby',
    description: 'Reach 100,000 lifetime score',
    category: 'lifetime',
  },
  {
    id: 'ws_lifetime_500000',
    emoji: '💎',
    name: 'Diamond',
    description: 'Reach 500,000 lifetime score',
    category: 'lifetime',
  },
  {
    id: 'ws_lifetime_1000000',
    emoji: '✨',
    name: 'Legendary',
    description: 'Reach 1,000,000 lifetime score',
    category: 'lifetime',
  },

  // ── TOTAL WORDS FOUND ────────────────────────────────────────────────────
  {
    id: 'ws_words_50',
    emoji: '🐣',
    name: 'First Steps',
    description: 'Find 50 words total across all games',
    category: 'words',
  },
  {
    id: 'ws_words_200',
    emoji: '📖',
    name: 'Reader',
    description: 'Find 200 words total across all games',
    category: 'words',
  },
  {
    id: 'ws_words_500',
    emoji: '📚',
    name: 'Bookworm',
    description: 'Find 500 words total across all games',
    category: 'words',
  },
  {
    id: 'ws_words_1000',
    emoji: '🏛️',
    name: 'Librarian',
    description: 'Find 1,000 words total across all games',
    category: 'words',
  },
  {
    id: 'ws_words_5000',
    emoji: '🌌',
    name: 'Archivist',
    description: 'Find 5,000 words total across all games',
    category: 'words',
  },

  // ── SPECIAL ─────────────────────────────────────────────────────────────
  {
    id: 'ws_perfect_game',
    emoji: '⭐',
    name: 'Flawless',
    description: 'Find every word in a puzzle without the time running out',
    category: 'special',
  },
];

// ============================================================================
// PROGRESS TRACKING (for locked achievement progress bars)
// ============================================================================

export function getWSAchievementProgress(
  id: string,
  stats: WordSearchStats,
  dailyStreak: number
): number {
  const clamp = (v: number, t: number) => Math.min(v / t, 1);
  const gp = stats.gamesPlayed;
  const ls = stats.lifetimeScore;
  const tw = stats.totalWordsFound;
  const bs = stats.bestScore;
  const cs = stats.currentStreak;
  const best = stats.bestStreak;
  const streak = Math.max(cs, best);
  const ds = Math.max(dailyStreak, 0);
  const dp = stats.dailyGamesPlayed;
  const ec = stats.easyCompleted;
  const cc = stats.challengeCompleted;
  const xc = stats.extremeCompleted;

  switch (id) {
    // Completion
    case 'ws_first_win':    return clamp(stats.gamesWon, 1);
    case 'ws_games_10':     return clamp(gp, 10);
    case 'ws_games_50':     return clamp(gp, 50);
    case 'ws_games_100':    return clamp(gp, 100);
    case 'ws_games_250':    return clamp(gp, 250);
    case 'ws_games_500':    return clamp(gp, 500);
    // Difficulty
    case 'ws_easy_done':    return clamp(ec, 1);
    case 'ws_easy_5':       return clamp(ec, 5);
    case 'ws_challenge_done': return clamp(cc, 1);
    case 'ws_challenge_5':  return clamp(cc, 5);
    case 'ws_extreme_done': return clamp(xc, 1);
    case 'ws_extreme_5':    return clamp(xc, 5);
    case 'ws_extreme_master': return clamp(xc, 10);
    case 'ws_all_three':    return clamp(Math.min(ec > 0 ? 1 : 0, cc > 0 ? 1 : 0, xc > 0 ? 1 : 0), 1);
    // Speed — binary, no bar
    // Win streak
    case 'ws_streak_3':     return clamp(streak, 3);
    case 'ws_streak_7':     return clamp(streak, 7);
    case 'ws_streak_10':    return clamp(streak, 10);
    case 'ws_streak_20':    return clamp(streak, 20);
    case 'ws_streak_30':    return clamp(streak, 30);
    // Daily streak
    case 'ws_daily_3':      return clamp(ds, 3);
    case 'ws_daily_7':      return clamp(ds, 7);
    case 'ws_daily_14':     return clamp(ds, 14);
    case 'ws_daily_30':     return clamp(ds, 30);
    case 'ws_daily_60':     return clamp(ds, 60);
    case 'ws_daily_100':    return clamp(ds, 100);
    case 'ws_daily_365':    return clamp(ds, 365);
    // Daily played
    case 'ws_daily_plays_10':  return clamp(dp, 10);
    case 'ws_daily_plays_30':  return clamp(dp, 30);
    case 'ws_daily_plays_100': return clamp(dp, 100);
    case 'ws_daily_plays_250': return clamp(dp, 250);
    // Score
    case 'ws_score_500':    return clamp(bs, 500);
    case 'ws_score_1000':   return clamp(bs, 1000);
    case 'ws_score_1500':   return clamp(bs, 1500);
    case 'ws_score_2000':   return clamp(bs, 2000);
    // Lifetime score
    case 'ws_lifetime_1000':    return clamp(ls, 1000);
    case 'ws_lifetime_5000':    return clamp(ls, 5000);
    case 'ws_lifetime_10000':   return clamp(ls, 10000);
    case 'ws_lifetime_50000':   return clamp(ls, 50000);
    case 'ws_lifetime_100000':  return clamp(ls, 100000);
    case 'ws_lifetime_500000':  return clamp(ls, 500000);
    case 'ws_lifetime_1000000': return clamp(ls, 1000000);
    // Words found
    case 'ws_words_50':     return clamp(tw, 50);
    case 'ws_words_200':    return clamp(tw, 200);
    case 'ws_words_500':    return clamp(tw, 500);
    case 'ws_words_1000':   return clamp(tw, 1000);
    case 'ws_words_5000':   return clamp(tw, 5000);
    default: return 0;
  }
}

// ============================================================================
// UNLOCK LOGIC
// ============================================================================

const ACHIEVEMENTS_KEY = 'wordsearch_achievements';

export interface UnlockedWSAchievement {
  id: string;
  unlockedAt: string;
}

export async function loadUnlockedWSAchievements(): Promise<UnlockedWSAchievement[]> {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function unlockWSAchievement(
  id: string,
  unlocked: UnlockedWSAchievement[]
): Promise<{ newly: boolean; list: UnlockedWSAchievement[] }> {
  if (unlocked.some(a => a.id === id)) {
    return { newly: false, list: unlocked };
  }
  const newList = [...unlocked, { id, unlockedAt: new Date().toISOString() }];
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newList));
  return { newly: true, list: newList };
}

export interface CheckAchievementsInput {
  stats: WordSearchStats;             // stats AFTER this game
  prevBestScore: number;              // best score BEFORE this game (to detect personal best)
  currentGameScore: number;
  currentGameSeconds: number;
  currentGameDifficulty: string;
  currentGameWon: boolean;
  dailyStreak: number;
}

/** Returns newly unlocked achievements after a game. Saves them to storage. */
export async function checkWordSearchAchievements(
  input: CheckAchievementsInput
): Promise<WSAchievement[]> {
  const {
    stats,
    prevBestScore,
    currentGameScore,
    currentGameSeconds,
    currentGameDifficulty,
    currentGameWon,
    dailyStreak,
  } = input;

  let unlocked = await loadUnlockedWSAchievements();
  const newlyUnlocked: WSAchievement[] = [];

  const tryUnlock = async (id: string) => {
    const result = await unlockWSAchievement(id, unlocked);
    unlocked = result.list;
    if (result.newly) {
      const def = WS_ACHIEVEMENTS.find(a => a.id === id);
      if (def) newlyUnlocked.push(def);
    }
  };

  // ── Completion milestones ─────────────────────────────────────────────
  if (stats.gamesWon >= 1)   await tryUnlock('ws_first_win');
  if (stats.gamesPlayed >= 10)  await tryUnlock('ws_games_10');
  if (stats.gamesPlayed >= 50)  await tryUnlock('ws_games_50');
  if (stats.gamesPlayed >= 100) await tryUnlock('ws_games_100');
  if (stats.gamesPlayed >= 250) await tryUnlock('ws_games_250');
  if (stats.gamesPlayed >= 500) await tryUnlock('ws_games_500');

  // ── Difficulty badges ─────────────────────────────────────────────────
  if (stats.easyCompleted >= 1)  await tryUnlock('ws_easy_done');
  if (stats.easyCompleted >= 5)  await tryUnlock('ws_easy_5');
  if (stats.challengeCompleted >= 1) await tryUnlock('ws_challenge_done');
  if (stats.challengeCompleted >= 5) await tryUnlock('ws_challenge_5');
  if (stats.extremeCompleted >= 1)   await tryUnlock('ws_extreme_done');
  if (stats.extremeCompleted >= 5)   await tryUnlock('ws_extreme_5');
  if (stats.extremeCompleted >= 10)  await tryUnlock('ws_extreme_master');
  if (stats.easyCompleted >= 1 && stats.challengeCompleted >= 1 && stats.extremeCompleted >= 1) {
    await tryUnlock('ws_all_three');
  }

  // ── Speed (only on full win) ──────────────────────────────────────────
  if (currentGameWon && currentGameSeconds > 0) {
    if (currentGameSeconds < 120) await tryUnlock('ws_speed_2min');
    if (currentGameSeconds < 60)  await tryUnlock('ws_speed_1min');
    if (currentGameSeconds < 30)  await tryUnlock('ws_speed_30sec');
    if (currentGameDifficulty === 'extreme' && currentGameSeconds < 180) {
      await tryUnlock('ws_extreme_fast');
    }
  }

  // ── Win streak ────────────────────────────────────────────────────────
  const streak = Math.max(stats.currentStreak, stats.bestStreak);
  if (streak >= 3)  await tryUnlock('ws_streak_3');
  if (streak >= 7)  await tryUnlock('ws_streak_7');
  if (streak >= 10) await tryUnlock('ws_streak_10');
  if (streak >= 20) await tryUnlock('ws_streak_20');
  if (streak >= 30) await tryUnlock('ws_streak_30');

  // ── Daily streak ──────────────────────────────────────────────────────
  if (dailyStreak >= 3)   await tryUnlock('ws_daily_3');
  if (dailyStreak >= 7)   await tryUnlock('ws_daily_7');
  if (dailyStreak >= 14)  await tryUnlock('ws_daily_14');
  if (dailyStreak >= 30)  await tryUnlock('ws_daily_30');
  if (dailyStreak >= 60)  await tryUnlock('ws_daily_60');
  if (dailyStreak >= 100) await tryUnlock('ws_daily_100');
  if (dailyStreak >= 365) await tryUnlock('ws_daily_365');

  // ── Daily played count ────────────────────────────────────────────────
  if (stats.dailyGamesPlayed >= 10)  await tryUnlock('ws_daily_plays_10');
  if (stats.dailyGamesPlayed >= 30)  await tryUnlock('ws_daily_plays_30');
  if (stats.dailyGamesPlayed >= 100) await tryUnlock('ws_daily_plays_100');
  if (stats.dailyGamesPlayed >= 250) await tryUnlock('ws_daily_plays_250');

  // ── Single-game score ─────────────────────────────────────────────────
  if (currentGameScore >= 500)  await tryUnlock('ws_score_500');
  if (currentGameScore >= 1000) await tryUnlock('ws_score_1000');
  if (currentGameScore >= 1500) await tryUnlock('ws_score_1500');
  if (currentGameScore >= 2000) await tryUnlock('ws_score_2000');

  // Personal best (score improved and it's not the very first game)
  if (
    currentGameWon &&
    currentGameScore > prevBestScore &&
    stats.gamesPlayed > 1
  ) {
    await tryUnlock('ws_new_best');
  }

  // ── Lifetime score ────────────────────────────────────────────────────
  if (stats.lifetimeScore >= 1000)    await tryUnlock('ws_lifetime_1000');
  if (stats.lifetimeScore >= 5000)    await tryUnlock('ws_lifetime_5000');
  if (stats.lifetimeScore >= 10000)   await tryUnlock('ws_lifetime_10000');
  if (stats.lifetimeScore >= 50000)   await tryUnlock('ws_lifetime_50000');
  if (stats.lifetimeScore >= 100000)  await tryUnlock('ws_lifetime_100000');
  if (stats.lifetimeScore >= 500000)  await tryUnlock('ws_lifetime_500000');
  if (stats.lifetimeScore >= 1000000) await tryUnlock('ws_lifetime_1000000');

  // ── Total words found ─────────────────────────────────────────────────
  if (stats.totalWordsFound >= 50)   await tryUnlock('ws_words_50');
  if (stats.totalWordsFound >= 200)  await tryUnlock('ws_words_200');
  if (stats.totalWordsFound >= 500)  await tryUnlock('ws_words_500');
  if (stats.totalWordsFound >= 1000) await tryUnlock('ws_words_1000');
  if (stats.totalWordsFound >= 5000) await tryUnlock('ws_words_5000');

  // ── Special ──────────────────────────────────────────────────────────
  if (currentGameWon) await tryUnlock('ws_perfect_game');

  return newlyUnlocked;
}

// Get all unlocked achievements with full details
export async function getUnlockedWSAchievements(): Promise<(WSAchievement & { unlockedAt: string })[]> {
  const unlocked = await loadUnlockedWSAchievements();
  return unlocked
    .map(u => {
      const def = WS_ACHIEVEMENTS.find(a => a.id === u.id);
      if (!def) return null;
      return { ...def, unlockedAt: u.unlockedAt };
    })
    .filter((a): a is WSAchievement & { unlockedAt: string } => a !== null)
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
}
