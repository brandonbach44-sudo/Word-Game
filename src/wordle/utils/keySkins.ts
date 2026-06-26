// Wordle keyboard skin tiers — unlocked via bestStreak (daily)

export type KeySkinName =
  | 'default'
  | 'classic'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'ruby'
  | 'emerald'
  | 'diamond'
  | 'legendary'
  | 'iridescence'
  | 'rose_quartz';

export interface KeySkinConfig {
  name: KeySkinName;
  displayName: string;
  streakRequired: number; // bestStreak needed to unlock
  // Metal tiers — gradient colors (null for gem/default tiers)
  gradient: readonly string[] | null;
  border: string;
  letterColor: string;
  // Gem tiers — use PNG image (null for metal/default)
  isGem: boolean;
  glowColor: string | null;
}

export const KEY_SKIN_ORDER: KeySkinName[] = [
  'default', 'classic', 'bronze', 'silver', 'gold', 'platinum',
  'ruby', 'emerald', 'diamond', 'legendary', 'iridescence', 'rose_quartz',
];

export const KEY_SKINS: Record<KeySkinName, KeySkinConfig> = {
  default: {
    name: 'default',
    displayName: 'Default',
    streakRequired: 0,
    gradient: null,
    border: 'transparent',
    letterColor: '#fff',
    isGem: false,
    glowColor: null,
  },
  classic: {
    name: 'classic',
    displayName: 'Classic',
    streakRequired: 0,
    gradient: null,
    border: 'transparent',
    letterColor: '#fff',
    isGem: false,
    glowColor: null,
  },
  bronze: {
    name: 'bronze',
    displayName: 'Bronze',
    streakRequired: 3,
    gradient: ['#cd7f32', '#e9c9a8', '#cd7f32', '#8b6914', '#cd7f32'],
    border: '#8b6914',
    letterColor: '#4a3410',
    isGem: false,
    glowColor: null,
  },
  silver: {
    name: 'silver',
    displayName: 'Silver',
    streakRequired: 7,
    gradient: ['#c0c0c0', '#e8e8e8', '#c0c0c0', '#8c8c8c', '#c0c0c0'],
    border: '#8c8c8c',
    letterColor: '#3a3a3a',
    isGem: false,
    glowColor: null,
  },
  gold: {
    name: 'gold',
    displayName: 'Gold',
    streakRequired: 14,
    gradient: ['#d4af37', '#f4e5a8', '#d4af37', '#aa8c2c', '#d4af37'],
    border: '#aa8c2c',
    letterColor: '#5c4813',
    isGem: false,
    glowColor: null,
  },
  platinum: {
    name: 'platinum',
    displayName: 'Platinum',
    streakRequired: 21,
    gradient: ['#b8cfe0', '#ddeeff', '#b8cfe0', '#7a9bc2', '#b8cfe0'],
    border: '#7a9bc2',
    letterColor: '#3a4a5c',
    isGem: false,
    glowColor: null,
  },
  ruby: {
    name: 'ruby',
    displayName: 'Ruby',
    streakRequired: 30,
    gradient: null,
    border: '#e0115f',
    letterColor: '#fff',
    isGem: true,
    glowColor: '#e0115f',
  },
  emerald: {
    name: 'emerald',
    displayName: 'Emerald',
    streakRequired: 50,
    gradient: null,
    border: '#50c878',
    letterColor: '#fff',
    isGem: true,
    glowColor: '#50c878',
  },
  diamond: {
    name: 'diamond',
    displayName: 'Diamond',
    streakRequired: 75,
    gradient: null,
    border: '#00bfff',
    letterColor: '#ffffff',
    isGem: true,
    glowColor: '#00bfff',
  },
  legendary: {
    name: 'legendary',
    displayName: 'Legendary',
    streakRequired: 100,
    gradient: null,
    border: '#ff0000',
    letterColor: '#fff',
    isGem: true,
    glowColor: '#ff0000',
  },
  iridescence: {
    name: 'iridescence',
    displayName: 'Iridescence',
    streakRequired: 150,
    gradient: null,
    border: '#e6e6fa',
    letterColor: '#ffffff',
    isGem: true,
    glowColor: '#e6e6fa',
  },
  rose_quartz: {
    name: 'rose_quartz',
    displayName: 'Rose Quartz',
    streakRequired: 300,
    gradient: null,
    border: '#f4a7c0',
    letterColor: '#fff',
    isGem: true,
    glowColor: '#f4a7c0',
  },
};

export function isKeySkinUnlocked(skin: KeySkinName, bestStreak: number): boolean {
  return bestStreak >= KEY_SKINS[skin].streakRequired;
}
