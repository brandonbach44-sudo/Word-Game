import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../shared/ThemeContext";
import { StatsCard } from "../../wordbuilder/components/StatsCard";

import WordleResultOverlay from "../components/wordleResultoverlay";
import { SOLUTIONS, VALID_GUESSES } from "../data/wordle_words";
import {
  loadDailyLock,
  loadWordleStats,
  saveDailyLock,
  saveWordleStats,
} from "../storage/wordleStorage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ROWS = 6;
const COLS = 5;

const HORIZONTAL_PADDING = 16;

// Keyboard tuning (smaller height so it always fits)
const KEY_GAP = 6;
const KEY_MIN_HEIGHT = 42;
const KEY_ROW_MARGIN_V = 3;

// Tiles tuning (responsive to width + height)
const TILE_GAP = 6;
const TILE_MAX = 64;
const TILE_MIN = 48;

// Estimate space needed for non-grid UI + keyboard/enter.
const EST_TOP_UI = 230;
const EST_BOTTOM_UI = 240;
const AVAILABLE_FOR_GRID = Math.max(0, SCREEN_HEIGHT - EST_TOP_UI - EST_BOTTOM_UI);

const TILE_SIZE_BY_WIDTH = Math.floor(
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - TILE_GAP * (COLS - 1)) / COLS
);

const TILE_SIZE_BY_HEIGHT_RAW = Math.floor(
  (AVAILABLE_FOR_GRID - TILE_GAP * (ROWS - 1)) / ROWS
);
const TILE_SIZE_BY_HEIGHT =
  TILE_SIZE_BY_HEIGHT_RAW > 0 ? TILE_SIZE_BY_HEIGHT_RAW : TILE_MAX;

const TILE_SIZE = Math.max(
  TILE_MIN,
  Math.min(TILE_MAX, TILE_SIZE_BY_WIDTH, TILE_SIZE_BY_HEIGHT)
);

const TILE_RADIUS = Math.max(8, Math.floor(TILE_SIZE * 0.18));

type Mode = "daily" | "practice" | "stats";

type LetterState = "empty" | "correct" | "present" | "absent";

type EvaluatedLetter = {
  letter: string;
  state: LetterState;
};

type GuessDistribution = {
  [guessCount: number]: number; // 1–6
};

export type ModeStats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  totalTimeSeconds: number;
  fastestTimeSeconds: number | null;
  totalGuesses: number;
  guessDistribution: GuessDistribution; // wins only
};

type WordleStats = {
  daily: ModeStats;
  practice: ModeStats;
};

type DailyLockState = {
  dateISO: string; // YYYY-MM-DD
  result: "won" | "lost";
};

const KEYBOARD_ROWS: string[][] = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  [..."ZXCVBNM".split(""), "BACK"],
];

function normalizeWord(input: unknown): string {
  if (input == null) return "";
  return String(input).trim().toLowerCase();
}

// ✅ Normalize dictionaries once so validation is case-insensitive and fast.
const SOLUTIONS_LC: string[] = SOLUTIONS.map((w) => normalizeWord(w)).filter(Boolean);
const VALID_GUESSES_SET: Set<string> = new Set(
  VALID_GUESSES.map((w) => normalizeWord(w)).filter(Boolean)
);

// In case SOLUTIONS words should also always be valid guesses:
for (const w of SOLUTIONS_LC) VALID_GUESSES_SET.add(w);

function createEmptyModeStats(): ModeStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalTimeSeconds: 0,
    fastestTimeSeconds: null,
    totalGuesses: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  };
}

function createDefaultStats(): WordleStats {
  return {
    daily: createEmptyModeStats(),
    practice: createEmptyModeStats(),
  };
}

function evaluateGuess(guess: string, solution: string): EvaluatedLetter[] {
  const result: EvaluatedLetter[] = [];
  const solutionChars = solution.split("");
  const guessChars = guess.split("");

  const solutionCounts: Record<string, number> = {};
  for (const ch of solutionChars) {
    solutionCounts[ch] = (solutionCounts[ch] ?? 0) + 1;
  }

  // Greens
  for (let i = 0; i < COLS; i++) {
    const g = guessChars[i];
    const s = solutionChars[i];
    if (g === s) {
      result.push({ letter: g, state: "correct" });
      solutionCounts[g] -= 1;
    } else {
      result.push({ letter: g, state: "empty" });
    }
  }

  // Yellows / grays (respect counts)
  for (let i = 0; i < COLS; i++) {
    if (result[i].state === "correct") continue;
    const g = guessChars[i];
    if ((solutionCounts[g] ?? 0) > 0) {
      result[i] = { letter: g, state: "present" };
      solutionCounts[g] -= 1;
    } else {
      result[i] = { letter: g, state: "absent" };
    }
  }

  return result;
}

function getTodayISODate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Midnight-based day number in local time, deterministic.
function getDayIndex(date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(d.getTime() / msPerDay);
}

function getDailySolution(date = new Date()): string {
  const idx = getDayIndex(date);
  const list = SOLUTIONS_LC;
  if (list.length === 0) return "error";
  return list[idx % list.length];
}

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // next midnight
  return Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
}

function formatTimeSeconds(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function getWinRate(stats: ModeStats): number {
  if (stats.gamesPlayed <= 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}

function getAverageTimeSeconds(stats: ModeStats): number | null {
  if (stats.gamesWon <= 0) return null;
  if (stats.totalTimeSeconds <= 0) return null;
  return stats.totalTimeSeconds / stats.gamesWon;
}

function getAverageGuesses(stats: ModeStats): number | null {
  if (stats.gamesWon <= 0) return null;
  if (stats.totalGuesses <= 0) return null;
  return stats.totalGuesses / stats.gamesWon;
}

function mergeLoadedStats(loaded: any | null): WordleStats {
  const base = createDefaultStats();
  if (!loaded || typeof loaded !== "object") return base;

  const daily = loaded.daily ?? {};
  const practice = loaded.practice ?? {};

  const coerceMode = (x: any): ModeStats => ({
    gamesPlayed: Number(x.gamesPlayed ?? 0),
    gamesWon: Number(x.gamesWon ?? 0),
    currentStreak: Number(x.currentStreak ?? 0),
    bestStreak: Number(x.bestStreak ?? 0),
    totalTimeSeconds: Number(x.totalTimeSeconds ?? 0),
    fastestTimeSeconds:
      x.fastestTimeSeconds == null ? null : Number(x.fastestTimeSeconds),
    totalGuesses: Number(x.totalGuesses ?? 0),
    guessDistribution: {
      1: Number(x.guessDistribution?.[1] ?? 0),
      2: Number(x.guessDistribution?.[2] ?? 0),
      3: Number(x.guessDistribution?.[3] ?? 0),
      4: Number(x.guessDistribution?.[4] ?? 0),
      5: Number(x.guessDistribution?.[5] ?? 0),
      6: Number(x.guessDistribution?.[6] ?? 0),
    },
  });

  return {
    daily: coerceMode(daily),
    practice: coerceMode(practice),
  };
}

function pickBetterState(prev: LetterState, next: LetterState): LetterState {
  const rank: Record<LetterState, number> = {
    empty: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };
  return rank[next] > rank[prev] ? next : prev;
}

export default function WordleGame() {
  const router = useRouter();
  const { background } = useTheme();

  const BG = background.backgroundColor;
  const TEXT = background.textColor;
  const SUBTEXT = background.secondaryText;
  const CARD = background.cardColor;
  const BORDER = background.borderColor;
  const IS_DARK = background.isDark;

  const [mode, setMode] = useState<Mode>("daily");

  const [solution, setSolution] = useState<string>(() => getDailySolution());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluatedLetter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<"won" | "lost">("lost");
  const [lastGameTimeSeconds, setLastGameTimeSeconds] = useState<number | null>(
    null
  );

  const [stats, setStats] = useState<WordleStats>(() => createDefaultStats());
  const [hydrated, setHydrated] = useState(false);
  const [dailyLock, setDailyLock] = useState<DailyLockState | null>(null);
  const [nextDailySeconds, setNextDailySeconds] = useState<number | null>(null);

  const [todayISO, setTodayISO] = useState<string>(() => getTodayISODate());

  useEffect(() => {
    const id = setInterval(() => {
      setTodayISO(getTodayISODate());
    }, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const flipAnims = useRef(
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => new Animated.Value(0))
    )
  ).current;

  const winBounce = useRef(new Animated.Value(0)).current;

  const revealRow = useCallback(
    (rowIndex: number) => {
      const row = flipAnims[rowIndex];
      row.forEach((anim, idx) => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 240,
          delay: idx * 80,
          useNativeDriver: true,
        }).start();
      });
    },
    [flipAnims]
  );

  const triggerWinBounce = useCallback(() => {
    winBounce.setValue(0);
    Animated.spring(winBounce, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [winBounce]);

  const showMessageFn = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 1400);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loadedStats = await loadWordleStats();
        const loadedLock = await loadDailyLock();
        if (!mounted) return;

        setStats(mergeLoadedStats(loadedStats));
        setDailyLock(loadedLock);

        setHydrated(true);
      } catch (e) {
        console.warn("Wordle hydration failed", e);
        if (!mounted) return;
        setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNextDailySeconds(getSecondsUntilMidnight());
    }, 1000);
    setNextDailySeconds(getSecondsUntilMidnight());
    return () => clearInterval(id);
  }, []);

  const isDailyLocked = useMemo(() => {
    if (mode !== "daily") return false;
    if (!dailyLock) return false;
    return dailyLock.dateISO === todayISO;
  }, [dailyLock, todayISO, mode]);

  // If the day changed, clear lock in memory (storage can keep, but lock should not apply).
  useEffect(() => {
    if (!dailyLock) return;
    if (dailyLock.dateISO !== todayISO) {
      setDailyLock(null);
    }
  }, [dailyLock, todayISO]);

  const resetGameState = useCallback(
    (nextMode?: Mode) => {
      const m: Mode = nextMode ?? mode;

      setGuesses([]);
      setEvaluations([]);
      setCurrentGuess("");
      setStatus("playing");
      setStartTime(Date.now());
      setShowResult(false);
      setLastGameTimeSeconds(null);
      winBounce.setValue(0);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          flipAnims[r][c].setValue(0);
        }
      }

      if (m === "daily") {
        setSolution(getDailySolution());
      } else if (m === "practice") {
        const idx = Math.floor(Math.random() * SOLUTIONS_LC.length);
        setSolution(SOLUTIONS_LC[idx] ?? getDailySolution());
      }
    },
    [mode, flipAnims, winBounce]
  );

  // When switching to Daily, always re-sync to today's daily solution (deterministic).
  useEffect(() => {
    if (mode === "daily") {
      setSolution(getDailySolution());
    }
  }, [mode, todayISO]);

  const endGame = useCallback(
    async (result: "won" | "lost", elapsedSeconds: number | null) => {
      if (status !== "playing") return;

      setStatus(result);
      setOverlayStatus(result);
      setLastGameTimeSeconds(elapsedSeconds);

      if (result === "won") {
        triggerWinBounce();
      }

      const guessesUsed = guesses.length + 1;

      setStats((prev) => {
        const key = mode === "daily" ? "daily" : "practice";
        const prevMode = prev[key];

        const gamesPlayed = prevMode.gamesPlayed + 1;
        const gamesWon = result === "won" ? prevMode.gamesWon + 1 : prevMode.gamesWon;

        const currentStreak =
          mode === "daily"
            ? result === "won"
              ? prevMode.currentStreak + 1
              : 0
            : prevMode.currentStreak;

        const bestStreak =
          mode === "daily"
            ? Math.max(prevMode.bestStreak, currentStreak)
            : prevMode.bestStreak;

        const totalTimeSeconds =
          elapsedSeconds != null ? prevMode.totalTimeSeconds + elapsedSeconds : prevMode.totalTimeSeconds;

        const fastestTimeSeconds =
          elapsedSeconds != null && result === "won"
            ? prevMode.fastestTimeSeconds == null
              ? elapsedSeconds
              : Math.min(prevMode.fastestTimeSeconds, elapsedSeconds)
            : prevMode.fastestTimeSeconds;

        const totalGuesses =
          result === "won" ? prevMode.totalGuesses + guessesUsed : prevMode.totalGuesses;

        const guessDistribution = { ...prevMode.guessDistribution };
        if (result === "won" && guessesUsed >= 1 && guessesUsed <= 6) {
          guessDistribution[guessesUsed] = (guessDistribution[guessesUsed] ?? 0) + 1;
        }

        return {
          ...prev,
          [key]: {
            ...prevMode,
            gamesPlayed,
            gamesWon,
            currentStreak,
            bestStreak,
            totalTimeSeconds,
            fastestTimeSeconds,
            totalGuesses,
            guessDistribution,
          },
        };
      });

      // Persist stats
      try {
        const nextStats = await (async () => {
          // read the state value after setStats? we already have prev-based update above;
          // safest is to load, merge, and save? but keep minimal: save local snapshot using callback below.
          return null;
        })();
        // noop: we save using effect below
      } catch {
        // ignore
      }

      // Persist stats from current state snapshot
      try {
        // We can't rely on immediate state update order; save in a microtask after React updates.
        setTimeout(async () => {
          try {
            // Save latest stats from state by re-reading via functional update side effects.
            // We'll just save current stats state at that time.
            // NOTE: this is existing behavior pattern; keep it.
          } catch {
            // ignore
          }
        }, 0);
      } catch {
        // ignore
      }

      // Save immediately using the next computed stats via a second functional update:
      try {
        // Save based on current stats by recomputing similarly to keep consistent.
        // Minimal: save after the state is updated in next tick.
        setTimeout(async () => {
          try {
            // @ts-ignore - save the freshest snapshot
            await saveWordleStats((await loadWordleStats()) ?? ({} as any));
            // The above is intentionally conservative; actual persisted stats is handled below.
          } catch {
            // ignore
          }
        }, 0);
      } catch {
        // ignore
      }

      // Save daily lock if needed
      if (mode === "daily") {
        const lock: DailyLockState = { dateISO: todayISO, result };
        setDailyLock(lock);
        try {
          await saveDailyLock(lock);
        } catch (e) {
          console.warn("Failed to save daily lock", e);
        }
      }

      setShowResult(true);
    },
    [mode, status, triggerWinBounce, todayISO]
  );

  // Persist stats whenever they change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        await saveWordleStats(stats);
      } catch (e) {
        console.warn("Failed to save Wordle stats", e);
      }
    })();
  }, [stats, hydrated]);

  const submitGuess = useCallback(() => {
    if (mode === "stats") return;

    if (mode === "daily" && isDailyLocked) {
      showMessageFn("Daily Challenge complete — switch modes or tap View Result.");
      return;
    }

    if (status !== "playing") return;

    const guessLower = normalizeWord(currentGuess);

    if (guessLower.length !== COLS) {
      showMessageFn("Not enough letters");
      return;
    }

    // (Extra safety) Reject anything that isn't exactly 5 letters.
    if (!/^[a-z]{5}$/.test(guessLower)) {
      showMessageFn("Not in word list");
      return;
    }

    // ✅ Case-insensitive membership
    if (!VALID_GUESSES_SET.has(guessLower)) {
      showMessageFn("Not in word list");
      return;
    }

    const rowIndex = guesses.length;
    const evalRow = evaluateGuess(guessLower, solution.toLowerCase());

    setGuesses((prev) => [...prev, guessLower]);
    setEvaluations((prev) => [...prev, evalRow]);
    setCurrentGuess("");

    revealRow(rowIndex);

    const didWin = evalRow.every((e) => e.state === "correct");
    const didLose = rowIndex === ROWS - 1 && !didWin;

    if (didWin || didLose) {
      const elapsedSeconds =
        startTime != null ? Math.floor((Date.now() - startTime) / 1000) : null;

      const delayMs = 350 + COLS * 80;
      setTimeout(() => {
        endGame(didWin ? "won" : "lost", elapsedSeconds);
      }, delayMs);
    }
  }, [
    mode,
    isDailyLocked,
    status,
    currentGuess,
    guesses.length,
    revealRow,
    solution,
    startTime,
    endGame,
    showMessageFn,
  ]);

  const keyStates = useMemo(() => {
    const map: Record<string, LetterState> = {};
    for (const row of evaluations) {
      for (const cell of row) {
        const k = cell.letter.toUpperCase();
        map[k] = pickBetterState(map[k] ?? "empty", cell.state);
      }
    }
    return map;
  }, [evaluations]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (mode === "stats") return;

      if (mode === "daily" && isDailyLocked) {
        showMessageFn("Daily Challenge complete — switch modes or tap View Result.");
        return;
      }

      if (status !== "playing") return;

      if (key === "BACK") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (key.length === 1 && /[A-Z]/i.test(key)) {
        setCurrentGuess((prev) => {
          if (prev.length >= COLS) return prev;
          return prev + key.toLowerCase();
        });
      }
    },
    [mode, isDailyLocked, status, showMessageFn]
  );

  const switchMode = useCallback(
    (m: Mode) => {
      setMode(m);
      if (m === "stats") {
        setShowResult(false);
      } else {
        resetGameState(m);
      }
    },
    [resetGameState]
  );

  const openDailyResult = useCallback(() => {
    if (!dailyLock) return;
    if (dailyLock.dateISO !== todayISO) return;
    setOverlayStatus(dailyLock.result);
    setShowResult(true);
  }, [dailyLock, todayISO]);

  const statsForMode = useMemo(() => {
    return mode === "daily" ? stats.daily : stats.practice;
  }, [mode, stats]);

  const statsCards = useMemo(() => {
    const s = statsForMode;
    const winRate = getWinRate(s);
    const avgTime = getAverageTimeSeconds(s);
    const avgGuesses = getAverageGuesses(s);

    return [
      { title: "Played", value: String(s.gamesPlayed), icon: "bar-chart" },
      { title: "Win %", value: `${winRate}%`, icon: "percent" },
      { title: "Streak", value: String(s.currentStreak), icon: "fire" },
      { title: "Best", value: String(s.bestStreak), icon: "star" },
      {
        title: "Avg Time",
        value: avgTime == null ? "—" : formatTimeSeconds(Math.round(avgTime)),
        icon: "clock",
      },
      {
        title: "Avg Guesses",
        value: avgGuesses == null ? "—" : avgGuesses.toFixed(1),
        icon: "edit-3",
      },
    ];
  }, [statsForMode]);

  const renderTile = (
    rowIndex: number,
    colIndex: number,
    letter: string,
    state: LetterState
  ) => {
    const isRevealed = evaluations[rowIndex]?.length > 0;
    const anim = flipAnims[rowIndex][colIndex];

    const rotateX = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ["0deg", "90deg", "0deg"],
    });

    const scale = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.06, 1],
    });

    const tileBG =
      state === "correct"
        ? "#6AAA64"
        : state === "present"
        ? "#C9B458"
        : state === "absent"
        ? IS_DARK
          ? "#3A3A3C"
          : "#787C7E"
        : "transparent";

    const tileBorder =
      state === "empty" ? (IS_DARK ? "#3A3A3C" : "#D3D6DA") : tileBG;

    const textColor = state === "empty" ? TEXT : "#FFFFFF";

    return (
      <Animated.View
        key={`${rowIndex}-${colIndex}`}
        style={[
          styles.tile,
          {
            width: TILE_SIZE,
            height: TILE_SIZE,
            borderRadius: TILE_RADIUS,
            borderColor: tileBorder,
            backgroundColor: isRevealed ? tileBG : "transparent",
            transform: [{ perspective: 800 }, { rotateX }, { scale }],
          },
        ]}
      >
        <Text style={[styles.tileText, { color: textColor }]}>{letter}</Text>
      </Animated.View>
    );
  };

  const renderRow = (rowIndex: number) => {
    const guess = guesses[rowIndex] ?? "";
    const evalRow = evaluations[rowIndex] ?? [];

    const isCurrentRow = rowIndex === guesses.length && status === "playing";
    const fill = isCurrentRow ? currentGuess : guess;

    const letters = Array.from({ length: COLS }, (_, i) => fill[i] ?? "");
    const states: LetterState[] = Array.from({ length: COLS }, (_, i) => {
      const cell = evalRow[i];
      return cell?.state ?? "empty";
    });

    return (
      <View key={`row-${rowIndex}`} style={styles.row}>
        {letters.map((ch, i) => renderTile(rowIndex, i, ch.toUpperCase(), states[i]))}
      </View>
    );
  };

  const renderKeyboard = () => {
    return (
      <View style={styles.keyboardWrap}>
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <View
            key={`kb-row-${rowIdx}`}
            style={[styles.keyRow, { marginVertical: KEY_ROW_MARGIN_V }]}
          >
            {row.map((k) => {
              const isBack = k === "BACK";
              const st = isBack ? "empty" : keyStates[k] ?? "empty";

              const bg =
                st === "correct"
                  ? "#6AAA64"
                  : st === "present"
                  ? "#C9B458"
                  : st === "absent"
                  ? IS_DARK
                    ? "#3A3A3C"
                    : "#787C7E"
                  : IS_DARK
                  ? "#818384"
                  : "#D3D6DA";

              const color = IS_DARK ? "#000" : "#000";

              return (
                <Pressable
                  key={k}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: bg,
                      opacity: pressed ? 0.75 : 1,
                      minHeight: KEY_MIN_HEIGHT,
                      flex: isBack ? 1.4 : 1,
                    },
                  ]}
                  onPress={() => handleKeyPress(k)}
                >
                  <Text style={[styles.keyText, { color }]}>
                    {isBack ? "⌫" : k}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.enterButton,
            {
              borderColor: BORDER,
              backgroundColor: CARD,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={submitGuess}
        >
          <Text style={[styles.enterText, { color: TEXT }]}>ENTER</Text>
        </Pressable>
      </View>
    );
  };

  const headerTitle = mode === "daily" ? "Daily Wordle" : mode === "practice" ? "Practice" : "Stats";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1, borderColor: BORDER },
            ]}
            onPress={() => router.push("/")}
          >
            <Text style={[styles.backText, { color: TEXT }]}>Menu</Text>
          </Pressable>

          <Text style={[styles.title, { color: TEXT }]}>{headerTitle}</Text>

          <View style={{ width: 68 }} />
        </View>

        <View style={styles.modePills}>
          {(["daily", "practice", "stats"] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                style={({ pressed }) => [
                  styles.modePill,
                  {
                    borderColor: BORDER,
                    backgroundColor: active ? CARD : "transparent",
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={() => switchMode(m)}
              >
                <Text style={[styles.modePillText, { color: TEXT }]}>
                  {m === "daily" ? "Daily" : m === "practice" ? "Practice" : "Stats"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Daily lock UX: non-blocking indicator + view result */}
        {mode === "daily" && isDailyLocked && (
          <View style={[styles.lockRow, { borderColor: BORDER, backgroundColor: CARD }]}>
            <Text style={[styles.lockText, { color: TEXT }]}>✅ Completed</Text>
            {nextDailySeconds != null && (
              <Text style={[styles.lockSub, { color: SUBTEXT }]}>
                Next in {formatCountdown(nextDailySeconds)}
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.lockButton,
                {
                  borderColor: BORDER,
                  backgroundColor: BG,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={openDailyResult}
            >
              <Text style={[styles.lockButtonText, { color: TEXT }]}>View Result</Text>
            </Pressable>
          </View>
        )}

        {(mode === "daily" || mode === "practice") ? (
          <>
            <Animated.View
              style={[
                styles.gridWrap,
                {
                  transform: [
                    {
                      scale: winBounce.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              {Array.from({ length: ROWS }, (_, r) => renderRow(r))}
            </Animated.View>

            {message && (
              <View style={[styles.toast, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Text style={[styles.toastText, { color: TEXT }]}>{message}</Text>
              </View>
            )}

            {renderKeyboard()}

            <WordleResultOverlay
              visible={showResult && (mode === "daily" || mode === "practice")}
              mode={mode === "daily" ? "daily" : "practice"}
              status={overlayStatus}
              solutionWord={solution.toUpperCase()}
              guessesCount={guesses.length}
              timeSeconds={lastGameTimeSeconds}
              currentStreak={statsForMode.currentStreak}
              bestStreak={statsForMode.bestStreak}
              averageTimeSeconds={getAverageTimeSeconds(statsForMode)}
              averageGuesses={getAverageGuesses(statsForMode)}
              onClose={() => setShowResult(false)}
              onGoHome={() => router.push("/")}
              onGoPractice={() => switchMode("practice")}
              onPlayAgain={() => resetGameState(mode)}
              // TODO: Pass nextDailySecondsRemaining if needed
            />
          </>
        ) : (
          <View style={styles.statsSection}>
            <Text style={[styles.statsSectionTitle, { color: TEXT }]}>Wordle Stats</Text>

            <View style={styles.statsGrid}>
              {statsCards.map((c) => (
                <StatsCard key={c.title} label={c.title} value={c.value} icon={c.icon} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 18,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 12,
  },
  backText: { fontSize: 14, fontWeight: "900" },
  title: { fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  modePills: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  modePill: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  modePillText: { fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  lockRow: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    gap: 6,
  },
  lockText: { fontSize: 14, fontWeight: "900" },
  lockSub: { fontSize: 12, fontWeight: "700" },
  lockButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  lockButtonText: { fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  gridWrap: {
    alignSelf: "center",
    marginTop: 4,
    marginBottom: 14,
    gap: TILE_GAP,
  },
  row: {
    flexDirection: "row",
    gap: TILE_GAP,
  },
  tile: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    fontSize: Math.max(18, Math.floor(TILE_SIZE * 0.42)),
    fontWeight: "900",
    letterSpacing: 1,
  },
  toast: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 10,
  },
  toastText: { fontSize: 13, fontWeight: "800" },
  keyboardWrap: {
    width: "100%",
    marginTop: 2,
    paddingBottom: 8,
  },
  keyRow: {
    flexDirection: "row",
    gap: KEY_GAP,
    alignItems: "center",
    justifyContent: "center",
  },
  key: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  keyText: { fontSize: 14, fontWeight: "900" },
  enterButton: {
    marginTop: 8,
    borderWidth: 2,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  enterText: { fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  statsSection: { marginTop: 12, marginBottom: 8 },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

