import AsyncStorage from "@react-native-async-storage/async-storage";

const STATS_KEY = "crossword_stats_v1";
const DAILY_LOCK_KEY = "crossword_daily_lock_v1";
const DAILY_PROGRESS_KEY = "crossword_daily_progress_v1";
const PREFS_KEY = "crossword_prefs_v1";

export type CrosswordPrefs = {
  autoCheckMistakes: boolean; // highlight wrong letters as you type
};

const DEFAULT_PREFS: CrosswordPrefs = {
  autoCheckMistakes: true,
};

export async function loadCrosswordPrefs(): Promise<CrosswordPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveCrosswordPrefs(prefs: CrosswordPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn("saveCrosswordPrefs error", e);
  }
}

// Crossword has no "lose" state the way Wordle does — a puzzle stays open
// until it's fully and correctly filled in. A completed day is always a win;
// what varies is how clean the solve was (mistakes made, hints used, time).
export type DailyLockState = {
  dateISO: string; // YYYY-MM-DD
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  shareText?: string;
  // Persisted so the completed grid can be viewed again later without
  // needing an active play session.
  filled?: string[][];
};

function isDailyLockState(value: any): value is DailyLockState {
  if (!value || typeof value !== "object") return false;
  if (typeof value.dateISO !== "string") return false;
  if (typeof value.timeSeconds !== "number") return false;
  if (typeof value.mistakes !== "number") return false;
  if (typeof value.hintsUsed !== "number") return false;
  return true;
}

export async function loadCrosswordStats(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    console.warn("loadCrosswordStats error", e);
    return null;
  }
}

export async function saveCrosswordStats(stats: any): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn("saveCrosswordStats error", e);
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

// ── Daily in-progress autosave (resume after closing the app mid-puzzle) ──
export type CrosswordDailyProgress = {
  dateISO: string; // progress from a different day is stale/ignored
  filled: string[][]; // current letter grid, "" for empty cells, "#" markers ignored
  elapsedSeconds: number;
  hintsUsed: number;
  mistakeCount: number;
};

export async function loadDailyProgress(): Promise<CrosswordDailyProgress | null> {
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

export async function saveDailyProgress(progress: CrosswordDailyProgress): Promise<void> {
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
