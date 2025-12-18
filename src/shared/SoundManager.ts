// Shared Sound Manager
// Used across all games in the Word Games app

import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = 'wordgames_sound_enabled';
const SOUND_VOLUME_KEY = 'wordgames_sound_volume';

// Sound effect types available across all games
export type SoundEffect = 
  | 'tap'           // Tile/button tap
  | 'success'       // Valid word, correct answer
  | 'error'         // Invalid word, wrong answer
  | 'submit'        // Word/answer submitted
  | 'gameOver'      // Game ends
  | 'achievement'   // Achievement unlocked
  | 'streak'        // Daily streak milestone
  | 'countdown'     // Timer warning (last 10 sec)
  | 'bonus';        // All-letters bonus, special event

// Map sound names to file paths
// Update these paths when you add your actual sound files
const SOUND_FILES: Record<SoundEffect, any> = {
  tap: null,          // require('../../../assets/sounds/tap.mp3'),
  success: null,      // require('../../../assets/sounds/success.mp3'),
  error: null,        // require('../../../assets/sounds/error.mp3'),
  submit: null,       // require('../../../assets/sounds/submit.mp3'),
  gameOver: null,     // require('../../../assets/sounds/game-over.mp3'),
  achievement: null,  // require('../../../assets/sounds/achievement.mp3'),
  streak: null,       // require('../../../assets/sounds/streak.mp3'),
  countdown: null,    // require('../../../assets/sounds/countdown.mp3'),
  bonus: null,        // require('../../../assets/sounds/bonus.mp3'),
};

class SoundManagerClass {
  private enabled: boolean = true;
  private volume: number = 1.0;
  private initialized: boolean = false;
  private sounds: Map<SoundEffect, Audio.Sound> = new Map();
  private loading: boolean = false;

  /**
   * Initialize the sound manager - call this on app start
   */
  async init(): Promise<void> {
    if (this.initialized || this.loading) return;
    this.loading = true;
    
    try {
      // Load settings
      const [storedEnabled, storedVolume] = await Promise.all([
        AsyncStorage.getItem(SOUND_ENABLED_KEY),
        AsyncStorage.getItem(SOUND_VOLUME_KEY),
      ]);
      
      this.enabled = storedEnabled !== 'false'; // Default to true
      this.volume = storedVolume ? parseFloat(storedVolume) : 1.0;
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false, // Respect silent switch
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Preload sounds
      await this.preloadSounds();
      
      this.initialized = true;
    } catch (error) {
      console.warn('SoundManager: Failed to initialize', error);
      this.enabled = true;
      this.initialized = true;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Preload all sound files for instant playback
   */
  private async preloadSounds(): Promise<void> {
    const loadPromises: Promise<void>[] = [];
    
    for (const [name, file] of Object.entries(SOUND_FILES)) {
      if (file) {
        loadPromises.push(this.loadSound(name as SoundEffect, file));
      }
    }
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Load a single sound file
   */
  private async loadSound(name: SoundEffect, file: any): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(file, {
        shouldPlay: false,
        volume: this.volume,
      });
      this.sounds.set(name, sound);
    } catch (error) {
      console.warn(`SoundManager: Failed to load sound "${name}"`, error);
    }
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable sounds
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    try {
      await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.warn('SoundManager: Failed to save settings', error);
    }
  }

  /**
   * Toggle sounds on/off
   */
  async toggle(): Promise<boolean> {
    await this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Get current volume (0.0 to 1.0)
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume on all loaded sounds
    for (const sound of this.sounds.values()) {
      try {
        await sound.setVolumeAsync(this.volume);
      } catch (error) {
        // Ignore errors for unloaded sounds
      }
    }
    
    try {
      await AsyncStorage.setItem(SOUND_VOLUME_KEY, this.volume.toString());
    } catch (error) {
      console.warn('SoundManager: Failed to save volume', error);
    }
  }

  /**
   * Play a sound effect
   */
  async play(name: SoundEffect): Promise<void> {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      // Sound not loaded (file not provided yet)
      // console.log(`SoundManager: Sound "${name}" not loaded`);
      return;
    }
    
    try {
      // Reset to beginning and play
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      console.warn(`SoundManager: Failed to play sound "${name}"`, error);
    }
  }

  /**
   * Unload all sounds (call on app close if needed)
   */
  async unload(): Promise<void> {
    for (const sound of this.sounds.values()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        // Ignore errors
      }
    }
    this.sounds.clear();
    this.initialized = false;
  }

  // ==================== CONVENIENCE METHODS ====================

  /** Tile/button tap */
  tap(): void { this.play('tap'); }

  /** Valid word found */
  success(): void { this.play('success'); }

  /** Invalid word */
  error(): void { this.play('error'); }

  /** Word submitted */
  submit(): void { this.play('submit'); }

  /** Game over */
  gameOver(): void { this.play('gameOver'); }

  /** Achievement unlocked */
  achievement(): void { this.play('achievement'); }

  /** Streak milestone */
  streak(): void { this.play('streak'); }

  /** Timer countdown warning */
  countdown(): void { this.play('countdown'); }

  /** Bonus (all letters, etc.) */
  bonus(): void { this.play('bonus'); }
}

// Export singleton instance
export const SoundManager = new SoundManagerClass();
