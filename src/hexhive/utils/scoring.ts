// src/hexhive/utils/scoring.ts
// Scoring + rank ladder for Hex Hive.
//
// Scoring rule: 4-letter words = 1 point flat. Longer words = 1 point per
// letter. A word using all 7 puzzle letters (a "pangram") earns +7 bonus on
// top of its letter-count score.
//
// Rank ladder: ranks are fixed percentages of an "effective max score" (see
// getEffectiveMaxScore below) — not the puzzle's true max score — so the
// whole ladder, Master included, sits in a reachable range for one daily
// sitting. Same shape as the reference game this genre is built on, but
// renamed to keep this project's own identity.

export function scoreWord(word: string): number {
  return word.length <= 4 ? 1 : word.length;
}

export function scoreWordForPuzzle(word: string, isPangram: boolean): number {
  return scoreWord(word) + (isPangram ? 7 : 0);
}

export interface RankDef {
  name: string;
  pct: number; // fraction of max score required to reach this rank
}

// 10-step ladder, same cadence as the genre standard (0/2/5/8/15/25/40/50/70/100%)
// but with neutral, non-branded names.
export const RANKS: RankDef[] = [
  { name: 'Beginner', pct: 0 },
  { name: 'Rising', pct: 0.02 },
  { name: 'Climbing', pct: 0.05 },
  { name: 'Solid', pct: 0.08 },
  { name: 'Skilled', pct: 0.15 },
  { name: 'Sharp', pct: 0.25 },
  { name: 'Great', pct: 0.4 },
  { name: 'Amazing', pct: 0.5 },
  { name: 'Genius', pct: 0.7 },
  { name: 'Master', pct: 1.0 },
];

export interface RankProgress {
  index: number;
  name: string;
  nextName: string | null;
  currentThreshold: number; // score needed to reach current rank
  nextThreshold: number | null; // score needed to reach next rank, null if maxed
  isMaxRank: boolean; // true once score reaches the maxScore passed in (Master, if using getEffectiveMaxScore)
}

export function getRankProgress(score: number, maxScore: number): RankProgress {
  if (maxScore <= 0) {
    return {
      index: 0,
      name: RANKS[0].name,
      nextName: RANKS[1]?.name ?? null,
      currentThreshold: 0,
      nextThreshold: null,
      isMaxRank: false,
    };
  }

  let currentIndex = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= Math.round(RANKS[i].pct * maxScore)) {
      currentIndex = i;
      break;
    }
  }

  const next = RANKS[currentIndex + 1];
  return {
    index: currentIndex,
    name: RANKS[currentIndex].name,
    nextName: next?.name ?? null,
    currentThreshold: Math.round(RANKS[currentIndex].pct * maxScore),
    nextThreshold: next ? Math.round(next.pct * maxScore) : null,
    isMaxRank: score >= maxScore,
  };
}

// Daily puzzles are "won" on reaching Master — the top of the rank ladder —
// same as the reference game. But Master is deliberately NOT defined against
// a puzzle's true max score (every valid word summed): that number is often
// 200-560+ points against this game's large dictionary, so Master would need
// ~70+ words to reach (checked empirically across all 500 curated puzzles).
// Instead, every rank (including Master) is computed against a rescaled
// "effective max score" — WIN_TARGET_PCT of the true max — so the whole
// ladder compresses into a reachable range and Master lands at a median of
// ~15 words (p10 8, p90 20), matching the reference game's daily length.
// This also means every rank below Master is actually reachable before the
// round ends, instead of Skilled/Sharp/Great/Amazing/Genius being decorative
// waypoints toward an unreachable 100%.
export const WIN_TARGET_PCT = 0.20;

export function getEffectiveMaxScore(trueMaxScore: number): number {
  return Math.max(1, Math.round(WIN_TARGET_PCT * trueMaxScore));
}
