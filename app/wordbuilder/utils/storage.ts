import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing stats
const STATS_KEY = 'wordbuilder_player_stats';

// Stats structure
export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  totalWordsFound: number;
  longestWord: string;
  // Track games per mode for favorite mode
  blitzGamesPlayed: number;
  standardGamesPlayed: number;
  // Track games per letter count for favorite letters
  games6Letters: number;
  games7Letters: number;
  games8Letters: number;
}

// Default stats for new players
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

// Load stats from storage
export const loadStats = async (): Promise<PlayerStats> => {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_STATS;
  } catch (error) {
    console.error('Error loading stats:', error);
    return DEFAULT_STATS;
  }
};

// Save stats to storage
export const saveStats = async (stats: PlayerStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

// Update stats after a game ends
export const updateStatsAfterGame = async (
  gameScore: number,
  wordsFound: string[],
  gameMode: 'blitz' | 'standard',
  letterCount: number
): Promise<void> => {
  const stats = await loadStats();
  
  // Update basic stats
  stats.gamesPlayed += 1;
  stats.totalScore += gameScore;
  stats.totalWordsFound += wordsFound.length;
  
  // Update high score if beaten
  if (gameScore > stats.highScore) {
    stats.highScore = gameScore;
  }
  
  // Update longest word if found a longer one
  const longestInGame = wordsFound.reduce((longest, word) => 
    word.length > longest.length ? word : longest
  , '');
  if (longestInGame.length > stats.longestWord.length) {
    stats.longestWord = longestInGame;
  }
  
  // Update mode tracking
  if (gameMode === 'blitz') {
    stats.blitzGamesPlayed += 1;
  } else {
    stats.standardGamesPlayed += 1;
  }
  
  // Update letter count tracking
  if (letterCount === 6) {
    stats.games6Letters += 1;
  } else if (letterCount === 7) {
    stats.games7Letters += 1;
  } else if (letterCount === 8) {
    stats.games8Letters += 1;
  }
  
  await saveStats(stats);
};

// Helper functions to calculate derived stats

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

// Reset stats (for testing or if player wants to start fresh)
export const resetStats = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
  } catch (error) {
    console.error('Error resetting stats:', error);
  }
};
