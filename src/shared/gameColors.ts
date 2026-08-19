// src/shared/gameColors.ts
//
// The eight game accent colours, keyed by GameId, in one place.
//
// These used to live only as literals inside app/index.tsx's GAMES array. That
// was fine while the home screen was the only surface that drew a game in its
// own colour — it no longer is (the Today card segments, and now the Your Fury
// day detail), and two hand-maintained copies of a palette is exactly the kind
// of quiet drift this codebase has been paying for elsewhere. app/index.tsx
// imports from here, so a colour can only ever be changed in one place.
//
// The home tiles still own their own background/border/text shades locally,
// since those are tile-specific. Only the accent is shared.

import type { GameId } from './dailyReminders';

/** Default palette — matches the tile accents on the home screen. */
export const GAME_ACCENTS: Record<GameId, string> = {
  wordsmith: '#7F77DD',
  furdle: '#1D9E75',
  hangman: '#D85A30',
  wordgrid: '#378ADD',
  wordsearch: '#BA7517',
  wordladder: '#7A8B4E',
  hexhive: '#D4A017',
  anagrams: '#C0392B',
};

/**
 * Colourblind-safe palette (Okabe–Ito), used when colorBlindMode is on.
 * Distinguishable under all common forms of colour vision deficiency.
 */
export const COLORBLIND_GAME_ACCENTS: Record<GameId, string> = {
  wordsmith: '#D55E00', // vermillion
  furdle: '#009E73', // bluish green
  hangman: '#CC79A7', // reddish purple
  wordgrid: '#0072B2', // blue
  wordsearch: '#E69F00', // orange
  wordladder: '#56B4E9', // sky blue
  hexhive: '#E1C200', // yellow
  anagrams: '#3A3A3A', // near-black; greyscale is always safe
};

export function accentForGame(id: GameId, colorBlindMode: boolean): string {
  return colorBlindMode ? COLORBLIND_GAME_ACCENTS[id] : GAME_ACCENTS[id];
}
