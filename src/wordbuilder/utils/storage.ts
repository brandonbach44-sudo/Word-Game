import AsyncStorage from '@react-native-async-storage/async-storage';
import { TIERS, TIER_ORDER, TierName } from './tiers';

// Keys for storing data
const STATS_KEY = 'wordbuilder_player_stats';
const TILES_KEY = 'wordbuilder_player_tiles';

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
  highestVariantUnlocked: number; // 0 = locked, 1 = V1, 2 = V2 (or 1-6 for default styles)
  scoreWithTier: number;          // Score earned while this tier is equipped
}

export interface PlayerTiles {
  equippedTier: TierName;
  equippedVariant: number;
  tierProgress: Record<TierName, TierProgress>;
}

const DEFAULT_TIER_PROGRESS: TierProgress = {
  highestVariantUnlocked: 0,
  scoreWithTier: 0,
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

// ==================== GAME COMPLETION ====================

// Main function called after each game ends
export const updateStatsAfterGame = async (
  gameScore: number,
  wordsFound: string[],
  gameMode: 'blitz' | 'standard',
  letterCount: number
): Promise<void> => {
  // Load all data
  const stats = await loadStats();
  const tiles = await loadTiles();
  
  // Update stats
  stats.gamesPlayed += 1;
  stats.totalScore += gameScore;
  if (gameScore > stats.highScore) {
    stats.highScore = gameScore;
  }
  stats.totalWordsFound += wordsFound.length;
  
  // Check for longest word
  const longestInGame = wordsFound.reduce((longest, word) => 
    word.length > longest.length ? word : longest, '');
  if (longestInGame.length > stats.longestWord.length) {
    stats.longestWord = longestInGame;
  }
  
  // Update mode-specific stats
  if (gameMode === 'blitz') {
    stats.blitzGamesPlayed += 1;
  } else {
    stats.standardGamesPlayed += 1;
  }
  
  // Update letter count stats
  if (letterCount === 6) stats.games6Letters += 1;
  else if (letterCount === 7) stats.games7Letters += 1;
  else if (letterCount === 8) stats.games8Letters += 1;
  
  // Save stats
  await saveStats(stats);
  
  // ========== CAREER TILE PROGRESSION ==========
  
  // 1. Check for new tier unlocks based on lifetime score
  for (const tierName of TIER_ORDER) {
    if (tierName === 'default') continue;
    
    const tier = TIERS[tierName];
    const progress = tiles.tierProgress[tierName];
    
    // Unlock V1 if threshold met
    if (progress.highestVariantUnlocked === 0 && stats.totalScore >= tier.baseThreshold) {
      progress.highestVariantUnlocked = 1;
    }
  }
  
  // 2. Update progress for currently equipped tier
  const equippedTier = tiles.equippedTier;
  if (equippedTier !== 'default') {
    const tierProgress = tiles.tierProgress[equippedTier];
    const tierConfig = TIERS[equippedTier];
    
    // Add score earned while equipped
    tierProgress.scoreWithTier += gameScore;
    
    // Check for V2 unlock
    if (tierProgress.highestVariantUnlocked === 1 && 
        tierProgress.scoreWithTier >= tierConfig.v2ScoreThreshold) {
      tierProgress.highestVariantUnlocked = 2;
    }
  }
  
  // Save tiles
  await saveTiles(tiles);
};

// ==================== EQUIP FUNCTIONS ====================

// Equip a career tile (tier + variant)
export const equipTile = async (tier: TierName, variant: number): Promise<boolean> => {
  const tiles = await loadTiles();
  
  // For default tier, all 6 styles are available
  if (tier === 'default') {
    if (variant >= 1 && variant <= 6) {
      tiles.equippedTier = tier;
      tiles.equippedVariant = variant;
      await saveTiles(tiles);
      return true;
    }
    return false;
  }
  
  // For other tiers, check if variant is unlocked (max is 2 now)
  const maxVariant = Math.min(tiles.tierProgress[tier].highestVariantUnlocked, 2);
  if (variant >= 1 && variant <= maxVariant) {
    tiles.equippedTier = tier;
    tiles.equippedVariant = variant;
    await saveTiles(tiles);
    return true;
  }
  
  return false;
};

// Legacy alias
export const equipCareerTile = equipTile;

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

export const resetAllData = async (): Promise<void> => {
  await Promise.all([resetStats(), resetTiles()]);
};

// ==================== DEBUG FUNCTIONS ====================

export const DEBUG_UNLOCK_ALL = false; // Set to true for testing

export const unlockAllTilesForTesting = async (): Promise<void> => {
  const tiles = await loadTiles();
  
  for (const tier of TIER_ORDER) {
    if (tier === 'default') {
      tiles.tierProgress[tier].highestVariantUnlocked = 6;
    } else {
      tiles.tierProgress[tier].highestVariantUnlocked = 2; // Max is now 2
    }
    tiles.tierProgress[tier].scoreWithTier = 1000000;
  }
  
  await saveTiles(tiles);
  console.log('DEBUG: All career tiles unlocked!');
};

export const setScoreForTesting = async (score: number): Promise<void> => {
  const stats = await loadStats();
  stats.totalScore = score;
  await saveStats(stats);
  console.log(`DEBUG: Total score set to ${score}`);
};
