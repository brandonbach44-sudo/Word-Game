// src/anagrams/utils/anagramsTiers.ts
// Anagrams' cube/tile cosmetic tier thresholds.
//
// Reuses the shared tier ladder's names/colors/emoji/order (src/shared/
// tileTiers) — same exact tier list, same exact order, all the way from
// Copper up through Rose Quartz — for full visual/structural consistency
// with Word Builder's "Career Tiles." Only the point thresholds differ:
// Word Builder's economy is built on unlimited replays across every mode,
// while these tiers are keyed off **Daily Anagrams-only** lifetime score
// (one attempt per calendar day). A perfect daily run nets 6,500 points
// (5,500 from the 5 rounds + 1,000 perfect bonus), so the ladder is tuned
// against that number: early tiers (Copper–Silver) unlock within the first
// few days, and the top tier (Rose Quartz, 2,400,000) lands at roughly a
// year of consistent daily play — a full year-long engagement arc rather
// than the multi-year grind an unscaled copy of Word Builder's economy
// would require.

import { TierConfig, TierName, TIER_ORDER, TIERS as SHARED_TIER_STYLES } from '../../shared/tileTiers';

// ⚠️ DEV ONLY — unlocks every cube tier + V2 variant regardless of Daily
// lifetime score, for testing the customize screen without grinding weeks
// of Daily runs. Same pattern as DEBUG_UNLOCK_ALL_HANGMAN in
// hangman/utils/storage.ts. Must be false before App Store release.
export const DEBUG_UNLOCK_ALL_ANAGRAMS_TILES = false;

// Identical order to Word Builder's TIER_ORDER — Default, Classic, Copper,
// Bronze, Silver, Gold, Platinum, Ruby, Emerald, Diamond, Legendary,
// Iridescence, Rose Quartz — so re-exporting rather than redefining keeps
// the two games' ladders permanently in sync.
export const ANAGRAMS_TIER_ORDER: TierName[] = TIER_ORDER;

const THRESHOLDS: Partial<Record<TierName, { baseThreshold: number; v2ScoreThreshold: number }>> = {
  copper:      { baseThreshold:   10000, v2ScoreThreshold:   20000 },
  bronze:      { baseThreshold:   30000, v2ScoreThreshold:   52000 },
  silver:      { baseThreshold:   75000, v2ScoreThreshold:  125000 },
  gold:        { baseThreshold:  175000, v2ScoreThreshold:  262000 },
  platinum:    { baseThreshold:  350000, v2ScoreThreshold:  500000 },
  ruby:        { baseThreshold:  650000, v2ScoreThreshold:  875000 },
  emerald:     { baseThreshold: 1100000, v2ScoreThreshold: 1350000 },
  diamond:     { baseThreshold: 1600000, v2ScoreThreshold: 1750000 },
  legendary:   { baseThreshold: 1900000, v2ScoreThreshold: 2025000 },
  iridescence: { baseThreshold: 2150000, v2ScoreThreshold: 2275000 },
  rose_quartz: { baseThreshold: 2400000, v2ScoreThreshold: 2400000 },
};

// Same colors/variants as the shared ladder, just with Anagrams-scaled
// thresholds swapped in for every non-free tier.
export const ANAGRAMS_TIERS: Partial<Record<TierName, TierConfig>> = Object.fromEntries(
  ANAGRAMS_TIER_ORDER.map((tierName) => {
    const shared = SHARED_TIER_STYLES[tierName];
    const overrides = THRESHOLDS[tierName];
    return [
      tierName,
      overrides ? { ...shared, ...overrides } : shared,
    ];
  })
);
