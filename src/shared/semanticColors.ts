// src/shared/semanticColors.ts
//
// The colours that MEAN something, in one place.
//
// ── What belongs here and what doesn't ──────────────────────────────────────
// Only colour that encodes information: correct vs present vs wrong, found vs
// missed. Decoration does not belong here. A green share button is just a
// button — recolouring it in colourblind mode buys nothing and makes the app
// look arbitrary. The test for any given spot is: if you couldn't see hue here,
// would you lose information? If yes it belongs here; if no, leave it alone.
//
// The eight per-game accents are the other half of this and live in
// gameColors.ts, because those identify WHICH GAME rather than an outcome.
//
// ── Why this file exists at all ─────────────────────────────────────────────
// Hangman and Furdle each hardcoded the identical ternary inline:
//
//   const correctBg = colorBlindMode ? '#f97316' : '#22c55e';
//
// Four files carried their own copy. Wiring the remaining six games the same
// way would have meant ten hand-maintained copies of one mapping — the same
// drift that produced the Word Grid daily bug. The values below are lifted
// verbatim from what Furdle and Hangman already used, so the two games that
// worked before look exactly as they did; they simply stopped owning the
// numbers.
//
// ── Why orange/blue ─────────────────────────────────────────────────────────
// Green-versus-red is the pairing lost under deuteranopia and protanopia, which
// together account for the large majority of colour vision deficiency. Orange
// and blue stay distinct under every common form, and also differ in luminance,
// so they survive greyscale too.

import { COLORS } from './theme';
import { useTheme } from './ThemeContext';

export interface SemanticColors {
  /** A correct letter, a found word, a solved round. */
  correct: string;
  correctBorder: string;
  /** Text drawn on top of `correct`. */
  correctText: string;

  /** Right letter, wrong place — Furdle's yellow tier. */
  present: string;
  presentBorder: string;
  presentText: string;

  /** A wrong guess, a missed word, a lost game. */
  wrong: string;
  wrongBorder: string;
  wrongText: string;

  /**
   * Amber warnings (a timer running down) are unchanged: amber against the
   * app's cream and dark themes is a luminance signal as much as a hue one, and
   * it is never the thing being distinguished FROM green or red — it stands
   * alone. Kept here so callers have one import rather than two.
   */
  warning: string;

  /**
   * Won / lost at the level of a whole game, as opposed to a single letter.
   *
   * These are a separate pair from correct/wrong on purpose. Several screens
   * express an outcome with the app's own accent teal and danger pink
   * (COLORS.accent / COLORS.danger) rather than the green/red of Furdle's
   * tiles. Folding them into correct/wrong would have silently restyled
   * working screens, so the default values here are exactly the app colours
   * those screens already used -- only the colourblind branch is shared.
   */
  outcomeWon: string;
  outcomeLost: string;

  /** True when the colourblind palette is active, for shape/label fallbacks. */
  isColorBlind: boolean;
}

const DEFAULT_COLORS: SemanticColors = {
  correct: '#22c55e',
  correctBorder: '#16a34a',
  correctText: '#ffffff',

  present: '#fde047',
  presentBorder: '#facc15',
  presentText: '#1a1a1a',

  wrong: '#ef4444',
  wrongBorder: '#dc2626',
  wrongText: '#ffffff',

  warning: '#f59e0b',

  outcomeWon: COLORS.accent,
  outcomeLost: COLORS.danger,

  isColorBlind: false,
};

const COLORBLIND_COLORS: SemanticColors = {
  correct: '#f97316',
  correctBorder: '#ea580c',
  correctText: '#ffffff',

  present: '#60a5fa',
  presentBorder: '#3b82f6',
  presentText: '#ffffff',

  wrong: '#3b82f6',
  wrongBorder: '#2563eb',
  wrongText: '#ffffff',

  warning: '#f59e0b',

  outcomeWon: '#f97316',
  outcomeLost: '#3b82f6',

  isColorBlind: true,
};

/**
 * Non-hook accessor, for StyleSheet builders and anything outside a component.
 */
export function getSemanticColors(colorBlindMode: boolean): SemanticColors {
  return colorBlindMode ? COLORBLIND_COLORS : DEFAULT_COLORS;
}

/** The normal way to use this inside a component. */
export function useSemanticColors(): SemanticColors {
  const { colorBlindMode } = useTheme();
  return getSemanticColors(colorBlindMode);
}
