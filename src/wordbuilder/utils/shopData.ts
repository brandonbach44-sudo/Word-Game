// Shop Data - Purchasable Cosmetics
// All items purchasable with Ink currency

// ==================== TYPES ====================

export interface ShopTile {
  id: string;
  name: string;
  cost: number;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  // Optional gradient for fancier tiles
  gradient?: string[];
}

export interface ShopBackground {
  id: string;
  name: string;
  cost: number;
  tier: 'classic' | 'styled' | 'prestige';
  // For solid/gradient backgrounds
  backgroundColor?: string;
  gradient?: string[];
  gradientDirection?: 'vertical' | 'horizontal' | 'diagonal';
  // For pattern/texture backgrounds
  pattern?: string;
  // For animated backgrounds (prestige)
  animated?: boolean;
  animationType?: 'starfield' | 'aurora' | 'particles' | 'caustics' | 'fireflies';
}

// ==================== PRICING ====================

export const SHOP_PRICES = {
  TILE: 250,
  BACKGROUND_CLASSIC: 100,
  BACKGROUND_STYLED: 300,
  BACKGROUND_PRESTIGE: 800,
} as const;

// ==================== SHOP TILES ====================
// Simple, clean color tiles - 250 Ink each

export const SHOP_TILES: ShopTile[] = [
  {
    id: 'tile_ocean',
    name: 'Ocean',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#0077b6',
    borderColor: '#005f8a',
    textColor: '#ffffff',
  },
  {
    id: 'tile_sunset',
    name: 'Sunset',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#f77f00',
    borderColor: '#d45500',
    textColor: '#ffffff',
  },
  {
    id: 'tile_mint',
    name: 'Mint',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#2ec4b6',
    borderColor: '#1a9a8f',
    textColor: '#ffffff',
  },
  {
    id: 'tile_lavender',
    name: 'Lavender',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#9d8cd6',
    borderColor: '#7a6bb3',
    textColor: '#ffffff',
  },
  {
    id: 'tile_slate',
    name: 'Slate',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#64748b',
    borderColor: '#475569',
    textColor: '#ffffff',
  },
  {
    id: 'tile_rose',
    name: 'Rose',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#e8a0a0',
    borderColor: '#c27878',
    textColor: '#4a2020',
  },
  {
    id: 'tile_midnight',
    name: 'Midnight',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#1e293b',
    borderColor: '#0f172a',
    textColor: '#ffffff',
  },
  {
    id: 'tile_coral',
    name: 'Coral',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#ff6b6b',
    borderColor: '#d44545',
    textColor: '#ffffff',
  },
  {
    id: 'tile_sand',
    name: 'Sand',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#d4a574',
    borderColor: '#b8895c',
    textColor: '#3d2814',
  },
  {
    id: 'tile_arctic',
    name: 'Arctic',
    cost: SHOP_PRICES.TILE,
    backgroundColor: '#e0f2fe',
    borderColor: '#b8d4e8',
    textColor: '#1e3a5f',
  },
];

// ==================== BACKGROUNDS ====================

// Classic Backgrounds - 100 Ink (Simple solid colors)
const CLASSIC_BACKGROUNDS: ShopBackground[] = [
  {
    id: 'bg_default',
    name: 'Default',
    cost: 0, // Free - comes with game
    tier: 'classic',
    backgroundColor: '#1a1a2e',
  },
  {
    id: 'bg_deep_sea',
    name: 'Deep Sea',
    cost: SHOP_PRICES.BACKGROUND_CLASSIC,
    tier: 'classic',
    backgroundColor: '#0a1628',
  },
  {
    id: 'bg_forest_floor',
    name: 'Forest Floor',
    cost: SHOP_PRICES.BACKGROUND_CLASSIC,
    tier: 'classic',
    backgroundColor: '#0d2818',
  },
  {
    id: 'bg_charcoal',
    name: 'Charcoal',
    cost: SHOP_PRICES.BACKGROUND_CLASSIC,
    tier: 'classic',
    backgroundColor: '#1a1a1a',
  },
  {
    id: 'bg_plum',
    name: 'Plum',
    cost: SHOP_PRICES.BACKGROUND_CLASSIC,
    tier: 'classic',
    backgroundColor: '#1a0a28',
  },
  {
    id: 'bg_espresso',
    name: 'Espresso',
    cost: SHOP_PRICES.BACKGROUND_CLASSIC,
    tier: 'classic',
    backgroundColor: '#1a1410',
  },
];

// Styled Backgrounds - 300 Ink (Gradients and subtle patterns)
const STYLED_BACKGROUNDS: ShopBackground[] = [
  {
    id: 'bg_nebula',
    name: 'Nebula',
    cost: SHOP_PRICES.BACKGROUND_STYLED,
    tier: 'styled',
    gradient: ['#1a0a2e', '#2d1b4e', '#1a1a3e'],
    gradientDirection: 'diagonal',
  },
  {
    id: 'bg_aurora',
    name: 'Aurora',
    cost: SHOP_PRICES.BACKGROUND_STYLED,
    tier: 'styled',
    gradient: ['#0d2818', '#1a3a2e', '#0a2830'],
    gradientDirection: 'vertical',
  },
  {
    id: 'bg_dusk',
    name: 'Dusk',
    cost: SHOP_PRICES.BACKGROUND_STYLED,
    tier: 'styled',
    gradient: ['#2d1b1b', '#1a1a2e', '#1b1b2d'],
    gradientDirection: 'vertical',
  },
  {
    id: 'bg_storm',
    name: 'Storm',
    cost: SHOP_PRICES.BACKGROUND_STYLED,
    tier: 'styled',
    gradient: ['#1a1a2a', '#2a2a3a', '#1a1a2a'],
    gradientDirection: 'vertical',
  },
  {
    id: 'bg_ember',
    name: 'Ember',
    cost: SHOP_PRICES.BACKGROUND_STYLED,
    tier: 'styled',
    gradient: ['#2d1a0a', '#3d2010', '#2d1a0a'],
    gradientDirection: 'vertical',
  },
];

// Prestige Backgrounds - 800 Ink (Animated/High-detail)
const PRESTIGE_BACKGROUNDS: ShopBackground[] = [
  {
    id: 'bg_galaxy',
    name: 'Galaxy',
    cost: SHOP_PRICES.BACKGROUND_PRESTIGE,
    tier: 'prestige',
    gradient: ['#0a0a1a', '#1a1a3a', '#0a0a1a'],
    animated: true,
    animationType: 'starfield',
  },
  {
    id: 'bg_northern_lights',
    name: 'Northern Lights',
    cost: SHOP_PRICES.BACKGROUND_PRESTIGE,
    tier: 'prestige',
    gradient: ['#0a1a1a', '#1a3a2a', '#0a2a3a'],
    animated: true,
    animationType: 'aurora',
  },
  {
    id: 'bg_cosmic_dust',
    name: 'Cosmic Dust',
    cost: SHOP_PRICES.BACKGROUND_PRESTIGE,
    tier: 'prestige',
    gradient: ['#1a0a2a', '#2a1a3a', '#1a0a2a'],
    animated: true,
    animationType: 'particles',
  },
  {
    id: 'bg_deep_ocean',
    name: 'Deep Ocean',
    cost: SHOP_PRICES.BACKGROUND_PRESTIGE,
    tier: 'prestige',
    gradient: ['#0a1828', '#102838', '#0a1828'],
    animated: true,
    animationType: 'caustics',
  },
  {
    id: 'bg_fireflies',
    name: 'Fireflies',
    cost: SHOP_PRICES.BACKGROUND_PRESTIGE,
    tier: 'prestige',
    gradient: ['#0a1a0a', '#1a2a1a', '#0a1a0a'],
    animated: true,
    animationType: 'fireflies',
  },
];

// Combined backgrounds export
export const SHOP_BACKGROUNDS: ShopBackground[] = [
  ...CLASSIC_BACKGROUNDS,
  ...STYLED_BACKGROUNDS,
  ...PRESTIGE_BACKGROUNDS,
];

// ==================== HELPER FUNCTIONS ====================

export const getShopTileById = (id: string): ShopTile | undefined => {
  return SHOP_TILES.find(tile => tile.id === id);
};

export const getBackgroundById = (id: string): ShopBackground | undefined => {
  return SHOP_BACKGROUNDS.find(bg => bg.id === id);
};

export const getBackgroundsByTier = (tier: 'classic' | 'styled' | 'prestige'): ShopBackground[] => {
  return SHOP_BACKGROUNDS.filter(bg => bg.tier === tier);
};

export const getTierDisplayName = (tier: 'classic' | 'styled' | 'prestige'): string => {
  switch (tier) {
    case 'classic': return 'Classic';
    case 'styled': return 'Styled';
    case 'prestige': return 'Prestige';
  }
};

export const getTierPrice = (tier: 'classic' | 'styled' | 'prestige'): number => {
  switch (tier) {
    case 'classic': return SHOP_PRICES.BACKGROUND_CLASSIC;
    case 'styled': return SHOP_PRICES.BACKGROUND_STYLED;
    case 'prestige': return SHOP_PRICES.BACKGROUND_PRESTIGE;
  }
};
