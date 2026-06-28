// src/wordgrid/utils/achievements.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = 'wordgrid_achievements';

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Games played
  { id: 'games_1',   emoji: '👋', name: 'First Swipe',      description: 'Play your first Grid Rush game' },
  { id: 'games_10',  emoji: '🎮', name: 'Getting Hooked',   description: 'Play 10 games' },
  { id: 'games_50',  emoji: '🕹️', name: 'Grid Grinder',     description: 'Play 50 games' },
  { id: 'games_100', emoji: '🎯', name: 'Dedicated',        description: 'Play 100 games' },
  { id: 'games_250', emoji: '🏅', name: 'Veteran',          description: 'Play 250 games' },
  { id: 'games_500', emoji: '⭐', name: 'Grid Master',      description: 'Play 500 games' },

  // Single-game score milestones
  { id: 'score_500',   emoji: '🌱', name: 'Warming Up',   description: 'Score 500+ in one game' },
  { id: 'score_1000',  emoji: '🔥', name: 'On Fire',      description: 'Score 1,000+ in one game' },
  { id: 'score_2000',  emoji: '💯', name: 'Century Club', description: 'Score 2,000+ in one game' },
  { id: 'score_4000',  emoji: '🌟', name: 'Rising Star',  description: 'Score 4,000+ in one game' },
  { id: 'score_6000',  emoji: '👑', name: 'Word King',    description: 'Score 6,000+ in one game' },
  { id: 'score_10000', emoji: '💎', name: 'Diamond Mind', description: 'Score 10,000+ in one game' },

  // Words per game milestones
  { id: 'wpg_5',  emoji: '📝', name: 'Word Scout',   description: 'Find 5+ words in one game' },
  { id: 'wpg_10', emoji: '🔍', name: 'Word Hunter',  description: 'Find 10+ words in one game' },
  { id: 'wpg_15', emoji: '🦅', name: 'Eagle Eye',    description: 'Find 15+ words in one game' },
  { id: 'wpg_20', emoji: '🐙', name: 'Octopus',      description: 'Find 20+ words in one game' },
  { id: 'wpg_25', emoji: '🧠', name: 'Grid Genius',  description: 'Find 25+ words in one game' },

  // Word length milestones (single word in any game)
  { id: 'word_5', emoji: '📚', name: 'Wordsmith',    description: 'Find a 5-letter word' },
  { id: 'word_6', emoji: '🎓', name: 'Scholar',      description: 'Find a 6-letter word' },
  { id: 'word_7', emoji: '🔬', name: 'Linguist',     description: 'Find a 7-letter word' },
  { id: 'word_8', emoji: '🏆', name: 'Lexicographer', description: 'Find an 8+ letter word' },

  // Lifetime words found
  { id: 'total_words_50',   emoji: '🐣', name: 'Hatchling',  description: 'Find 50 total words' },
  { id: 'total_words_250',  emoji: '📖', name: 'Reader',     description: 'Find 250 total words' },
  { id: 'total_words_1000', emoji: '📚', name: 'Librarian',  description: 'Find 1,000 total words' },
  { id: 'total_words_5000', emoji: '🏛️', name: 'Archivist',  description: 'Find 5,000 total words' },

  // Lifetime score milestones
  { id: 'lifetime_10000',   emoji: '🪙',  name: 'Copper',    description: 'Reach 10,000 lifetime score' },
  { id: 'lifetime_50000',   emoji: '🥉',  name: 'Bronze',    description: 'Reach 50,000 lifetime score' },
  { id: 'lifetime_100000',  emoji: '🥈',  name: 'Silver',    description: 'Reach 100,000 lifetime score' },
  { id: 'lifetime_500000',  emoji: '🥇',  name: 'Gold',      description: 'Reach 500,000 lifetime score' },
  { id: 'lifetime_1000000', emoji: '💎',  name: 'Diamond',   description: 'Reach 1,000,000 lifetime score' },
];

// ── Storage ────────────────────────────────────────────────

interface AchievementsData {
  unlocked: { id: string; unlockedAt: string }[];
}

const empty: AchievementsData = { unlocked: [] };

async function load(): Promise<AchievementsData> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

async function save(data: AchievementsData): Promise<void> {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(data));
  } catch {
    // silent
  }
}

async function tryUnlock(
  data: AchievementsData,
  id: string
): Promise<Achievement | null> {
  if (data.unlocked.some((u) => u.id === id)) return null;
  const achievement = ACHIEVEMENTS.find((a) => a.id === id);
  if (!achievement) return null;
  data.unlocked.push({ id, unlockedAt: new Date().toISOString() });
  return achievement;
}

// ── Check after a game ────────────────────────────────────

export interface WordGridGameResult {
  score: number;
  words: { word: string; points: number }[];
  gamesPlayed: number;
  totalWordsFound: number;
  totalScore: number;
}

/** Returns all newly unlocked achievements for this game result. */
export async function checkAchievements(
  result: WordGridGameResult
): Promise<Achievement[]> {
  const data = await load();
  const newly: Achievement[] = [];

  const push = async (id: string) => {
    const a = await tryUnlock(data, id);
    if (a) newly.push(a);
  };

  // Games played
  const gp = result.gamesPlayed;
  if (gp >= 1)   await push('games_1');
  if (gp >= 10)  await push('games_10');
  if (gp >= 50)  await push('games_50');
  if (gp >= 100) await push('games_100');
  if (gp >= 250) await push('games_250');
  if (gp >= 500) await push('games_500');

  // Single-game score
  const s = result.score;
  if (s >= 500)   await push('score_500');
  if (s >= 1000)  await push('score_1000');
  if (s >= 2000)  await push('score_2000');
  if (s >= 4000)  await push('score_4000');
  if (s >= 6000)  await push('score_6000');
  if (s >= 10000) await push('score_10000');

  // Words per game
  const wc = result.words.length;
  if (wc >= 5)  await push('wpg_5');
  if (wc >= 10) await push('wpg_10');
  if (wc >= 15) await push('wpg_15');
  if (wc >= 20) await push('wpg_20');
  if (wc >= 25) await push('wpg_25');

  // Longest word this game
  const maxLen = result.words.reduce((m, w) => Math.max(m, w.word.length), 0);
  if (maxLen >= 5) await push('word_5');
  if (maxLen >= 6) await push('word_6');
  if (maxLen >= 7) await push('word_7');
  if (maxLen >= 8) await push('word_8');

  // Lifetime words
  const tw = result.totalWordsFound;
  if (tw >= 50)   await push('total_words_50');
  if (tw >= 250)  await push('total_words_250');
  if (tw >= 1000) await push('total_words_1000');
  if (tw >= 5000) await push('total_words_5000');

  // Lifetime score
  const ls = result.totalScore;
  if (ls >= 10000)   await push('lifetime_10000');
  if (ls >= 50000)   await push('lifetime_50000');
  if (ls >= 100000)  await push('lifetime_100000');
  if (ls >= 500000)  await push('lifetime_500000');
  if (ls >= 1000000) await push('lifetime_1000000');

  if (newly.length > 0) await save(data);
  return newly;
}

/** Load all unlocked achievements with metadata. */
export async function getUnlockedAchievements(): Promise<
  (Achievement & { unlockedAt: string })[]
> {
  const data = await load();
  return data.unlocked
    .map((u) => {
      const a = ACHIEVEMENTS.find((x) => x.id === u.id);
      return a ? { ...a, unlockedAt: u.unlockedAt } : null;
    })
    .filter((x): x is Achievement & { unlockedAt: string } => x !== null)
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
}
