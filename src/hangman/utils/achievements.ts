import AsyncStorage from '@react-native-async-storage/async-storage';
import { HangmanStats } from './storage';

const ACHIEVEMENTS_KEY = 'hangman_achievements';

// ==================== ACHIEVEMENT DEFINITIONS ====================

export interface Achievement {
  id:  string;
  name: string;
  description: string;
  emoji: string;
  category: 'getting_started' | 'streaks' | 'winning' | 'skill' | 'categories' | 'words';
}

export const ACHIEVEMENTS: Achievement[] = [
  // ===== GETTING STARTED =====
  {
    id: 'first_win',
    name: 'First Win',
    description: 'Win your first game',
    emoji: '🎉',
    category: 'getting_started',
  },
  {
    id: 'dedicated_player',
    name:  'Dedicated Player',
    description: 'Play 10 games',
    emoji: '🎮',
    category: 'getting_started',
  },
  {
    id: 'hangman_enthusiast',
    name: 'Hangman Enthusiast',
    description:  'Play 50 games',
    emoji: '⭐',
    category: 'getting_started',
  },
  {
    id: 'hangman_addict',
    name: 'Hangman Addict',
    description: 'Play 100 games',
    emoji: '🏆',
    category: 'getting_started',
  },

  // ===== STREAKS =====
  {
    id: 'on_a_roll',
    name: 'On a Roll',
    description: 'Win 3 games in a row',
    emoji: '🔥',
    category: 'streaks',
  },
  {
    id: 'hot_streak',
    name:  'Hot Streak',
    description: 'Win 5 games in a row',
    emoji: '💥',
    category: 'streaks',
  },
  {
    id:  'unstoppable',
    name: 'Unstoppable',
    description: 'Win 10 games in a row',
    emoji: '🚀',
    category: 'streaks',
  },
  {
    id: 'daily_player',
    name: 'Daily Player',
    description: 'Play 3 days in a row',
    emoji: '📅',
    category: 'streaks',
  },
  {
    id: 'weekly_warrior',
    name: 'Weekly Warrior',
    description: 'Play 7 days in a row',
    emoji:  '📆',
    category:  'streaks',
  },
  {
    id: 'monthly_master',
    name: 'Monthly Master',
    description: 'Play 30 days in a row',
    emoji: '🗓️',
    category: 'streaks',
  },

  // ===== WINNING =====
  {
    id: 'hangman_master',
    name:  'Hangman Master',
    description: 'Win 25 games total',
    emoji:  '👑',
    category:  'winning',
  },
  {
    id: 'hangman_legend',
    name: 'Hangman Legend',
    description: 'Win 50 games total',
    emoji: '🌟',
    category: 'winning',
  },
  {
    id:  'hangman_champion',
    name: 'Hangman Champion',
    description: 'Win 100 games total',
    emoji: '🏅',
    category: 'winning',
  },

  // ===== SKILL =====
  {
    id: 'perfect_game',
    name: 'Perfect Game',
    description: 'Win without any wrong guesses',
    emoji: '💯',
    category: 'skill',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Win 5 perfect games',
    emoji: '✨',
    category: 'skill',
  },
  {
    id: 'flawless',
    name: 'Flawless',
    description: 'Win 10 perfect games',
    emoji: '💎',
    category: 'skill',
  },
  {
    id: 'close_call',
    name: 'Close Call',
    description:  'Win with only 1 life remaining',
    emoji: '😅',
    category: 'skill',
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Win 5 games with only 1 life remaining',
    emoji: '🦾',
    category: 'skill',
  },
  {
    id:  'clutch_player',
    name: 'Clutch Player',
    description: 'Win 10 games with only 1 life remaining',
    emoji: '🎯',
    category: 'skill',
  },
  {
    id:  'sharp_mind',
    name: 'Sharp Mind',
    description: 'Reach 80% guess accuracy (min 50 guesses)',
    emoji: '🧠',
    category: 'skill',
  },

  // ===== CATEGORIES =====
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Play a game in every category',
    emoji: '🗺️',
    category:  'categories',
  },
  {
    id: 'animal_expert',
    name:  'Animal Expert',
    description: 'Win 10 games in Animals category',
    emoji:  '🦁',
    category: 'categories',
  },
  {
    id: 'world_traveler',
    name: 'World Traveler',
    description: 'Win 10 games in Countries category',
    emoji: '🌍',
    category: 'categories',
  },
  {
    id: 'foodie',
    name: 'Foodie',
    description: 'Win 10 games in Foods category',
    emoji: '🍕',
    category: 'categories',
  },
  {
    id: 'sports_fan',
    name: 'Sports Fan',
    description: 'Win 10 games in Sports category',
    emoji: '⚽',
    category:  'categories',
  },
  {
    id: 'tech_guru',
    name:  'Tech Guru',
    description: 'Win 10 games in Technology category',
    emoji: '💻',
    category: 'categories',
  },
  {
    id: 'film_buff',
    name: 'Film Buff',
    description: 'Win 10 games in Movies category',
    emoji: '🎬',
    category: 'categories',
  },
  {
    id: 'nature_lover',
    name: 'Nature Lover',
    description: 'Win 10 games in Nature category',
    emoji: '🌿',
    category: 'categories',
  },
  {
    id: 'career_counselor',
    name: 'Career Counselor',
    description: 'Win 10 games in Professions category',
    emoji: '👔',
    category: 'categories',
  },

  // ===== WORDS =====
  {
    id: 'vocabulary_builder',
    name: 'Vocabulary Builder',
    description: 'Guess 25 unique words',
    emoji: '📚',
    category: 'words',
  },
  {
    id: 'word_collector',
    name: 'Word Collector',
    description: 'Guess 50 unique words',
    emoji: '📖',
    category: 'words',
  },
  {
    id: 'lexicon_master',
    name: 'Lexicon Master',
    description: 'Guess 100 unique words',
    emoji: '🎓',
    category:  'words',
  },
];

// All categories in the game
const ALL_CATEGORIES = [
  'Animals',
  'Countries',
  'Foods',
  'Sports',
  'Technology',
  'Movies',
  'Nature',
  'Professions',
];

// ==================== INTERFACES ====================

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

// ==================== STORAGE FUNCTIONS ====================

export const loadUnlockedAchievements = async (): Promise<UnlockedAchievement[]> => {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading achievements:', error);
    return [];
  }
};

export const saveUnlockedAchievements = async (
  achievements: UnlockedAchievement[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
};

const unlockAchievement = async (id: string): Promise<boolean> => {
  const unlocked = await loadUnlockedAchievements();

  // Check if already unlocked
  if (unlocked.some((a) => a.id === id)) {
    return false;
  }

  // Unlock new achievement
  unlocked.push({
    id,
    unlockedAt: new Date().toISOString(),
  });

  await saveUnlockedAchievements(unlocked);
  return true;
};

// ==================== CHECK ACHIEVEMENTS ====================

export interface GameResult {
  won: boolean;
  incorrectGuesses: number;
  remainingLives: number;
}

export const checkAchievements = async (
  stats: HangmanStats,
  gameResult?:  GameResult
): Promise<Achievement[]> => {
  const newlyUnlocked:  Achievement[] = [];
  const unlocked = await loadUnlockedAchievements();
  const unlockedIds = unlocked.map((a) => a.id);

  const checkAndUnlock = async (id: string): Promise<boolean> => {
    if (! unlockedIds.includes(id)) {
      const success = await unlockAchievement(id);
      if (success) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === id);
        if (achievement) {
          newlyUnlocked.push(achievement);
        }
        return true;
      }
    }
    return false;
  };

  // ===== GETTING STARTED =====
  if (stats. gamesWon >= 1) {
    await checkAndUnlock('first_win');
  }
  if (stats.gamesPlayed >= 10) {
    await checkAndUnlock('dedicated_player');
  }
  if (stats.gamesPlayed >= 50) {
    await checkAndUnlock('hangman_enthusiast');
  }
  if (stats.gamesPlayed >= 100) {
    await checkAndUnlock('hangman_addict');
  }

  // ===== STREAKS (Win Streaks) =====
  if (stats.currentStreak >= 3 || stats.bestStreak >= 3) {
    await checkAndUnlock('on_a_roll');
  }
  if (stats.currentStreak >= 5 || stats.bestStreak >= 5) {
    await checkAndUnlock('hot_streak');
  }
  if (stats. currentStreak >= 10 || stats.bestStreak >= 10) {
    await checkAndUnlock('unstoppable');
  }

  // ===== STREAKS (Day Streaks) =====
  if (stats.currentStreak >= 3 || stats.bestStreak >= 3) {
    await checkAndUnlock('daily_player');
  }
  if (stats.currentStreak >= 7 || stats.bestStreak >= 7) {
    await checkAndUnlock('weekly_warrior');
  }
  if (stats.currentStreak >= 30 || stats.bestStreak >= 30) {
    await checkAndUnlock('monthly_master');
  }

  // ===== WINNING =====
  if (stats.gamesWon >= 25) {
    await checkAndUnlock('hangman_master');
  }
  if (stats.gamesWon >= 50) {
    await checkAndUnlock('hangman_legend');
  }
  if (stats.gamesWon >= 100) {
    await checkAndUnlock('hangman_champion');
  }

  // ===== SKILL =====
  if (gameResult?.won && gameResult. incorrectGuesses === 0) {
    await checkAndUnlock('perfect_game');
  }
  if (stats.perfectGames >= 5) {
    await checkAndUnlock('perfectionist');
  }
  if (stats.perfectGames >= 10) {
    await checkAndUnlock('flawless');
  }
  if (gameResult?.won && gameResult.remainingLives === 1) {
    await checkAndUnlock('close_call');
  }
  if (stats.closeGames >= 5) {
    await checkAndUnlock('survivor');
  }
  if (stats.closeGames >= 10) {
    await checkAndUnlock('clutch_player');
  }
  if (stats.totalGuesses >= 50) {
    const accuracy = Math.round((stats.correctGuesses / stats.totalGuesses) * 100);
    if (accuracy >= 80) {
      await checkAndUnlock('sharp_mind');
    }
  }

  // ===== CATEGORIES =====
  const playedCategories = Object.keys(stats.categoryPlays);
  if (ALL_CATEGORIES.every((cat) => playedCategories.includes(cat))) {
    await checkAndUnlock('explorer');
  }

  // Category-specific wins
  const categoryAchievements:  { [key: string]: string } = {
    Animals: 'animal_expert',
    Countries: 'world_traveler',
    Foods: 'foodie',
    Sports: 'sports_fan',
    Technology: 'tech_guru',
    Movies: 'film_buff',
    Nature: 'nature_lover',
    Professions: 'career_counselor',
  };

  for (const [category, achievementId] of Object.entries(categoryAchievements)) {
    if ((stats.categoryWins[category] || 0) >= 10) {
      await checkAndUnlock(achievementId);
    }
  }

  // ===== WORDS =====
  if (stats.wordsGuessed. length >= 25) {
    await checkAndUnlock('vocabulary_builder');
  }
  if (stats.wordsGuessed.length >= 50) {
    await checkAndUnlock('word_collector');
  }
  if (stats.wordsGuessed.length >= 100) {
    await checkAndUnlock('lexicon_master');
  }

  return newlyUnlocked;
};

// ==================== HELPER FUNCTIONS ====================

export const getUnlockedAchievementsWithDetails = async (): Promise<
  (Achievement & { unlockedAt: string })[]
> => {
  const unlocked = await loadUnlockedAchievements();
  return unlocked
    .map((u) => {
      const achievement = ACHIEVEMENTS. find((a) => a.id === u.id);
      if (achievement) {
        return { ...achievement, unlockedAt: u. unlockedAt };
      }
      return null;
    })
    .filter((a): a is Achievement & { unlockedAt: string } => a !== null);
};

export const getLockedAchievements = async (): Promise<Achievement[]> => {
  const unlocked = await loadUnlockedAchievements();
  const unlockedIds = unlocked.map((a) => a.id);
  return ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id));
};

export const getTotalAchievementCount = (): number => {
  return ACHIEVEMENTS.length;
};

// ==================== DEBUG FUNCTIONS ====================

export const resetAchievements = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
};