// src/anagrams/utils/scoring.ts
// Anagrams scoring system.
//
// Design:
// - Each of the 5 rounds has a base score that scales with its position in
//   the sequence — quadratically, not linearly, so the later/longer rounds
//   are worth dramatically more than the early ones (100/400/900/1600/2500,
//   a 25x spread from round 1 to round 5) instead of the old flat 5x ramp.
//   This also pushes single-run totals into the thousands, matching the
//   bigger numbers the other games' scoring produces.
// - A time bonus (up to +50%) rewards solving quickly, decaying linearly
//   from full bonus at <=10s to none at >=45s. Slower players still keep
//   the full base score — this only ever adds, never subtracts.
// - Each hint used on a round cuts that round's score by 25% (multiplicative,
//   so it scales fairly whether the round is worth 100 or 2,500).
// - Skipping a round scores 0 for that round but does not end the run —
//   the player continues to the next word.
// - Solving all 5 rounds with zero hints earns a flat +1,000 "Perfect Run"
//   bonus on top of the sum, mirroring the other games' "perfect" rewards.

export const ROUND_BASE_SCORES = [100, 400, 900, 1600, 2500] as const;
export const PERFECT_BONUS = 1000;

const TIME_BONUS_MAX_PCT = 0.5; // up to +50%
const TIME_BONUS_FLOOR_SECONDS = 10; // full bonus at or under this
const TIME_BONUS_CEILING_SECONDS = 45; // no bonus at or over this
const HINT_PENALTY_MULTIPLIER = 0.75; // -25% per hint, multiplicative

export interface RoundResult {
  solved: boolean;
  skipped: boolean;
  timeSeconds: number;
  hintsUsed: number;
}

export function getRoundBaseScore(roundIndex: number): number {
  return ROUND_BASE_SCORES[roundIndex] ?? ROUND_BASE_SCORES[ROUND_BASE_SCORES.length - 1];
}

function timeBonusPct(seconds: number): number {
  const range = TIME_BONUS_CEILING_SECONDS - TIME_BONUS_FLOOR_SECONDS;
  const clamped = Math.max(0, Math.min(1, (TIME_BONUS_CEILING_SECONDS - seconds) / range));
  return clamped * TIME_BONUS_MAX_PCT;
}

export function calculateRoundScore(roundIndex: number, result: RoundResult): number {
  if (!result.solved || result.skipped) return 0;
  const base = getRoundBaseScore(roundIndex);
  const bonusPct = timeBonusPct(result.timeSeconds);
  const hintMultiplier = Math.pow(HINT_PENALTY_MULTIPLIER, result.hintsUsed);
  return Math.round(base * (1 + bonusPct) * hintMultiplier);
}

export interface TotalScoreResult {
  total: number;
  roundScores: number[];
  perfectBonusApplied: boolean;
  wordsSolved: number;
}

export function calculateTotalScore(results: RoundResult[]): TotalScoreResult {
  const roundScores = results.map((r, i) => calculateRoundScore(i, r));
  const sum = roundScores.reduce((a, b) => a + b, 0);
  const wordsSolved = results.filter((r) => r.solved && !r.skipped).length;
  const allSolved = results.length > 0 && wordsSolved === results.length;
  const noHints = results.every((r) => r.hintsUsed === 0);
  const perfectBonusApplied = allSolved && noHints;

  return {
    total: sum + (perfectBonusApplied ? PERFECT_BONUS : 0),
    roundScores,
    perfectBonusApplied,
    wordsSolved,
  };
}
