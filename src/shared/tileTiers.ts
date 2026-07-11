// src/shared/tileTiers.ts
// Shared tile/cube cosmetic tier ladder — the "Career Tiles" prestige system.
// Originally built for Word Builder, now shared across any game that renders
// individual letter tiles (Word Builder, Anagrams) so every game's cosmetic
// unlocks stay visually and structurally in sync instead of drifting apart.
//
// Each tier has two unlock layers:
//   V1 (variant 1) — unlocked once a player's tracked lifetime score crosses
//                     `baseThreshold`.
//   V2 (variant 2) — a glowing/animated upgrade unlocked once the player has
//                     earned `v2ScoreThreshold` points *while that tier is
//                     equipped* (tracked per-tier as `scoreWithTier`).
//
// Different games can (and do) key `baseThreshold`/`v2ScoreThreshold` off
// different score pools — e.g. Word Builder uses lifetime score across all
// modes, while Anagrams uses Daily-only lifetime score (a much smaller,
// slower-growing pool since Daily is capped at one attempt per day). Each
// game defines its own threshold set via `TIERS`/`DAILY_TIERS`-style export
// built from this same shape; this file is the single source of truth for
// tier *names*, *colors*, and *ordering* — not necessarily thresholds.

export type TierName = 'default' | 'classic' | 'copper' | 'bronze' | 'silver' | 'gold' | 'ruby' | 'emerald' | 'platinum' | 'diamond' | 'legendary' | 'iridescence' | 'rose_quartz';

export interface TierVariant {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  hasGlow: boolean;
}

export interface TierConfig {
  name: string;
  displayName: string;
  baseThreshold: number;      // Lifetime score to unlock base (V1)
  v2ScoreThreshold: number;   // Score while equipped to unlock V2
  variants: {
    1: TierVariant;
    2: TierVariant;
  };
}

// Tier order for timeline display
export const TIER_ORDER: TierName[] = [
  'default', 'classic', 'copper', 'bronze', 'silver', 'gold',
  'platinum', 'ruby', 'emerald', 'diamond', 'legendary', 'iridescence', 'rose_quartz'
];

// Full tier configurations — Word Builder's original thresholds (all-modes
// lifetime score economy). Games with a different/smaller score pool should
// build their own threshold map (see src/anagrams/utils/anagramsTiers.ts)
// but should reuse these same color/name definitions for visual consistency.
export const TIERS: Record<TierName, TierConfig> = {
  default: {
    name: 'default',
    displayName: 'Default',
    baseThreshold: 0,
    v2ScoreThreshold: 0,
    variants: {
      1: {
        backgroundColor: '#0f3460',
        borderColor: '#0f3460',
        textColor: '#fff',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#0f3460',
        borderColor: '#0f3460',
        textColor: '#fff',
        hasGlow: false,
      },
    }
  },
  classic: {
    name: 'classic',
    displayName: 'Classic',
    baseThreshold: 0,
    v2ScoreThreshold: 0,
    variants: {
      1: { backgroundColor: '#5B8FB9', borderColor: '#4A7A9E', textColor: '#ffffff', hasGlow: false },
      2: { backgroundColor: '#5B8FB9', borderColor: '#4A7A9E', textColor: '#ffffff', hasGlow: false },
    }
  },
  copper: {
    name: 'copper',
    displayName: 'Copper',
    baseThreshold: 5000,
    v2ScoreThreshold: 10000,
    variants: {
      1: {
        backgroundColor: '#b87333',
        borderColor: '#b87333',
        textColor: '#fff',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#b87333',
        borderColor: '#ffffff',
        textColor: '#fff',
        hasGlow: true,
      },
    }
  },
  bronze: {
    name: 'bronze',
    displayName: 'Bronze',
    baseThreshold: 25000,
    v2ScoreThreshold: 25000,
    variants: {
      1: {
        backgroundColor: '#cd7f32',
        borderColor: '#cd7f32',
        textColor: '#fff',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#cd7f32',
        borderColor: '#ffffff',
        textColor: '#fff',
        hasGlow: true,
      },
    }
  },
  silver: {
    name: 'silver',
    displayName: 'Silver',
    baseThreshold: 100000,
    v2ScoreThreshold: 50000,
    variants: {
      1: {
        backgroundColor: '#c0c0c0',
        borderColor: '#c0c0c0',
        textColor: '#1a1a2e',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#c0c0c0',
        borderColor: '#ffffff',
        textColor: '#1a1a2e',
        hasGlow: true,
      },
    }
  },
  gold: {
    name: 'gold',
    displayName: 'Gold',
    baseThreshold: 250000,
    v2ScoreThreshold: 100000,
    variants: {
      1: {
        backgroundColor: '#daa520',
        borderColor: '#daa520',
        textColor: '#1a1a2e',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#daa520',
        borderColor: '#ffffff',
        textColor: '#1a1a2e',
        hasGlow: true,
      },
    }
  },
  ruby: {
    name: 'ruby',
    displayName: 'Ruby',
    baseThreshold: 500000,
    v2ScoreThreshold: 150000,
    variants: {
      1: {
        backgroundColor: '#e0115f',
        borderColor: '#e0115f',
        textColor: '#fff',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#e0115f',
        borderColor: '#ffffff',
        textColor: '#fff',
        hasGlow: true,
      },
    }
  },
  emerald: {
    name: 'emerald',
    displayName: 'Emerald',
    baseThreshold: 1000000,
    v2ScoreThreshold: 250000,
    variants: {
      1: {
        backgroundColor: '#50c878',
        borderColor: '#50c878',
        textColor: '#1a1a2e',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#50c878',
        borderColor: '#ffffff',
        textColor: '#1a1a2e',
        hasGlow: true,
      },
    }
  },
  platinum: {
    name: 'platinum',
    displayName: 'Platinum',
    baseThreshold: 2500000,
    v2ScoreThreshold: 400000,
    variants: {
      1: {
        backgroundColor: '#e5e4e2',
        borderColor: '#e5e4e2',
        textColor: '#1a1a2e',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#e5e4e2',
        borderColor: '#ffffff',
        textColor: '#1a1a2e',
        hasGlow: true,
      },
    }
  },
  diamond: {
    name: 'diamond',
    displayName: 'Diamond',
    baseThreshold: 5000000,
    v2ScoreThreshold: 600000,
    variants: {
      1: {
        backgroundColor: '#b9f2ff',
        borderColor: '#b9f2ff',
        textColor: '#1a1a2e',
        hasGlow: false,
      },
      2: {
        backgroundColor: '#b9f2ff',
        borderColor: '#ffffff',
        textColor: '#1a1a2e',
        hasGlow: true,
      },
    }
  },
  legendary: {
    name: 'legendary',
    displayName: 'Legendary',
    baseThreshold: 10000000,
    v2ScoreThreshold: 1000000,
    variants: {
      1: {
        backgroundColor: '#ff0000', // Rainbow handled in component
        borderColor: '#ff0000',
        textColor: '#fff',
        hasGlow: true,
      },
      2: {
        backgroundColor: '#ff0000',
        borderColor: '#ffffff',
        textColor: '#fff',
        hasGlow: true,
      },
    }
  },
  iridescence: {
    name: 'iridescence',
    displayName: 'Iridescence',
    baseThreshold: 25000000,
    v2ScoreThreshold: 2000000,
    variants: {
      1: {
        backgroundColor: '#e6e6fa', // Iridescent colors handled in component
        borderColor: '#e6e6fa',
        textColor: '#1a1a2e',
        hasGlow: true,
      },
      2: {
        backgroundColor: '#e6e6fa',
        borderColor: '#ffffff',
        textColor: '#1a1a2e',
        hasGlow: true,
      },
    }
  },
  rose_quartz: {
    name: 'rose_quartz',
    displayName: 'Rose Quartz',
    baseThreshold: 30000000,
    v2ScoreThreshold: 2500000,
    variants: {
      1: {
        backgroundColor: '#f4a7c0',
        borderColor: '#f4a7c0',
        textColor: '#fff',
        hasGlow: true,
      },
      2: {
        backgroundColor: '#f4a7c0',
        borderColor: '#ffffff',
        textColor: '#fff',
        hasGlow: true,
      },
    }
  },
};

// Check if a game qualifies as a "great game" (kept for potential future use)
export const isGreatGame = (modeSeconds: number, score: number): boolean => {
  if (modeSeconds === 30) return score >= 2000;
  if (modeSeconds === 60) return score >= 4000;
  return false;
};
