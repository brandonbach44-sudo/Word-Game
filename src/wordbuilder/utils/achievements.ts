import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = 'wordbuilder_achievements';

// Achievement definition
export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  requirement: number;
  category: AchievementCategory;
}

export type AchievementCategory = 
  | 'score_milestone'
  | 'daily_streak'
  | 'word_length'
  | 'words_found'
  | 'games_played'
  | 'lifetime_score'
  | 'words_per_game'
  | 'daily_specific'
  | 'special';

// Player's unlocked achievements
export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO date string
}

export interface AchievementsData {
  unlocked: UnlockedAchievement[];
}

// ==================== ALL ACHIEVEMENTS ====================

export const ACHIEVEMENTS: Achievement[] = [
  // Score Milestones (Single Game)
  { id: 'score_2000', emoji: '💯', name: 'Century Club', description: 'Score 2,000+ in one game', requirement: 2000, category: 'score_milestone' },
  { id: 'score_4000', emoji: '🌟', name: 'Rising Star', description: 'Score 4,000+ in one game', requirement: 4000, category: 'score_milestone' },
  { id: 'score_6000', emoji: '👑', name: 'Word King', description: 'Score 6,000+ in one game', requirement: 6000, category: 'score_milestone' },
  { id: 'score_10000', emoji: '💎', name: 'Diamond Mind', description: 'Score 10,000+ in one game', requirement: 10000, category: 'score_milestone' },
  { id: 'score_15000', emoji: '🏆', name: 'Legendary', description: 'Score 15,000+ in one game', requirement: 15000, category: 'score_milestone' },
  { id: 'score_20000', emoji: '🦄', name: 'Mythical', description: 'Score 20,000+ in one game', requirement: 20000, category: 'score_milestone' },

  // Daily Streak
  { id: 'streak_1', emoji: '🌅', name: 'First Light', description: 'Complete your first daily', requirement: 1, category: 'daily_streak' },
  { id: 'streak_2', emoji: '🔄', name: 'Double Down', description: 'Reach a 2-day daily streak', requirement: 2, category: 'daily_streak' },
  { id: 'streak_5', emoji: '🌱', name: 'Seedling', description: 'Reach a 5-day daily streak', requirement: 5, category: 'daily_streak' },
  { id: 'streak_10', emoji: '🔥', name: 'Warming Up', description: 'Reach a 10-day daily streak', requirement: 10, category: 'daily_streak' },
  { id: 'streak_15', emoji: '⚡', name: 'Electrified', description: 'Reach a 15-day daily streak', requirement: 15, category: 'daily_streak' },
  { id: 'streak_20', emoji: '🌊', name: 'Tidal Wave', description: 'Reach a 20-day daily streak', requirement: 20, category: 'daily_streak' },
  { id: 'streak_30', emoji: '📅', name: 'Monthly Master', description: 'Reach a 30-day daily streak', requirement: 30, category: 'daily_streak' },
  { id: 'streak_40', emoji: '🏃', name: 'Marathon Runner', description: 'Reach a 40-day daily streak', requirement: 40, category: 'daily_streak' },
  { id: 'streak_50', emoji: '🌋', name: 'Eruption', description: 'Reach a 50-day daily streak', requirement: 50, category: 'daily_streak' },
  { id: 'streak_75', emoji: '⚔️', name: 'Word Warrior', description: 'Reach a 75-day daily streak', requirement: 75, category: 'daily_streak' },
  { id: 'streak_100', emoji: '💯', name: 'Centurion', description: 'Reach a 100-day daily streak', requirement: 100, category: 'daily_streak' },
  { id: 'streak_125', emoji: '🛡️', name: 'Steadfast', description: 'Reach a 125-day daily streak', requirement: 125, category: 'daily_streak' },
  { id: 'streak_150', emoji: '🐉', name: "Dragon's Breath", description: 'Reach a 150-day daily streak', requirement: 150, category: 'daily_streak' },
  { id: 'streak_175', emoji: '🌠', name: 'Shooting Star', description: 'Reach a 175-day daily streak', requirement: 175, category: 'daily_streak' },
  { id: 'streak_200', emoji: '👑', name: 'Word Royalty', description: 'Reach a 200-day daily streak', requirement: 200, category: 'daily_streak' },
  { id: 'streak_250', emoji: '🏛️', name: 'Monumental', description: 'Reach a 250-day daily streak', requirement: 250, category: 'daily_streak' },
  { id: 'streak_300', emoji: '🌍', name: 'World Class', description: 'Reach a 300-day daily streak', requirement: 300, category: 'daily_streak' },
  { id: 'streak_365', emoji: '🎆', name: 'Year One', description: 'Reach a 365-day daily streak', requirement: 365, category: 'daily_streak' },
  { id: 'streak_500', emoji: '🔱', name: 'Poseidon', description: 'Reach a 500-day daily streak', requirement: 500, category: 'daily_streak' },
  { id: 'streak_730', emoji: '🌌', name: 'Eternal', description: 'Reach a 730-day daily streak', requirement: 730, category: 'daily_streak' },

  // Word Length
  { id: 'word_5', emoji: '📝', name: 'Wordsmith', description: 'Find a 5-letter word', requirement: 5, category: 'word_length' },
  { id: 'word_6', emoji: '📚', name: 'Bookworm', description: 'Find a 6-letter word', requirement: 6, category: 'word_length' },
  { id: 'word_7', emoji: '🎓', name: 'Scholar', description: 'Find a 7-letter word', requirement: 7, category: 'word_length' },
  { id: 'word_8', emoji: '🧠', name: 'Genius', description: 'Find an 8-letter word', requirement: 8, category: 'word_length' },

  // Words Found (Cumulative)
  { id: 'words_10', emoji: '🐣', name: 'First Steps', description: 'Find 10 total words', requirement: 10, category: 'words_found' },
  { id: 'words_100', emoji: '📖', name: 'Reader', description: 'Find 100 total words', requirement: 100, category: 'words_found' },
  { id: 'words_500', emoji: '📕', name: 'Collector', description: 'Find 500 total words', requirement: 500, category: 'words_found' },
  { id: 'words_1000', emoji: '📚', name: 'Librarian', description: 'Find 1,000 total words', requirement: 1000, category: 'words_found' },
  { id: 'words_5000', emoji: '🏛️', name: 'Archivist', description: 'Find 5,000 total words', requirement: 5000, category: 'words_found' },

  // Games Played
  { id: 'games_1', emoji: '👋', name: 'Welcome', description: 'Play your first game', requirement: 1, category: 'games_played' },
  { id: 'games_10', emoji: '🎮', name: 'Getting Started', description: 'Play 10 games', requirement: 10, category: 'games_played' },
  { id: 'games_50', emoji: '🕹️', name: 'Regular', description: 'Play 50 games', requirement: 50, category: 'games_played' },
  { id: 'games_100', emoji: '🎯', name: 'Dedicated Player', description: 'Play 100 games', requirement: 100, category: 'games_played' },
  { id: 'games_250', emoji: '🏅', name: 'Veteran', description: 'Play 250 games', requirement: 250, category: 'games_played' },
  { id: 'games_500', emoji: '⭐', name: 'Expert', description: 'Play 500 games', requirement: 500, category: 'games_played' },

  // Lifetime Score (matches tile unlocks)
  { id: 'lifetime_5000', emoji: '🪙', name: 'Copper', description: 'Reach 5,000 lifetime score', requirement: 5000, category: 'lifetime_score' },
  { id: 'lifetime_25000', emoji: '🥉', name: 'Bronze', description: 'Reach 25,000 lifetime score', requirement: 25000, category: 'lifetime_score' },
  { id: 'lifetime_100000', emoji: '🥈', name: 'Silver', description: 'Reach 100,000 lifetime score', requirement: 100000, category: 'lifetime_score' },
  { id: 'lifetime_250000', emoji: '🥇', name: 'Gold', description: 'Reach 250,000 lifetime score', requirement: 250000, category: 'lifetime_score' },
  { id: 'lifetime_500000', emoji: '❤️', name: 'Ruby', description: 'Reach 500,000 lifetime score', requirement: 500000, category: 'lifetime_score' },
  { id: 'lifetime_1000000', emoji: '💚', name: 'Emerald', description: 'Reach 1,000,000 lifetime score', requirement: 1000000, category: 'lifetime_score' },
  { id: 'lifetime_2500000', emoji: '💠', name: 'Platinum', description: 'Reach 2,500,000 lifetime score', requirement: 2500000, category: 'lifetime_score' },
  { id: 'lifetime_5000000', emoji: '💎', name: 'Diamond', description: 'Reach 5,000,000 lifetime score', requirement: 5000000, category: 'lifetime_score' },
  { id: 'lifetime_10000000', emoji: '👑', name: 'Legendary', description: 'Reach 10,000,000 lifetime score', requirement: 10000000, category: 'lifetime_score' },
  { id: 'lifetime_25000000', emoji: '✨', name: 'Iridescence', description: 'Reach 25,000,000 lifetime score', requirement: 25000000, category: 'lifetime_score' },

  // Words Per Game (Single Game)
  { id: 'wpg_10', emoji: '🎯', name: 'Sharp Eye', description: 'Find 10+ words in one game', requirement: 10, category: 'words_per_game' },
  { id: 'wpg_15', emoji: '🔍', name: 'Word Hunter', description: 'Find 15+ words in one game', requirement: 15, category: 'words_per_game' },
  { id: 'wpg_20', emoji: '🦅', name: 'Eagle Eye', description: 'Find 20+ words in one game', requirement: 20, category: 'words_per_game' },
  { id: 'wpg_25', emoji: '🐙', name: 'Octopus', description: 'Find 25+ words in one game', requirement: 25, category: 'words_per_game' },

  // Daily Challenge Specific
  { id: 'daily_10', emoji: '🎯', name: 'Daily Devotee', description: 'Complete 10 dailies', requirement: 10, category: 'daily_specific' },
  { id: 'daily_30', emoji: '📆', name: 'Daily Regular', description: 'Complete 30 dailies', requirement: 30, category: 'daily_specific' },
  { id: 'daily_100', emoji: '🗓️', name: 'Daily Champion', description: 'Complete 100 dailies', requirement: 100, category: 'daily_specific' },
  { id: 'daily_score_3000', emoji: '💯', name: 'Daily Dominator', description: 'Score 3,000+ on a daily challenge', requirement: 3000, category: 'daily_specific' },

  // Special
  { id: 'blitz_5', emoji: '⚡', name: 'Speed Demon', description: 'Find 5+ words in Blitz mode', requirement: 5, category: 'special' },
  { id: 'standard_10', emoji: '🐢', name: 'Slow & Steady', description: 'Play 10 Standard mode games', requirement: 10, category: 'special' },
  { id: 'full_house', emoji: '🔤', name: 'Full House', description: 'Use all letters in a single word', requirement: 1, category: 'special' },
];

// ==================== STORAGE FUNCTIONS ====================

const defaultAchievementsData: AchievementsData = {
  unlocked: [],
};

export const loadAchievements = async (): Promise<AchievementsData> => {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (data) {
      return { ...defaultAchievementsData, ...JSON.parse(data) };
    }
    return defaultAchievementsData;
  } catch (error) {
    console.error('Error loading achievements:', error);
    return defaultAchievementsData;
  }
};

export const saveAchievements = async (data: AchievementsData): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
};

export const isAchievementUnlocked = (data: AchievementsData, achievementId: string): boolean => {
  return data.unlocked.some(a => a.id === achievementId);
};

export const unlockAchievement = async (achievementId: string): Promise<Achievement | null> => {
  const data = await loadAchievements();
  
  // Already unlocked
  if (isAchievementUnlocked(data, achievementId)) {
    return null;
  }
  
  // Find the achievement
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) {
    return null;
  }
  
  // Unlock it
  data.unlocked.push({
    id: achievementId,
    unlockedAt: new Date().toISOString(),
  });
  
  await saveAchievements(data);
  return achievement;
};

// ==================== ACHIEVEMENT CHECKING ====================

export interface GameResult {
  score: number;
  words: string[];
  mode: 'blitz' | 'standard' | 'daily';
  letterCount: number;
}

export interface PlayerProgress {
  // From PlayerStats
  totalGamesPlayed: number; // practice games
  totalScore: number; // lifetime score from practice
  totalWordsFound: number;
  standardGamesPlayed: number;
  // From DailyChallenge
  dailyGamesPlayed: number;
  dailyStreak: number;
  bestDailyStreak: number;
  dailyTotalScore: number;
}

// Check all achievements after a game and return newly unlocked ones
export const checkAchievements = async (
  gameResult: GameResult,
  progress: PlayerProgress
): Promise<Achievement[]> => {
  const newlyUnlocked: Achievement[] = [];
  
  // Helper to try unlocking
  const tryUnlock = async (id: string) => {
    const achievement = await unlockAchievement(id);
    if (achievement) {
      newlyUnlocked.push(achievement);
    }
  };
  
  // === Score Milestones (Single Game) ===
  if (gameResult.score >= 500) await tryUnlock('score_500');
  if (gameResult.score >= 1000) await tryUnlock('score_1000');
  if (gameResult.score >= 2000) await tryUnlock('score_2000');
  if (gameResult.score >= 4000) await tryUnlock('score_4000');
  if (gameResult.score >= 6000) await tryUnlock('score_6000');
  if (gameResult.score >= 8000) await tryUnlock('score_8000');
  
  // === Daily Streak ===
  const currentStreak = Math.max(progress.dailyStreak, progress.bestDailyStreak);
  if (currentStreak >= 3) await tryUnlock('streak_3');
  if (currentStreak >= 7) await tryUnlock('streak_7');
  if (currentStreak >= 14) await tryUnlock('streak_14');
  if (currentStreak >= 30) await tryUnlock('streak_30');
  if (currentStreak >= 60) await tryUnlock('streak_60');
  if (currentStreak >= 100) await tryUnlock('streak_100');
  
  // === Word Length ===
  const longestWordLength = gameResult.words.reduce(
    (max, word) => Math.max(max, word.length), 
    0
  );
  if (longestWordLength >= 5) await tryUnlock('word_5');
  if (longestWordLength >= 6) await tryUnlock('word_6');
  if (longestWordLength >= 7) await tryUnlock('word_7');
  if (longestWordLength >= 8) await tryUnlock('word_8');
  
  // === Words Found (Cumulative) ===
  const totalWords = progress.totalWordsFound;
  if (totalWords >= 10) await tryUnlock('words_10');
  if (totalWords >= 100) await tryUnlock('words_100');
  if (totalWords >= 500) await tryUnlock('words_500');
  if (totalWords >= 1000) await tryUnlock('words_1000');
  if (totalWords >= 5000) await tryUnlock('words_5000');
  
  // === Games Played (Practice + Daily) ===
  const totalGames = progress.totalGamesPlayed + progress.dailyGamesPlayed;
  if (totalGames >= 1) await tryUnlock('games_1');
  if (totalGames >= 10) await tryUnlock('games_10');
  if (totalGames >= 50) await tryUnlock('games_50');
  if (totalGames >= 100) await tryUnlock('games_100');
  if (totalGames >= 250) await tryUnlock('games_250');
  if (totalGames >= 500) await tryUnlock('games_500');
  
  // === Lifetime Score ===
  const lifetimeScore = progress.totalScore + progress.dailyTotalScore;
  if (lifetimeScore >= 1000) await tryUnlock('lifetime_1000');
  if (lifetimeScore >= 10000) await tryUnlock('lifetime_10000');
  if (lifetimeScore >= 50000) await tryUnlock('lifetime_50000');
  if (lifetimeScore >= 100000) await tryUnlock('lifetime_100000');
  if (lifetimeScore >= 500000) await tryUnlock('lifetime_500000');
  
  // === Words Per Game ===
  const wordsThisGame = gameResult.words.length;
  if (wordsThisGame >= 10) await tryUnlock('wpg_10');
  if (wordsThisGame >= 15) await tryUnlock('wpg_15');
  if (wordsThisGame >= 20) await tryUnlock('wpg_20');
  if (wordsThisGame >= 25) await tryUnlock('wpg_25');
  
  // === Daily Specific ===
  if (progress.dailyGamesPlayed >= 1) await tryUnlock('daily_1');
  if (progress.dailyGamesPlayed >= 10) await tryUnlock('daily_10');
  if (progress.dailyGamesPlayed >= 30) await tryUnlock('daily_30');
  if (progress.dailyGamesPlayed >= 100) await tryUnlock('daily_100');
  if (gameResult.mode === 'daily' && gameResult.score >= 200) await tryUnlock('daily_score_200');
  
  // === Special ===
  if (gameResult.mode === 'blitz' && wordsThisGame >= 5) await tryUnlock('blitz_5');
  if (progress.standardGamesPlayed >= 10) await tryUnlock('standard_10');
  
  // Full House - check if any word uses all letters
  const hasFullHouse = gameResult.words.some(word => word.length === gameResult.letterCount);
  if (hasFullHouse) await tryUnlock('full_house');
  
  return newlyUnlocked;
};

// Get all unlocked achievements with full details
export const getUnlockedAchievements = async (): Promise<(Achievement & { unlockedAt: string })[]> => {
  const data = await loadAchievements();
  
  return data.unlocked
    .map(unlocked => {
      const achievement = ACHIEVEMENTS.find(a => a.id === unlocked.id);
      if (!achievement) return null;
      return {
        ...achievement,
        unlockedAt: unlocked.unlockedAt,
      };
    })
    .filter((a): a is (Achievement & { unlockedAt: string }) => a !== null)
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
};

// Debug: Reset all achievements
export const resetAchievementsForTesting = async (): Promise<void> => {
  await saveAchievements(defaultAchievementsData);
};

// Debug: Unlock all achievements
export const unlockAllAchievementsForTesting = async (): Promise<void> => {
  const data: AchievementsData = {
    unlocked: ACHIEVEMENTS.map(a => ({
      id: a.id,
      unlockedAt: new Date().toISOString(),
    })),
  };
  await saveAchievements(data);
};
