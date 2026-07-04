import AsyncStorage from "@react-native-async-storage/async-storage";

const STATS_KEY = "wordle_stats_v1";
const DAILY_LOCK_KEY = "wordle_daily_lock_v1";
const DAILY_PROGRESS_KEY = "wordle_daily_progress_v1";
const PREFS_KEY = "wordle_prefs_v1";

export type WordlePrefs = {
  hardMode: boolean;
  colorBlindMode: boolean;
  keyShape: 'rounded' | 'square';
  keyStyle: 'filled' | 'outline';
  keySkin: string; // KeySkinName — string to avoid circular import
  keyDefaultVariant: number; // 1–6, only used when keySkin === 'default'
};

const DEFAULT_PREFS: WordlePrefs = {
  hardMode: false,
  colorBlindMode: false,
  keyShape: 'square',
  keyStyle: 'filled',
  keySkin: 'default',
  keyDefaultVariant: 1,
};

export async function loadWordlePrefs(): Promise<WordlePrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveWordlePrefs(prefs: WordlePrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn("saveWordlePrefs error", e);
  }
}

// We keep stats functions intentionally loose-typed (any) so they play nicely
// with the ModeStats type defined in wordleGame.tsx without circular imports.

export type DailyLockState = {
  dateISO: string; // YYYY-MM-DD
  result: "won" | "lost";
  // Persisted so Daily Share still works if the user reopens the app the same day.
  shareText?: string;
  // Added for stats and result overlays
  guessesCount?: number;
  timeSeconds?: number | null;
};

function isDailyLockState(value: any): value is DailyLockState {
  if (!value || typeof value !== "object") return false;
  if (typeof value.dateISO !== "string") return false;
  if (value.result !== "won" && value.result !== "lost") return false;
  if (
    typeof value.shareText !== "undefined" &&
    typeof value.shareText !== "string"
  ) {
    return false;
  }
  return true;
}

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

export async function loadDailyLock(): Promise<DailyLockState | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isDailyLockState(parsed)) return null;
    return parsed;
  } catch (e) {
    console.warn("loadDailyLock error", e);
    return null;
  }
}

export async function saveDailyLock(lock: DailyLockState): Promise<void> {
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

// ── Daily in-progress autosave (resume after closing the app mid-game) ──
// Loosely typed (any) for the same reason as the stats functions above —
// avoids a circular import with wordleGame.tsx's EvaluatedLetter type.
export type WordleDailyProgress = {
  dateISO: string; // YYYY-MM-DD — progress from a different day is stale/ignored
  guesses: string[];
  evaluations: any[][];
  currentGuess: string;
  elapsedSeconds: number;
};

export async function loadDailyProgress(): Promise<WordleDailyProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.dateISO !== "string") return null;
    return parsed;
  } catch (e) {
    console.warn("loadDailyProgress error", e);
    return null;
  }
}

export async function saveDailyProgress(progress: WordleDailyProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn("saveDailyProgress error", e);
  }
}

export async function clearDailyProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DAILY_PROGRESS_KEY);
  } catch (e) {
    console.warn("clearDailyProgress error", e);
  }
}
