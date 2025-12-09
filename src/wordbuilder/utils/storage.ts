import AsyncStorage from '@react-native-async-storage/async-storage';
import { TIERS, TIER_ORDER, TierName, isGreatGame } from './tiers';

// Keys for storing data
const STATS_KEY = 'wordbuilder_player_stats';
const TILES_KEY = 'wordbuilder_player_tiles';
const ECONOMY_KEY = 'wordbuilder_player_economy';
const SESSION_KEY = 'wordbuilder_session'; // For streak tracking within session

// ==================== STATS ====================

export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  totalWordsFound: number;
  longestWord: string;
  blitzGamesPlayed: number;
  standardGamesPlayed: number;
  games6Letters: number;
  games7Letters: number;
  games8Letters: number;
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  totalScore: 0,
  highScore: 0,
  totalWordsFound: 0,
  longestWord: '',
  blitzGamesPlayed: 0,
  standardGamesPlayed: 0,
  games6Letters: 0,
  games7Letters: 0,
  games8Letters: 0,
};

// ==================== TILES (Career Rewards) ====================

export interface TierProgress {
  highestVariantUnlocked: number; // 0 = locked, 1 = base, 2 = v2, 3 = v3 (or 1-6 for default styles)
  scoreWithTier: number;
  greatGamesWithTier: number;
}

export interface PlayerTiles {
  equippedTier: TierName;
  equippedVariant: number;
  tierProgress: Record<TierName, TierProgress>;
}

const DEFAULT_TIER_PROGRESS: TierProgress = {
  highestVariantUnlocked: 0,
  scoreWithTier: 0,
  greatGamesWithTier: 0,
};

const createDefaultTiles = (): PlayerTiles => {
  const tierProgress: Record<TierName, TierProgress> = {} as Record<TierName, TierProgress>;
  
  for (const tier of TIER_ORDER) {
    tierProgress[tier] = { ...DEFAULT_TIER_PROGRESS };
  }
  
  // Default tier styles are always unlocked (all 6)
  tierProgress.default.highestVariantUnlocked = 6;
  
  return {
    equippedTier: 'default',
    equippedVariant: 1,
    tierProgress,
  };
};

// ==================== ECONOMY (Ink Currency) ====================

export interface PlayerEconomy {
  ink: number;
  lastDailyWinDate: string | null; // ISO date string (YYYY-MM-DD)
  ownedShopTiles: string[];        // Array of shop tile IDs
  ownedBackgrounds: string[];      // Array of background IDs
  equippedShopTile: string | null; // Currently equipped shop tile (null = using career tile)
  equippedBackground: string;      // Currently equipped background ID
  totalInkEarned: number;          // Lifetime ink earned (for analytics/debugging)
  totalInkSpent: number;           // Lifetime ink spent (for analytics/debugging)
}

const DEFAULT_ECONOMY: PlayerEconomy = {
  ink: 0,
  lastDailyWinDate: null,
  ownedShopTiles: [],
  ownedBackgrounds: ['bg_default'], // Player starts with default background
  equippedShopTile: null,
  equippedBackground: 'bg_default',
  totalInkEarned: 0,
  totalInkSpent: 0,
};

// ==================== SESSION DATA (In-Memory, Resets on App Close) ====================

interface SessionData {
  matchesPlayedThisSession: number;
  lastStreakBonusAt: number; // Match count when last streak bonus was awarded
}

let sessionData: SessionData = {
  matchesPlayedThisSession: 0,
  lastStreakBonusAt: 0,
};

// Reset session data (call on app start)
export const resetSessionData = (): void => {
  sessionData = {
    matchesPlayedThisSession: 0,
    lastStreakBonusAt: 0,
  };
};

// ==================== INK EARNING CONSTANTS ====================

export const INK_REWARDS = {
  MATCH_COMPLETION: 10,
  PER_WORD: 1,
  FIRST_DAILY_WIN: 25,
  STREAK_BONUS: 10,
  STREAK_INTERVAL: 3, // Every 3 matches
} as const;

// ==================== LOAD FUNCTIONS ====================

export const loadStats = async (): Promise<PlayerStats> => {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (data) {
      return { ...DEFAULT_STATS, ...JSON.parse(data) };
    }
    return { ...DEFAULT_STATS };
  } catch (error) {
    console.error('Error loading stats:', error);
    return { ...DEFAULT_STATS };
  }
};

export const loadTiles = async (): Promise<PlayerTiles> => {
  try {
    const data = await AsyncStorage.getItem(TILES_KEY);
    if (data) {
      const tiles = JSON.parse(data);
      // Ensure all tiers exist (backwards compatibility)
      for (const tier of TIER_ORDER) {
        if (!tiles.tierProgress[tier]) {
          tiles.tierProgress[tier] = { ...DEFAULT_TIER_PROGRESS };
        }
      }
      // Ensure default has all 6 styles unlocked
      if (tiles.tierProgress.default.highestVariantUnlocked < 6) {
        tiles.tierProgress.default.highestVariantUnlocked = 6;
      }
      return tiles;
    }
    return createDefaultTiles();
  } catch (error) {
    console.error('Error loading tiles:', error);
    return createDefaultTiles();
  }
};

export const loadEconomy = async (): Promise<PlayerEconomy> => {
  try {
    const data = await AsyncStorage.getItem(ECONOMY_KEY);
    if (data) {
      return { ...DEFAULT_ECONOMY, ...JSON.parse(data) };
    }
    return { ...DEFAULT_ECONOMY };
  } catch (error) {
    console.error('Error loading economy:', error);
    return { ...DEFAULT_ECONOMY };
  }
};

// ==================== SAVE FUNCTIONS ====================

export const saveStats = async (stats: PlayerStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

export const saveTiles = async (tiles: PlayerTiles): Promise<void> => {
  try {
    await AsyncStorage.setItem(TILES_KEY, JSON.stringify(tiles));
  } catch (error) {
    console.error('Error saving tiles:', error);
  }
};

export const saveEconomy = async (economy: PlayerEconomy): Promise<void> => {
  try {
    await AsyncStorage.setItem(ECONOMY_KEY, JSON.stringify(economy));
  } catch (error) {
    console.error('Error saving economy:', error);
  }
};

// ==================== INK CALCULATION ====================

export interface InkBreakdown {
  matchCompletion: number;
  wordsFound: number;
  wordCount: number;
  streakBonus: number;
  isStreakBonus: boolean;
  firstDailyWin: number;
  isFirstDailyWin: boolean;
  total: number;
}

// Get today's date as YYYY-MM-DD string
const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Calculate ink earned for a completed match (does NOT save - just calculates)
export const calculateInkEarnings = async (
  wordsFoundCount: number,
  isWin: boolean = true // For future use if we add win/loss distinction
): Promise<InkBreakdown> => {
  const economy = await loadEconomy();
  const today = getTodayDateString();
  
  // Base rewards
  const matchCompletion = INK_REWARDS.MATCH_COMPLETION;
  const wordsFound = wordsFoundCount * INK_REWARDS.PER_WORD;
  
  // First daily win check
  const isFirstDailyWin = economy.lastDailyWinDate !== today;
  const firstDailyWin = isFirstDailyWin ? INK_REWARDS.FIRST_DAILY_WIN : 0;
  
  // Streak bonus check (in-memory session tracking)
  const matchesAfterThis = sessionData.matchesPlayedThisSession + 1;
  const streakBonusesEarned = Math.floor(matchesAfterThis / INK_REWARDS.STREAK_INTERVAL);
  const previousStreakBonuses = Math.floor(sessionData.lastStreakBonusAt / INK_REWARDS.STREAK_INTERVAL);
  const isStreakBonus = streakBonusesEarned > previousStreakBonuses;
  const streakBonus = isStreakBonus ? INK_REWARDS.STREAK_BONUS : 0;
  
  const total = matchCompletion + wordsFound + firstDailyWin + streakBonus;
  
  return {
    matchCompletion,
    wordsFound,
    wordCount: wordsFoundCount,
    streakBonus,
    isStreakBonus,
    firstDailyWin,
    isFirstDailyWin,
    total,
  };
};

// ==================== GAME COMPLETION ====================

// Main function called after each game ends
export const updateStatsAfterGame = async (
  gameScore: number,
  wordsFound: string[],
  gameMode: 'blitz' | 'standard',
  letterCount: number
): Promise<InkBreakdown> => {
  // Load all data
  const stats = await loadStats();
  const economy = await loadEconomy();
  const today = getTodayDateString();
  
  // Calculate ink BEFORE updating session (important for accurate streak calculation)
  const inkBreakdown = await calculateInkEarnings(wordsFound.length);
  
  // ========== UPDATE STATS ==========
  stats.gamesPlayed += 1;
  stats.totalScore += gameScore;
  stats.totalWordsFound += wordsFound.length;
  
  if (gameScore > stats.highScore) {
    stats.highScore = gameScore;
  }
  
  const longestInGame = wordsFound.reduce((longest, word) => 
    word.length > longest.length ? word : longest
  , '');
  if (longestInGame.length > stats.longestWord.length) {
    stats.longestWord = longestInGame;
  }
  
  if (gameMode === 'blitz') {
    stats.blitzGamesPlayed += 1;
  } else {
    stats.standardGamesPlayed += 1;
  }
  
  if (letterCount === 6) stats.games6Letters += 1;
  else if (letterCount === 7) stats.games7Letters += 1;
  else if (letterCount === 8) stats.games8Letters += 1;
  
  // ========== UPDATE ECONOMY ==========
  economy.ink += inkBreakdown.total;
  economy.totalInkEarned += inkBreakdown.total;
  
  if (inkBreakdown.isFirstDailyWin) {
    economy.lastDailyWinDate = today;
  }
  
  // ========== UPDATE SESSION ==========
  sessionData.matchesPlayedThisSession += 1;
  if (inkBreakdown.isStreakBonus) {
    sessionData.lastStreakBonusAt = sessionData.matchesPlayedThisSession;
  }
  
  // ========== SAVE ALL ==========
  await Promise.all([
    saveStats(stats),
    saveEconomy(economy),
    updateTileProgressAfterGame(gameScore, gameMode, stats.totalScore),
  ]);
  
  return inkBreakdown;
};

// Update tile progress after a game
export const updateTileProgressAfterGame = async (
  gameScore: number,
  gameMode: 'blitz' | 'standard',
  lifetimeScore: number
): Promise<void> => {
  const tiles = await loadTiles();
  const equippedTier = tiles.equippedTier;
  const modeSeconds = gameMode === 'blitz' ? 30 : 60;
  
  // Update progress for equipped tier (skip default - it has no variants to unlock)
  if (equippedTier !== 'default') {
    tiles.tierProgress[equippedTier].scoreWithTier += gameScore;
    
    if (isGreatGame(modeSeconds, gameScore)) {
      tiles.tierProgress[equippedTier].greatGamesWithTier += 1;
    }
  }
  
  // Check for new unlocks across all tiers
  for (const tierName of TIER_ORDER) {
    if (tierName === 'default') continue;
    
    const tier = TIERS[tierName];
    const progress = tiles.tierProgress[tierName];
    let newHighest = progress.highestVariantUnlocked;
    
    // Check base unlock
    if (lifetimeScore >= tier.baseThreshold && newHighest < 1) {
      newHighest = 1;
    }
    
    // Check V2 unlock
    if (newHighest >= 1 && progress.scoreWithTier >= tier.v2ScoreThreshold && newHighest < 2) {
      newHighest = 2;
    }
    
    // Check V3 unlock
    if (newHighest >= 2 && progress.greatGamesWithTier >= tier.v3GreatThreshold && newHighest < 3) {
      newHighest = 3;
    }
    
    tiles.tierProgress[tierName].highestVariantUnlocked = newHighest;
  }
  
  await saveTiles(tiles);
};

// ==================== SHOP PURCHASES ====================

export interface PurchaseResult {
  success: boolean;
  error?: string;
  newBalance?: number;
}

// Purchase a shop tile
export const purchaseShopTile = async (tileId: string, cost: number): Promise<PurchaseResult> => {
  const economy = await loadEconomy();
  
  // Check if already owned
  if (economy.ownedShopTiles.includes(tileId)) {
    return { success: false, error: 'Already owned' };
  }
  
  // Check if enough ink
  if (economy.ink < cost) {
    return { success: false, error: 'Insufficient Ink' };
  }
  
  // Process purchase
  economy.ink -= cost;
  economy.totalInkSpent += cost;
  economy.ownedShopTiles.push(tileId);
  
  await saveEconomy(economy);
  
  return { success: true, newBalance: economy.ink };
};

// Purchase a background
export const purchaseBackground = async (backgroundId: string, cost: number): Promise<PurchaseResult> => {
  const economy = await loadEconomy();
  
  // Check if already owned
  if (economy.ownedBackgrounds.includes(backgroundId)) {
    return { success: false, error: 'Already owned' };
  }
  
  // Check if enough ink
  if (economy.ink < cost) {
    return { success: false, error: 'Insufficient Ink' };
  }
  
  // Process purchase
  economy.ink -= cost;
  economy.totalInkSpent += cost;
  economy.ownedBackgrounds.push(backgroundId);
  
  await saveEconomy(economy);
  
  return { success: true, newBalance: economy.ink };
};

// ==================== EQUIP FUNCTIONS ====================

// Equip a career tile (tier + variant)
export const equipCareerTile = async (tier: TierName, variant: number): Promise<boolean> => {
  const tiles = await loadTiles();
  const economy = await loadEconomy();
  
  // For default tier, all 6 styles are available
  if (tier === 'default') {
    if (variant >= 1 && variant <= 6) {
      tiles.equippedTier = tier;
      tiles.equippedVariant = variant;
      economy.equippedShopTile = null; // Unequip any shop tile
      await Promise.all([saveTiles(tiles), saveEconomy(economy)]);
      return true;
    }
    return false;
  }
  
  // For other tiers, check if variant is unlocked
  if (tiles.tierProgress[tier].highestVariantUnlocked >= variant) {
    tiles.equippedTier = tier;
    tiles.equippedVariant = variant;
    economy.equippedShopTile = null; // Unequip any shop tile
    await Promise.all([saveTiles(tiles), saveEconomy(economy)]);
    return true;
  }
  
  return false;
};

// Equip a shop tile
export const equipShopTile = async (tileId: string): Promise<boolean> => {
  const economy = await loadEconomy();
  
  // Check if owned
  if (!economy.ownedShopTiles.includes(tileId)) {
    return false;
  }
  
  economy.equippedShopTile = tileId;
  await saveEconomy(economy);
  return true;
};

// Equip a background
export const equipBackground = async (backgroundId: string): Promise<boolean> => {
  const economy = await loadEconomy();
  
  // Check if owned
  if (!economy.ownedBackgrounds.includes(backgroundId)) {
    return false;
  }
  
  economy.equippedBackground = backgroundId;
  await saveEconomy(economy);
  return true;
};

// Legacy function - now calls equipCareerTile
export const equipTile = async (tier: TierName, variant: number): Promise<boolean> => {
  return equipCareerTile(tier, variant);
};

// ==================== HELPER FUNCTIONS ====================

export const getAverageScore = (stats: PlayerStats): number => {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round(stats.totalScore / stats.gamesPlayed);
};

export const getWordsPerGame = (stats: PlayerStats): number => {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.totalWordsFound / stats.gamesPlayed) * 10) / 10;
};

export const getFavoriteMode = (stats: PlayerStats): string => {
  if (stats.gamesPlayed === 0) return '-';
  if (stats.blitzGamesPlayed > stats.standardGamesPlayed) return 'Blitz';
  if (stats.standardGamesPlayed > stats.blitzGamesPlayed) return 'Standard';
  return 'Tied';
};

export const getFavoriteLetterCount = (stats: PlayerStats): string => {
  if (stats.gamesPlayed === 0) return '-';
  const counts = [
    { count: 6, games: stats.games6Letters },
    { count: 7, games: stats.games7Letters },
    { count: 8, games: stats.games8Letters },
  ];
  const favorite = counts.reduce((max, curr) => 
    curr.games > max.games ? curr : max
  );
  if (favorite.games === 0) return '-';
  return favorite.count.toString();
};

// Get next career tier to unlock
export const getNextCareerTierProgress = (lifetimeScore: number): {
  nextTier: TierName | null;
  currentScore: number;
  requiredScore: number;
  progress: number;
} | null => {
  for (const tierName of TIER_ORDER) {
    if (tierName === 'default') continue;
    
    const tier = TIERS[tierName];
    if (lifetimeScore < tier.baseThreshold) {
      return {
        nextTier: tierName,
        currentScore: lifetimeScore,
        requiredScore: tier.baseThreshold,
        progress: lifetimeScore / tier.baseThreshold,
      };
    }
  }
  
  // All tiers unlocked
  return null;
};

// Get current session streak info
export const getSessionStreakInfo = (): {
  matchesPlayed: number;
  matchesUntilNextBonus: number;
} => {
  const matchesPlayed = sessionData.matchesPlayedThisSession;
  const matchesUntilNextBonus = INK_REWARDS.STREAK_INTERVAL - (matchesPlayed % INK_REWARDS.STREAK_INTERVAL);
  
  return {
    matchesPlayed,
    matchesUntilNextBonus: matchesUntilNextBonus === INK_REWARDS.STREAK_INTERVAL ? 0 : matchesUntilNextBonus,
  };
};

// ==================== RESET FUNCTIONS ====================

export const resetStats = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
  } catch (error) {
    console.error('Error resetting stats:', error);
  }
};

export const resetTiles = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(TILES_KEY, JSON.stringify(createDefaultTiles()));
  } catch (error) {
    console.error('Error resetting tiles:', error);
  }
};

export const resetEconomy = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ECONOMY_KEY, JSON.stringify(DEFAULT_ECONOMY));
    resetSessionData();
  } catch (error) {
    console.error('Error resetting economy:', error);
  }
};

export const resetAllData = async (): Promise<void> => {
  await Promise.all([resetStats(), resetTiles(), resetEconomy()]);
};

// ==================== DEBUG FUNCTIONS ====================

export const DEBUG_UNLOCK_ALL = true; // Set to true for testing

export const unlockAllTilesForTesting = async (): Promise<void> => {
  const tiles = await loadTiles();
  
  for (const tier of TIER_ORDER) {
    if (tier === 'default') {
      tiles.tierProgress[tier].highestVariantUnlocked = 6;
    } else {
      tiles.tierProgress[tier].highestVariantUnlocked = 3;
    }
    tiles.tierProgress[tier].scoreWithTier = 1000000;
    tiles.tierProgress[tier].greatGamesWithTier = 100;
  }
  
  await saveTiles(tiles);
  console.log('DEBUG: All career tiles unlocked!');
};

export const addInkForTesting = async (amount: number): Promise<void> => {
  const economy = await loadEconomy();
  economy.ink += amount;
  economy.totalInkEarned += amount;
  await saveEconomy(economy);
  console.log(`DEBUG: Added ${amount} Ink. New balance: ${economy.ink}`);
};

export const unlockAllShopItemsForTesting = async (): Promise<void> => {
  const economy = await loadEconomy();
  
  // Import shop data to get all IDs
  const { SHOP_TILES, SHOP_BACKGROUNDS } = await import('./shopData');
  
  economy.ownedShopTiles = SHOP_TILES.map(t => t.id);
  economy.ownedBackgrounds = SHOP_BACKGROUNDS.map(b => b.id);
  
  await saveEconomy(economy);
  console.log('DEBUG: All shop items unlocked!');
};
