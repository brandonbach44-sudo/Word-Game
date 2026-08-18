// Shared Haptic Feedback Manager
// Used across all games in the Word Games app

import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_ENABLED_KEY = 'wordgames_haptics_enabled';

class HapticManagerClass {
  private enabled: boolean = true;
  private initialized: boolean = false;

  /**
   * Initialize the haptic manager - call this on app start
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

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable haptics
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    try {
      await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.warn('HapticManager: Failed to save settings', error);
    }
  }

  /**
   * Toggle haptics on/off
   */
  async toggle(): Promise<boolean> {
    await this.setEnabled(!this.enabled);
    return this.enabled;
  }

  // ==================== HAPTIC TYPES ====================

  /**
   * Light tap - for tile selection, button taps
   */
  light(): void {
    if (!this.enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Medium tap - for confirmations, valid word found
   */
  medium(): void {
    if (!this.enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Heavy tap - for important events, game over
   */
  heavy(): void {
    if (!this.enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Success notification - for achievements, bonuses
   */
  success(): void {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Warning notification - for timer running low
   */
  warning(): void {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /**
   * Error notification - for invalid word, wrong answer
   */
  error(): void {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * Selection changed - for picker/selection feedback
   */
  selection(): void {
    if (!this.enabled) return;
    Haptics.selectionAsync();
  }

  // ==================== GAME-SPECIFIC SHORTCUTS ====================

  /**
   * Tile tapped
   */
  tap(): void {
    this.light();
  }

  /**
   * Valid word submitted
   */
  validWord(): void {
    this.medium();
  }

  /**
   * Invalid word submitted
   */
  invalidWord(): void {
    this.error();
  }

  /**
   * Game over
   */
  gameOver(): void {
    this.heavy();
  }

  /**
   * Achievement unlocked
   */
  achievement(): void {
    this.success();
  }

  /**
   * Bonus (all letters used, etc.)
   */
  bonus(): void {
    this.success();
  }

  /**
   * Timer warning (low time)
   */
  timerWarning(): void {
    this.warning();
  }

  /**
   * Streak milestone
   */
  streak(): void {
    this.success();
  }

  /**
   * Word found — primary impact scaled by length, optional combo escalation beat.
   *
   * Length scaling:   3-4 letters → light   |   5-6 → medium   |   7+ → heavy
   * Combo escalation (fires 60ms after the word thud so they're two distinct beats):
   *   level 2 → medium   |   level 3 → heavy   |   level 4+ → heavy + success at 140ms
   *
   * Pass comboLevel = 1 (default) to get plain length-scaled feedback with no combo beat.
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

  /**
   * Combo window expired — subtle selection tick, non-punishing
   */
  comboExpired(): void {
    this.selection();
  }
}

// Export singleton instance
export const HapticManager = new HapticManagerClass();
