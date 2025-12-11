import AsyncStorage from "@react-native-async-storage/async-storage";

const STATS_KEY = "wordle_stats_v1";
const DAILY_LOCK_KEY = "wordle_daily_lock_v1";

// We keep these functions intentionally loose-typed (any) so they play nicely
// with the ModeStats type defined in wordleGame.tsx without circular imports.

export async function loadWordleStats(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    console.warn("loadWordleStats error", e);
    return null;
  }
}

export async function saveWordleStats(stats: any): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn("saveWordleStats error", e);
  }
}

export async function loadDailyLock(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    console.warn("loadDailyLock error", e);
    return null;
  }
}

export async function saveDailyLock(lock: any): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_LOCK_KEY, JSON.stringify(lock));
  } catch (e) {
    console.warn("saveDailyLock error", e);
  }
}

export async function clearDailyLock(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DAILY_LOCK_KEY);
  } catch (e) {
    console.warn("clearDailyLock error", e);
  }
}
