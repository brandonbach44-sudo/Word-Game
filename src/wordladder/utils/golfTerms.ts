// src/wordladder/utils/golfTerms.ts
//
// Golf-style scoring language for how a completed ladder compares to par
// (the shortest possible path). Since par is defined as the minimum
// possible number of steps, a player can never finish UNDER par — only
// exactly on it or over — so in practice only 'Par' and the "over par"
// terms ever actually show up. The under-par terms are still included so
// the function has sane output if that assumption ever changes.

export function getGolfTerm(steps: number, par: number): string {
  const diff = steps - par;
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double Bogey';
  if (diff === 3) return 'Triple Bogey';
  return `+${diff} Over Par`;
}
