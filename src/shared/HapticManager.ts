// Shared Haptic Feedback Manager
// Used across all games in Word Fury.
//
// ── How this file is organised ────────────────────────────────────────────────
// 1. Primitives   — thin wrappers over expo-haptics (light/medium/success/...).
// 2. Game vocabularies — one namespace per game (HapticManager.hangman.*, etc).
//
// Call sites should ALWAYS use a game vocabulary, never a primitive directly.
// The point is that every tuning decision lives in this file: if Hex Hive's
// rejection feedback turns out to be too strong, it's one line here rather than
// a hunt through eight screens. It also keeps each game's feel explicit and
// reviewable side by side.
//
// ── Design rules (see claude/HAPTICS_PLAN.md) ─────────────────────────────────
// • Frequency determines intensity. Anything firing more than once every few
//   seconds gets selection() — the lightest tick iOS has — or nothing.
// • success() stays rare so it keeps meaning. Each game gets ONE moment for it.
// • Rejection feedback scales inversely with how often players are wrong:
//   notable in Furdle (6 guesses), routine in Hex Hive (silent there).
// • One user action → one pulse. Multi-pulse sequences are exclusive to
//   Wordsmith, where escalating combos are the central mechanic.
// • Silence is part of the design: menus, tabs, scrolling and results get none.

import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_ENABLED_KEY = 'wordgames_haptics_enabled';

// Minimum gap between pulses. Drag gestures can fire faster than the Taptic
// Engine resolves, which turns distinct ticks into one mushy buzz. 30ms is
// below the threshold at which two taps read as separate, so this only ever
// suppresses pulses that would have been felt as noise. Wordsmith's combo
// beats are spaced 60ms/140ms apart and pass through untouched.
const MIN_PULSE_INTERVAL_MS = 30;

class HapticManagerClass {
  private enabled: boolean = true;
  private initialized: boolean = false;
  private lastPulseAt: number = 0;

  /**
   * Load the saved preference. Called once from app/_layout.tsx so it applies
   * no matter which game the player opens first.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
      this.enabled = stored !== 'false'; // Default to true
      this.initialized = true;
    } catch (error) {
      console.warn('HapticManager: Failed to load settings', error);
      this.enabled = true;
      this.initialized = true;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    try {
      await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.warn('HapticManager: Failed to save settings', error);
    }
  }

  async toggle(): Promise<boolean> {
    await this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /** Enabled + throttle gate. Every primitive goes through this. */
  private canPulse(): boolean {
    if (!this.enabled) return false;
    const now = Date.now();
    if (now - this.lastPulseAt < MIN_PULSE_INTERVAL_MS) return false;
    this.lastPulseAt = now;
    return true;
  }

  // ==================== PRIMITIVES ====================
  // Prefer a game vocabulary below over calling these directly.

  /** Light tap — tile selection, button taps. */
  light(): void {
    if (!this.canPulse()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /** Medium tap — confirmations. */
  medium(): void {
    if (!this.canPulse()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /** Heavy tap — reserve for genuinely major, infrequent events. */
  heavy(): void {
    if (!this.canPulse()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /** Success double-pulse — keep rare so it retains meaning. */
  success(): void {
    if (!this.canPulse()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /** Warning — a notable miss or a timer running out. */
  warning(): void {
    if (!this.canPulse()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /** Error triple-buzz — harsh. Justified only for a run-ending loss. */
  error(): void {
    if (!this.canPulse()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /** Selection tick — the lightest feedback iOS has (picker-wheel tick). */
  selection(): void {
    if (!this.canPulse()) return;
    Haptics.selectionAsync();
  }

  // ==================== SHARED EVENTS ====================

  /** Achievement unlocked — same across every game. */
  achievement(): void {
    this.success();
  }

  /** Daily streak milestone. */
  streak(): void {
    this.success();
  }

  // ==================== GAME VOCABULARIES ====================

  /**
   * FURDLE — deliberate loop: type five, commit, read the result.
   * Deliberately NOT a pulse per tile flip; five staggered pulses per row is
   * the "major" pattern to avoid, and it would fire 30 times a game.
   */
  readonly furdle = {
    keyPress: () => this.selection(),
    backspace: () => this.selection(),
    /** Too short / not a word — rare across 6 guesses, so worth marking. */
    invalidGuess: () => this.warning(),
    /** One pulse as the row begins revealing. */
    rowCommitted: () => this.light(),
    win: () => this.success(),
    loss: () => this.warning(),
  };

  /**
   * HANGMAN — the lowest-frequency game (~10-15 taps a session), so it can
   * carry the most character. The miss is the drama: the whole game is
   * watching the figure appear.
   */
  readonly hangman = {
    letterTap: () => this.selection(),
    correctLetter: () => this.light(),
    /** The signature moment. */
    wrongLetter: () => this.warning(),
    /**
     * Final wrong guess. The one place error() is justified in the whole app —
     * it happens at most once per game and it *is* the loss.
     */
    finalMiss: () => this.error(),
    win: () => this.success(),
  };

  /**
   * WORD LADDER — each accepted rung is a small proof of progress, and that's
   * what to reinforce.
   */
  readonly wordLadder = {
    keyPress: () => this.selection(),
    /** Valid step: a real word, exactly one letter off. */
    stepAccepted: () => this.light(),
    stepRejected: () => this.warning(),
    reachedTarget: () => this.success(),
  };

  /**
   * ANAGRAMS — tile selection is frequent, round completion is the beat.
   * success() fires once at the end of the run, not per round.
   */
  readonly anagrams = {
    tileSelect: () => this.selection(),
    tileDeselect: () => this.selection(),
    roundSolved: () => this.light(),
    wrongSubmission: () => this.warning(),
    runComplete: () => this.success(),
  };

  /**
   * WORD SEARCH — contemplative and slow. Tracing is a physical gesture, so a
   * tick as the selection crosses each NEW cell gives it texture, the same way
   * a picker wheel ticks. Call cellCrossed only on an actual cell change,
   * never per gesture frame.
   *
   * A released drag that found nothing gets nothing: it happens often, and
   * silence is the correct response.
   */
  readonly wordSearch = {
    cellCrossed: () => this.selection(),
    wordFound: () => this.light(),
    allWordsFound: () => this.success(),
    timeRunningOut: () => this.warning(),
  };

  /**
   * WORD GRID — same gesture as Word Search, deliberately the OPPOSITE
   * treatment. It's a 60-second scramble: continuous tracing would produce
   * ~100 ticks a minute in tight bursts, which crosses from tactile into
   * buzzing. So there is no cell-crossing tick here at all.
   *
   * Invalid words get a soft selection() rather than a warning, because rapid
   * guessing is the intended play pattern under time pressure.
   */
  readonly wordGrid = {
    /** Intentionally silent — see above. Kept so the call site reads clearly. */
    cellCrossed: () => {},
    wordFound: () => this.light(),
    invalidWord: () => this.selection(),
    timeRunningOut: () => this.warning(),
    roundOver: () => this.success(),
  };

  /**
   * HEX HIVE — long sessions, high tap volume, and constant rejection: the
   * median puzzle has ~105 findable words and players probe far more than
   * that. Buzzing every miss would punish the core loop, so rejection and
   * duplicates are silent. Its one strong pulse is saved for a pangram, the
   * best moment in the game.
   */
  readonly hexHive = {
    hexTap: () => this.selection(),
    wordFound: () => this.light(),
    /** Intentionally silent — probing is normal play, not a mistake. */
    invalidWord: () => {},
    /** Intentionally silent. */
    duplicateWord: () => {},
    pangram: () => this.success(),
    rankUp: () => this.light(),
  };

  // ==================== WORDSMITH (unchanged) ====================
  // Wordsmith keeps its combo escalation: multi-pulse sequences are its
  // central mechanic, and leaving it alone preserves a real identity
  // difference between games. These are the original methods, kept as-is so
  // existing call sites in app/wordbuilder/index.tsx keep working.

  /** Tile tapped. */
  tap(): void {
    this.light();
  }

  /** Valid word submitted. */
  validWord(): void {
    this.medium();
  }

  /** Invalid word submitted. */
  invalidWord(): void {
    this.error();
  }

  /** Game over. */
  gameOver(): void {
    this.heavy();
  }

  /** Bonus (all letters used, etc.) */
  bonus(): void {
    this.success();
  }

  /** Timer warning (low time). */
  timerWarning(): void {
    this.warning();
  }

  /**
   * Word found — primary impact scaled by length, optional combo escalation beat.
   *
   * Length scaling:   3-4 letters → light   |   5-6 → medium   |   7+ → heavy
   * Combo escalation (fires 60ms after the word thud so they're two distinct beats):
   *   level 2 → medium   |   level 3 → heavy   |   level 4+ → heavy + success at 140ms
   *
   * Pass comboLevel = 1 (default) to get plain length-scaled feedback with no combo beat.
   *
   * Note: this bypasses the shared throttle deliberately — the delayed beats are
   * spaced far enough apart (60ms/140ms) to be felt as distinct, and that
   * separation is the whole effect.
   */
  wordFound(length: number, comboLevel: number = 1): void {
    if (!this.enabled) return;

    // Primary: word confirmation (scaled by length)
    if (length >= 7) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (length >= 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Secondary: combo escalation beat (slight delay so the two pulses are distinct)
    if (comboLevel === 2) {
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 60);
    } else if (comboLevel === 3) {
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 60);
    } else if (comboLevel >= 4) {
      // Double pop for max combo: heavy thud + success chime
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 60);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 140);
    }
  }

  /** Combo window expired — subtle selection tick, non-punishing. */
  comboExpired(): void {
    this.selection();
  }
}

// Export singleton instance
export const HapticManager = new HapticManagerClass();
