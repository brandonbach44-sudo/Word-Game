// Shared theme colors and background options for all games

// Main color palette
export const COLORS = {
  // Cream/Brown palette
  cream: '#f5f0e6',
  creamDark: '#e8e0d0',
  brownDark: '#3d2e1c',
  brownMedium: '#6b5344',
  brownLight: '#8b7355',
  brownBorder: '#a08060',
  
  // Text colors
  textPrimary: '#2c2416',
  textSecondary: '#6b5c4a',
  textLight: '#ffffff',
  textMuted: '#999999',
  
  // Accent colors
  accent: '#4ecca3',
  accentDark: '#3db892',
  danger: '#e94560',
  warning: '#f59e0b',
  
  // UI colors
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

// Background option types
export type BackgroundType = 'color' | 'image';

export interface BackgroundOption {
  id: string;
  name: string;
  type: BackgroundType;
  // For solid colors
  backgroundColor?: string;
  // For images (require statement or URI)
  backgroundImage?: any;
  // Theme colors for this background
  textColor: string;
  secondaryText: string;
  cardColor: string;
  borderColor: string;
  statusBar: 'light' | 'dark';
  isDark: boolean; // Used for dark mode detection
}

// Solid color backgrounds
export const COLOR_BACKGROUNDS: BackgroundOption[] = [
  {
    id: 'cream',
    name: 'Cream',
    type: 'color',
    backgroundColor: '#f5f0e6',
    textColor: '#2c2416',
    secondaryText: '#6b5c4a',
    cardColor: '#ffffff',
    borderColor: '#8b7355',
    statusBar: 'dark',
    isDark: false,
  },
  {
    id: 'white',
    name: 'Clean White',
    type: 'color',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    secondaryText: '#666666',
    cardColor: '#f5f5f5',
    borderColor: '#dddddd',
    statusBar: 'dark',
    isDark: false,
  },
  {
    id: 'light-gray',
    name: 'Light Gray',
    type: 'color',
    backgroundColor: '#f0f2f5',
    textColor: '#1a1a2e',
    secondaryText: '#5a5a6e',
    cardColor: '#ffffff',
    borderColor: '#d0d2d5',
    statusBar: 'dark',
    isDark: false,
  },
  {
    id: 'sage',
    name: 'Sage Green',
    type: 'color',
    backgroundColor: '#e8efe8',
    textColor: '#2d3a2d',
    secondaryText: '#5a6b5a',
    cardColor: '#ffffff',
    borderColor: '#9caf9c',
    statusBar: 'dark',
    isDark: false,
  },
  {
    id: 'lavender',
    name: 'Lavender',
    type: 'color',
    backgroundColor: '#f0e6f6',
    textColor: '#2e1a3e',
    secondaryText: '#6b5a7a',
    cardColor: '#ffffff',
    borderColor: '#b89cc8',
    statusBar: 'dark',
    isDark: false,
  },
  {
    id: 'warm',
    name: 'Warm Sand',
    type: 'color',
    backgroundColor: '#f5e6d3',
    textColor: '#3d2e1c',
    secondaryText: '#7a6a58',
    cardColor: '#ffffff',
    borderColor: '#c4a882',
    statusBar: 'dark',
    isDark: false,
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    type: 'color',
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    secondaryText: '#888888',
    cardColor: '#16213e',
    borderColor: '#4ecca3',
    statusBar: 'light',
    isDark: true,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    type: 'color',
    backgroundColor: '#0d1117',
    textColor: '#e6edf3',
    secondaryText: '#7d8590',
    cardColor: '#161b22',
    borderColor: '#30363d',
    statusBar: 'light',
    isDark: true,
  },
];

// Image backgrounds - add your own here!
// To add a new image background:
// 1. Add the image to assets/backgrounds/
// 2. Add an entry here with require('../../../assets/backgrounds/yourimage.png')
export const IMAGE_BACKGROUNDS: BackgroundOption[] = [
  // Example (uncomment and modify when you add images):
  // {
  //   id: 'paper-texture',
  //   name: 'Paper Texture',
  //   type: 'image',
  //   backgroundImage: require('../../../assets/backgrounds/paper-texture.png'),
  //   textColor: '#2c2416',
  //   secondaryText: '#6b5c4a',
  //   cardColor: 'rgba(255,255,255,0.9)',
  //   borderColor: '#8b7355',
  //   statusBar: 'dark',
  //   isDark: false,
  // },
];

// Combined backgrounds (colors first, then images)
export const ALL_BACKGROUNDS: BackgroundOption[] = [
  ...COLOR_BACKGROUNDS,
  ...IMAGE_BACKGROUNDS,
];

// Get background option by ID
export const getBackgroundById = (id: string): BackgroundOption => {
  return ALL_BACKGROUNDS.find(bg => bg.id === id) || COLOR_BACKGROUNDS[0];
};

// Get dark mode version (returns first dark background)
export const getDarkModeBackground = (): BackgroundOption => {
  return COLOR_BACKGROUNDS.find(bg => bg.id === 'dark') || COLOR_BACKGROUNDS[0];
};

// Get light backgrounds only (for selection when dark mode is off)
export const getLightBackgrounds = (): BackgroundOption[] => {
  return ALL_BACKGROUNDS.filter(bg => !bg.isDark);
};

// Get dark backgrounds only
export const getDarkBackgrounds = (): BackgroundOption[] => {
  return ALL_BACKGROUNDS.filter(bg => bg.isDark);
};

// Default settings
export const DEFAULT_BACKGROUND_ID = 'cream';
export const DEFAULT_DARK_MODE = false;
export const DEFAULT_SOUND_ENABLED = true;
