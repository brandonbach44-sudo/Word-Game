// src/shared/reviewPrompt.ts
//
// Shared "ask for a rating at a good moment" helper, used by every game.
// The moment we pick is winning a Daily with a streak worth feeling good
// about — not game 1, not a loss, not a random cold-open.
//
// Apple's own StoreReview API silently caps how often the native prompt can
// actually appear (roughly 3 times per 365 days per app, regardless of how
// often this function is called), so the throttling below isn't fighting
// that — it's just to avoid calling in needlessly and to spread our own
// lifetime "asks" out instead of burning them all in someone's first good
// week.

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_STATE_KEY = 'reviewPrompt_state_v1';
const MIN_DAYS_BETWEEN_PROMPTS = 90;
const MAX_LIFETIME_PROMPTS = 3;
const MIN_STREAK_TO_ASK = 3;

interface ReviewPromptState {
  timesPrompted: number;
  lastPromptedISO: string | null;
}

async function loadState(): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_STATE_KEY);
    if (!raw) return { timesPrompted: 0, lastPromptedISO: null };
    const parsed = JSON.parse(raw);
    return {
      timesPrompted: parsed.timesPrompted ?? 0,
      lastPromptedISO: parsed.lastPromptedISO ?? null,
    };
  } catch {
    return { timesPrompted: 0, lastPromptedISO: null };
  }
}

async function saveState(state: ReviewPromptState): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('reviewPrompt saveState error', e);
  }
}

/**
 * Call this right after a Daily win, passing that game's current streak.
 * Safe to call every time — it no-ops on its own unless the moment and
 * timing both check out.
 */
export async function maybeRequestReview(streak: number): Promise<void> {
  try {
    if (streak < MIN_STREAK_TO_ASK) return;

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    const state = await loadState();
    if (state.timesPrompted >= MAX_LIFETIME_PROMPTS) return;

    if (state.lastPromptedISO) {
      const daysSince = (Date.now() - new Date(state.lastPromptedISO).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;
    }

    await StoreReview.requestReview();
    await saveState({
      timesPrompted: state.timesPrompted + 1,
      lastPromptedISO: new Date().toISOString(),
    });
  } catch (e) {
    // Never let a review prompt failure affect the actual game flow.
    console.warn('maybeRequestReview error', e);
  }
}
