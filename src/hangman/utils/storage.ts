import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'hangman_stats';

// ==================== INTERFACES ====================

export interface HangmanStats {
  // Overall stats
  gamesPlayed: number;
  gamesWon:  number;
  gamesLost: number;
  currentStreak: number;
  bestStreak: number;

  // Day streak tracking
  lastPlayedDate: string; // "YYYY-MM-DD"
  currentDayStreak: number;
  bestDayStreak: number;

  // Guess stats
  totalGuesses: number;
  correctGuesses: number;
  incorrectGuesses: number;

  // Word stats
  wordsGuessed:  string[]; // Track unique words guessed correctly

  // Category stats
  categoryWins: Record<string, number>; // Wins per category
  categoryPlays: Record<string, number>; // Plays per category

  // Performance
  perfectGames: number; // Games won with 0 incorrect guesses
  closeGames: number; // Games won with only 1 life remaining
}

// ==================== DEFAULT VALUES ====================

const defaultStats: HangmanStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: '',
  currentDayStreak: 0,
  bestDayStreak:  0,
  totalGuesses: 0,
  correctGuesses: 0,
  incorrectGuesses: 0,
  wordsGuessed: [],
  categoryWins: {},
  categoryPlays: {},
  perfectGames: 0,
  closeGames: 0,
};

// ==================== DATE HELPERS ====================

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today. getMonth() + 1).padStart(2, '0');
  const day = String(today. getDate()).padStart(2, '0');
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

// ==================== STATS FUNCTIONS ====================

export const loadHangmanStats = async (): Promise<HangmanStats> => {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (data) {
      return { ...defaultStats, ...JSON.parse(data) };
    }
    return defaultStats;
  } catch (error) {
    console.error('Error loading hangman stats:', error);
    return defaultStats;
  }
};

export const saveHangmanStats = async (stats: HangmanStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving hangman stats:', error);
  }
};

export const updateStatsAfterGame = async (
  won: boolean,
  word: string,
  category: string,
  correctGuesses: number,
  incorrectGuesses: number,
  remainingLives: number
): Promise<HangmanStats> => {
  const stats = await loadHangmanStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Update day streak
  if (stats.lastPlayedDate !== today) {
    // First game of the day
    if (stats.lastPlayedDate === yesterday) {
      // Played yesterday, continue streak
      stats.currentDayStreak += 1;
    } else if (stats.lastPlayedDate === '') {
      // First time ever playing
      stats.currentDayStreak = 1;
    } else {
      // Missed a day, reset streak
      stats.currentDayStreak = 1;
    }
    stats. bestDayStreak = Math.max(stats.bestDayStreak, stats.currentDayStreak);
    stats.lastPlayedDate = today;
  }

  // Update basic stats
  stats.gamesPlayed += 1;
  stats.totalGuesses += correctGuesses + incorrectGuesses;
  stats.correctGuesses += correctGuesses;
  stats. incorrectGuesses += incorrectGuesses;

  // Update category stats
  stats.categoryPlays[category] = (stats. categoryPlays[category] || 0) + 1;

  if (won) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    stats.categoryWins[category] = (stats.categoryWins[category] || 0) + 1;

    // Track unique words guessed
    if (! stats.wordsGuessed.includes(word. toLowerCase())) {
      stats.wordsGuessed.push(word.toLowerCase());
    }

    // Perfect game (no incorrect guesses)
    if (incorrectGuesses === 0) {
      stats.perfectGames += 1;
    }

    // Close game (won with 1 life remaining)
    if (remainingLives === 1) {
      stats.closeGames += 1;
    }
  } else {
    stats.gamesLost += 1;
    stats.currentStreak = 0;
  }

  await saveHangmanStats(stats);
  return stats;
};

// ==================== STATS HELPERS ====================

export const getWinRate = (stats: HangmanStats): number => {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
};

export const getGuessAccuracy = (stats: HangmanStats): number => {
  if (stats.totalGuesses === 0) return 0;
  return Math.round((stats.correctGuesses / stats.totalGuesses) * 100);
};

export const getAverageIncorrectGuesses = (stats:  HangmanStats): number => {
  if (stats.gamesPlayed === 0) return 0;
  return Math. round((stats.incorrectGuesses / stats.gamesPlayed) * 10) / 10;
};

export const getFavoriteCategory = (stats: HangmanStats): string => {
  const entries = Object.entries(stats.categoryPlays);
  if (entries.length === 0) return '-';

  const favorite = entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max));
  return favorite[0];
};

export const getBestCategory = (stats: HangmanStats): string => {
  const entries = Object.entries(stats.categoryWins);
  if (entries.length === 0) return '-';

  // Calculate win rate per category
  let bestCategory = '-';
  let bestWinRate = 0;

  for (const [category, wins] of entries) {
    const plays = stats.categoryPlays[category] || 1;
    const winRate = wins / plays;
    if (winRate > bestWinRate && plays >= 3) {
      // Minimum 3 games
      bestWinRate = winRate;
      bestCategory = category;
    }
  }

  return bestCategory;
};

export const getUniqueWordsCount = (stats: HangmanStats): number => {
  return stats.wordsGuessed.length;
};

// ==================== DEBUG FUNCTIONS ====================

export const resetHangmanStats = async (): Promise<void> => {
  await saveHangmanStats(defaultStats);
};