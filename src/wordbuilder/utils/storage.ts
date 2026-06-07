import AsyncStorage from '@react-native-async-storage/async-storage';
import { TierName, TIERS, TIER_ORDER } from './tiers';

const STATS_KEY = 'wordbuilder_stats';
const TILES_KEY = 'wordbuilder_tiles';
const DAILY_KEY = 'wordbuilder_daily';

// Debug flag - set to true to unlock all tiles/achievements for owner testing
// ⚠️ SET BACK TO false BEFORE SHIPPING TO THE APP STORE
export const DEBUG_UNLOCK_ALL = true;

// ==================== INTERFACES ====================

export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  totalWordsFound: number;
  longestWord: string;
  // Mode-specific stats
  blitzGamesPlayed: number;
  standardGamesPlayed: number;
  bestBlitzScore: number;
  bestStandardScore: number;
  blitzTotalScore: number;
  standardTotalScore: number;
  // Single-game records
  mostWordsInGame: number;
  // Letter count preferences
  gamesWithSixLetters: number;
  gamesWithSevenLetters: number;
  gamesWithEightLetters: number;
}

export interface TierProgress {
  scoreWithTier: number;
  highestVariantUnlocked: number;
}

export interface PlayerTiles {
  equippedTier: TierName;
  equippedVariant: number;
  tierProgress: Record<TierName, TierProgress>;
}

export interface DailyChallenge {
  // Today's challenge
  lastPlayedDate: string; // "YYYY-MM-DD"
  lastDailyScore: number;
  lastDailyWords: string[];
  // Streak tracking
  dailyStreak: number;
  bestDailyStreak: number; // Longest streak ever
  // Cumulative stats
  dailyGamesPlayed: number; // Total daily challenges completed
  dailyTotalScore: number; // Sum of all daily scores
  dailyTotalWords: number; // Sum of all words found in dailies
  bestDailyScore: number; // Highest daily score ever
  bestDailyWords: number; // Most words found in a single daily
}

// ==================== DEFAULT VALUES ====================

const defaultStats: PlayerStats = {
  gamesPlayed: 0,
  totalScore: 0,
  highScore: 0,
  totalWordsFound: 0,
  longestWord: '',
  blitzGamesPlayed: 0,
  standardGamesPlayed: 0,
  bestBlitzScore: 0,
  bestStandardScore: 0,
  blitzTotalScore: 0,
  standardTotalScore: 0,
  mostWordsInGame: 0,
  gamesWithSixLetters: 0,
  gamesWithSevenLetters: 0,
  gamesWithEightLetters: 0,
};

const createDefaultTierProgress = (): Record<TierName, TierProgress> => {
  const progress: Record<TierName, TierProgress> = {} as Record<TierName, TierProgress>;
  for (const tierName of TIER_ORDER) {
    progress[tierName] = {
      scoreWithTier: 0,
      highestVariantUnlocked: tierName === 'default' ? 6 : 1,
    };
  }
  return progress;
};

const defaultTiles: PlayerTiles = {
  equippedTier: 'default',
  equippedVariant: 1,
  tierProgress: createDefaultTierProgress(),
};

const defaultDailyChallenge: DailyChallenge = {
  lastPlayedDate: '',
  lastDailyScore: 0,
  lastDailyWords: [],
  dailyStreak: 0,
  bestDailyStreak: 0,
  dailyGamesPlayed: 0,
  dailyTotalScore: 0,
  dailyTotalWords: 0,
  bestDailyScore: 0,
  bestDailyWords: 0,
};

// ==================== STATS FUNCTIONS ====================

export const loadStats = async (): Promise<PlayerStats> => {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (data) {
      return { ...defaultStats, ...JSON.parse(data) };
    }
    return defaultStats;
  } catch (error) {
    console.error('Error loading stats:', error);
    return defaultStats;
  }
};

export const saveStats = async (stats: PlayerStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

export const updateStatsAfterGame = async (
  score: number,
  words: string[],
  mode: 'blitz' | 'standard' | 'daily',
  letterCount: number
): Promise<PlayerStats> => {
  const stats = await loadStats();
  
  // Don't update regular stats for daily mode (handled separately)
  if (mode === 'daily') {
    return stats;
  }
  
  stats.gamesPlayed += 1;
  stats.totalScore += score;
  stats.highScore = Math.max(stats.highScore, score);
  stats.totalWordsFound += words.length;
  
  const longestInGame = words.reduce((longest, word) => 
    word.length > longest.length ? word : longest, '');
  if (longestInGame.length > stats.longestWord.length) {
    stats.longestWord = longestInGame;
  }
  
  if (mode === 'blitz') {
    stats.blitzGamesPlayed += 1;
    stats.bestBlitzScore = Math.max(stats.bestBlitzScore, score);
    stats.blitzTotalScore += score;
  }
  if (mode === 'standard') {
    stats.standardGamesPlayed += 1;
    stats.bestStandardScore = Math.max(stats.bestStandardScore, score);
    stats.standardTotalScore += score;
  }

  stats.mostWordsInGame = Math.max(stats.mostWordsInGame, words.length);
  
  if (letterCount === 6) stats.gamesWithSixLetters += 1;
  if (letterCount === 7) stats.gamesWithSevenLetters += 1;
  if (letterCount === 8) stats.gamesWithEightLetters += 1;
  
  await saveStats(stats);
  return stats;
};

export const getAverageScore = (stats: PlayerStats): number => {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round(stats.totalScore / stats.gamesPlayed);
};

export const getWordsPerGame = (stats: PlayerStats): number => {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.totalWordsFound / stats.gamesPlayed) * 10) / 10;
};

export const getFavoriteMode = (stats: PlayerStats): string => {
  if (stats.blitzGamesPlayed === 0 && stats.standardGamesPlayed === 0) return '-';
  return stats.blitzGamesPlayed >= stats.standardGamesPlayed ? 'Blitz' : 'Standard';
};

export const getFavoriteLetterCount = (stats: PlayerStats): string => {
  const counts = [
    { count: 6, games: stats.gamesWithSixLetters },
    { count: 7, games: stats.gamesWithSevenLetters },
    { count: 8, games: stats.gamesWithEightLetters },
  ];
  const favorite = counts.reduce((max, curr) => curr.games > max.games ? curr : max);
  if (favorite.games === 0) return '-';
  return `${favorite.count} letters`;
};

// ==================== TILES FUNCTIONS ====================

export const loadTiles = async (): Promise<PlayerTiles> => {
  try {
    const data = await AsyncStorage.getItem(TILES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const merged = {
        ...defaultTiles,
        ...parsed,
        tierProgress: {
          ...createDefaultTierProgress(),
          ...parsed.tierProgress,
        },
      };
      return merged;
    }
    return defaultTiles;
  } catch (error) {
    console.error('Error loading tiles:', error);
    return defaultTiles;
  }
};

export const saveTiles = async (tiles: PlayerTiles): Promise<void> => {
  try {
    await AsyncStorage.setItem(TILES_KEY, JSON.stringify(tiles));
  } catch (error) {
    console.error('Error saving tiles:', error);
  }
};

export const equipTile = async (tier: TierName, variant: number): Promise<boolean> => {
  try {
    const tiles = await loadTiles();
    const stats = await loadStats();
    const tierConfig = TIERS[tier];
    
    if (tier !== 'default' && stats.totalScore < tierConfig.baseThreshold) {
      return false;
    }
    
    const progress = tiles.tierProgress[tier];
    if (variant > progress.highestVariantUnlocked) {
      return false;
    }
    
    tiles.equippedTier = tier;
    tiles.equippedVariant = variant;
    await saveTiles(tiles);
    return true;
  } catch (error) {
    console.error('Error equipping tile:', error);
    return false;
  }
};

export const addScoreToEquippedTier = async (score: number): Promise<void> => {
  const tiles = await loadTiles();
  const tier = tiles.equippedTier;
  
  if (tier === 'default') return;
  
  const progress = tiles.tierProgress[tier];
  progress.scoreWithTier += score;
  
  const tierConfig = TIERS[tier];
  
  if (progress.highestVariantUnlocked < 2 && progress.scoreWithTier >= tierConfig.v2ScoreThreshold) {
    progress.highestVariantUnlocked = 2;
  }
  
  await saveTiles(tiles);
};

// ==================== DAILY CHALLENGE FUNCTIONS ====================

export const loadDailyChallenge = async (): Promise<DailyChallenge> => {
  try {
    const data = await AsyncStorage.getItem(DAILY_KEY);
    if (data) {
      return { ...defaultDailyChallenge, ...JSON.parse(data) };
    }
    return defaultDailyChallenge;
  } catch (error) {
    console.error('Error loading daily challenge:', error);
    return defaultDailyChallenge;
  }
};

export const saveDailyChallenge = async (daily: DailyChallenge): Promise<void> => {
  try {
    await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(daily));
  } catch (error) {
    console.error('Error saving daily challenge:', error);
  }
};

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const hasPlayedTodayDaily = async (): Promise<boolean> => {
  const daily = await loadDailyChallenge();
  return daily.lastPlayedDate === getTodayDateString();
};

export const getTodayDailyResult = async (): Promise<{
  played: boolean;
  score: number;
  words: string[];
}> => {
  const daily = await loadDailyChallenge();
  const today = getTodayDateString();
  
  if (daily.lastPlayedDate === today) {
    return {
      played: true,
      score: daily.lastDailyScore,
      words: daily.lastDailyWords,
    };
  }
  
  return { played: false, score: 0, words: [] };
};

export const saveDailyResult = async (score: number, words: string[]): Promise<DailyChallenge> => {
  const daily = await loadDailyChallenge();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  
  // Don't save if already played today
  if (daily.lastPlayedDate === today) {
    return daily;
  }
  
  // Update streak
  if (daily.lastPlayedDate === yesterday) {
    // Played yesterday, continue streak
    daily.dailyStreak += 1;
  } else {
    // Didn't play yesterday (or first time), start/reset streak
    daily.dailyStreak = 1;
  }
  
  // Update best streak
  daily.bestDailyStreak = Math.max(daily.bestDailyStreak, daily.dailyStreak);
  
  // Update cumulative stats
  daily.dailyGamesPlayed += 1;
  daily.dailyTotalScore += score;
  daily.dailyTotalWords += words.length;
  daily.bestDailyScore = Math.max(daily.bestDailyScore, score);
  daily.bestDailyWords = Math.max(daily.bestDailyWords, words.length);
  
  // Update today's result
  daily.lastPlayedDate = today;
  daily.lastDailyScore = score;
  daily.lastDailyWords = words;
  
  await saveDailyChallenge(daily);
  return daily;
};

// ==================== DAILY STATS HELPERS ====================

export const getDailyAverageScore = (daily: DailyChallenge): number => {
  if (daily.dailyGamesPlayed === 0) return 0;
  return Math.round(daily.dailyTotalScore / daily.dailyGamesPlayed);
};

export const getDailyAverageWords = (daily: DailyChallenge): number => {
  if (daily.dailyGamesPlayed === 0) return 0;
  return Math.round((daily.dailyTotalWords / daily.dailyGamesPlayed) * 10) / 10;
};

// ==================== DEBUG FUNCTIONS ====================

export const unlockAllTilesForTesting = async (): Promise<void> => {
  // Unlock all tile tiers and variants
  const tiles = await loadTiles();
  for (const tierName of TIER_ORDER) {
    tiles.tierProgress[tierName] = {
      scoreWithTier: 999999999,
      highestVariantUnlocked: tierName === 'default' ? 6 : 2,
    };
  }
  await saveTiles(tiles);

  // Max out all stats so progress bars and displays look populated
  const stats = await loadStats();
  stats.totalScore = 999999999;
  stats.gamesPlayed = 500;
  stats.highScore = 25000;
  stats.totalWordsFound = 5000;
  stats.longestWord = 'breaking';
  stats.blitzGamesPlayed = 250;
  stats.standardGamesPlayed = 250;
  stats.bestBlitzScore = 3500;
  stats.bestStandardScore = 25000;
  stats.blitzTotalScore = 500000;
  stats.standardTotalScore = 500000;
  stats.mostWordsInGame = 30;
  stats.gamesWithSixLetters = 200;
  stats.gamesWithSevenLetters = 200;
  stats.gamesWithEightLetters = 100;
  await saveStats(stats);

  // Max out daily stats
  const daily = await loadDailyChallenge();
  if (daily.dailyGamesPlayed === 0) {
    daily.dailyStreak = 30;
    daily.bestDailyStreak = 30;
    daily.dailyGamesPlayed = 100;
    daily.dailyTotalScore = 300000;
    daily.dailyTotalWords = 1000;
    daily.bestDailyScore = 8500;
    daily.bestDailyWords = 28;
    await saveDailyChallenge(daily);
  }

  // Unlock all WordBuilder achievements
  const { ACHIEVEMENTS, loadAchievements, saveAchievements } = await import('./achievements');
  const achievementsData = await loadAchievements();
  const now = new Date().toISOString();
  for (const achievement of ACHIEVEMENTS) {
    if (!achievementsData.unlocked.some((a: { id: string }) => a.id === achievement.id)) {
      achievementsData.unlocked.push({ id: achievement.id, unlockedAt: now });
    }
  }
  await saveAchievements(achievementsData);
};

export const setScoreForTesting = async (score: number): Promise<void> => {
  const stats = await loadStats();
  stats.totalScore = score;
  await saveStats(stats);
};

export const resetDailyForTesting = async (): Promise<void> => {
  const daily = await loadDailyChallenge();
  daily.lastPlayedDate = '';
  daily.lastDailyScore = 0;
  daily.lastDailyWords = [];
  await saveDailyChallenge(daily);
};

export const resetAllDailyStatsForTesting = async (): Promise<void> => {
  await saveDailyChallenge(defaultDailyChallenge);
};
