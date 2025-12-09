// Tile tier definitions and configurations

export type TierName = 'default' | 'copper' | 'bronze' | 'silver' | 'gold' | 'ruby' | 'emerald' | 'platinum' | 'diamond' | 'legendary';

export interface TierVariant {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  hasGlow: boolean;
  hasShimmer: boolean;
  hasParticles: boolean;
  glowColor?: string;
}

export interface TierConfig {
  name: string;
  displayName: string;
  baseThreshold: number;      // Lifetime score to unlock base
  v2ScoreThreshold: number;   // Score while equipped to unlock V2
  v3GreatThreshold: number;   // Great games while equipped to unlock V3
  variants: {
    1: TierVariant;
    2: TierVariant;
    3: TierVariant;
  };
}

// Tier order for timeline display
export const TIER_ORDER: TierName[] = [
  'default', 'copper', 'bronze', 'silver', 'gold', 
  'platinum', 'ruby', 'emerald', 'diamond', 'legendary'
];

// Full tier configurations
export const TIERS: Record<TierName, TierConfig> = {
  default: {
    name: 'default',
    displayName: 'Default',
    baseThreshold: 0,
    v2ScoreThreshold: 0,
    v3GreatThreshold: 0,
    variants: {
      1: { 
        backgroundColor: '#0f3460', 
        borderColor: '#0f3460', 
        textColor: '#fff',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#0f3460', 
        borderColor: '#0f3460', 
        textColor: '#fff',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#0f3460', 
        borderColor: '#0f3460', 
        textColor: '#fff',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
    }
  },
  copper: {
    name: 'copper',
    displayName: 'Copper',
    baseThreshold: 5000,
    v2ScoreThreshold: 10000,
    v3GreatThreshold: 5,
    variants: {
      1: { 
        backgroundColor: '#b87333', 
        borderColor: '#b87333', 
        textColor: '#fff',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#b87333', 
        borderColor: '#ffffff', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#d4956a',
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#b87333', 
        borderColor: '#ffffff', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#d4956a',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
  bronze: {
    name: 'bronze',
    displayName: 'Bronze',
    baseThreshold: 25000,
    v2ScoreThreshold: 25000,
    v3GreatThreshold: 10,
    variants: {
      1: { 
        backgroundColor: '#cd7f32', 
        borderColor: '#cd7f32', 
        textColor: '#fff',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#cd7f32', 
        borderColor: '#ffffff', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#e8a862',
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#cd7f32', 
        borderColor: '#ffffff', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#e8a862',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
  silver: {
    name: 'silver',
    displayName: 'Silver',
    baseThreshold: 100000,
    v2ScoreThreshold: 50000,
    v3GreatThreshold: 15,
    variants: {
      1: { 
        backgroundColor: '#c0c0c0', 
        borderColor: '#c0c0c0', 
        textColor: '#1a1a2e',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#c0c0c0', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#e8e8e8',
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#c0c0c0', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#e8e8e8',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
  gold: {
    name: 'gold',
    displayName: 'Gold',
    baseThreshold: 250000,
    v2ScoreThreshold: 100000,
    v3GreatThreshold: 20,
    variants: {
      1: { 
        backgroundColor: '#daa520', 
        borderColor: '#daa520', 
        textColor: '#1a1a2e',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#daa520', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#ffd700',
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#daa520', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#ffd700',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
  ruby: {
    name: 'ruby',
    displayName: 'Ruby',
    baseThreshold: 500000,
    v2ScoreThreshold: 150000,
    v3GreatThreshold: 30,
    variants: {
      1: { 
        backgroundColor: '#e0115f', 
        borderColor: '#e0115f', 
        textColor: '#fff',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#e0115f', 
        borderColor: '#ffffff', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#ff6b9d',
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#e0115f', 
        borderColor: '#ffffff', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#ff6b9d',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
  emerald: {
    name: 'emerald',
    displayName: 'Emerald',
    baseThreshold: 1000000,
    v2ScoreThreshold: 250000,
    v3GreatThreshold: 40,
    variants: {
      1: { 
        backgroundColor: '#50c878', 
        borderColor: '#50c878', 
        textColor: '#1a1a2e',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#50c878', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#90eeb8',
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#50c878', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#90eeb8',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
  platinum: {
    name: 'platinum',
    displayName: 'Platinum',
    baseThreshold: 2500000,
    v2ScoreThreshold: 400000,
    v3GreatThreshold: 60,
    variants: {
      1: { 
        backgroundColor: '#e5e4e2', 
        borderColor: '#e5e4e2', 
        textColor: '#1a1a2e',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#e5e4e2', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#ffffff',
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#e5e4e2', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#ffffff',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
  diamond: {
    name: 'diamond',
    displayName: 'Diamond',
    baseThreshold: 5000000,
    v2ScoreThreshold: 600000,
    v3GreatThreshold: 80,
    variants: {
      1: { 
        backgroundColor: '#b9f2ff', 
        borderColor: '#b9f2ff', 
        textColor: '#1a1a2e',
        hasGlow: false, 
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#b9f2ff', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#e0f7ff',
        hasShimmer: false, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#b9f2ff', 
        borderColor: '#ffffff', 
        textColor: '#1a1a2e',
        hasGlow: true, 
        glowColor: '#e0f7ff',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
  legendary: {
    name: 'legendary',
    displayName: 'Legendary',
    baseThreshold: 10000000,
    v2ScoreThreshold: 1000000,
    v3GreatThreshold: 100,
    variants: {
      1: { 
        backgroundColor: '#ff0000', // Rainbow will be handled in component
        borderColor: '#ff0000', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#ff6b6b',
        hasShimmer: false, 
        hasParticles: false 
      },
      2: { 
        backgroundColor: '#ff0000', 
        borderColor: '#ffffff', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#ff6b6b',
        hasShimmer: true, 
        hasParticles: false 
      },
      3: { 
        backgroundColor: '#ff0000', 
        borderColor: '#ffffff', 
        textColor: '#fff',
        hasGlow: true, 
        glowColor: '#ff6b6b',
        hasShimmer: true, 
        hasParticles: true 
      },
    }
  },
};

// Check if a game qualifies as a "great game"
export const isGreatGame = (modeSeconds: number, score: number): boolean => {
  if (modeSeconds === 30) return score >= 2000;
  if (modeSeconds === 60) return score >= 4000;
  return false;
};

// Get tier emoji for display
export const getTierEmoji = (tier: TierName): string => {
  const emojis: Record<TierName, string> = {
    default: '⬜',
    copper: '🟫',
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    ruby: '❤️',
    emerald: '💚',
    platinum: '⬜',
    diamond: '💎',
    legendary: '🌈',
  };
  return emojis[tier];
};
