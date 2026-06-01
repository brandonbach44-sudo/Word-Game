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
import type { DailyLockState } from "../storage/wordleStorage";

import { useTheme } from "../../shared/ThemeContext";

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
const KEY_MIN_HEIGHT = 54;
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

type Screen = "menu" | "game";
type MenuTab = "play" | "stats";
type GameMode = "daily" | "practice";

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



type OverlayOrigin = "game_end" | "menu_view";

type Achievement = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
};

const KEYBOARD_ROWS: string[][] = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  [..."ZXCVBNM".split(""), "BACK"],
];

// ✅ Normalize dictionaries once so validation is case-insensitive and fast.
const SOLUTIONS_LC: string[] = SOLUTIONS.map((w) => String(w).trim().toLowerCase());
const VALID_GUESSES_SET: Set<string> = new Set(
  VALID_GUESSES.map((w) => String(w).trim().toLowerCase()).filter(Boolean)
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
    if (result[i].state !== "empty") continue;
    const g = result[i].letter;
    if (solutionCounts[g] && solutionCounts[g] > 0) {
      result[i] = { letter: g, state: "present" };
      solutionCounts[g] -= 1;
    } else {
      result[i] = { letter: g, state: "absent" };
    }
  }

  return result;
}

function getDailyIndex(date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayNumber = Math.floor(date.setHours(0, 0, 0, 0) / msPerDay);
  return Math.abs(dayNumber) % SOLUTIONS_LC.length;
}

function getDailySolution(): string {
  return SOLUTIONS_LC[getDailyIndex()];
}

function getRandomPracticeSolution(): string {
  const idx = Math.floor(Math.random() * SOLUTIONS_LC.length);
  return SOLUTIONS_LC[idx];
}

function getTodayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getSecondsUntilNextMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
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

function formatTotalTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

const StatsCard = ({
  label,
  value,
  wide = false,
  textColor,
  secondaryText,
  cardColor,
  borderColor,
}: {
  label: string;
  value: string;
  wide?: boolean;
  textColor: string;
  secondaryText: string;
  cardColor: string;
  borderColor: string;
}) => {
  return (
    <View
      style={[
        styles.statsCard,
        wide && styles.statsCardWide,
        { backgroundColor: cardColor, borderColor },
      ]}
    >
      <Text style={[styles.statsValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statsLabel, { color: secondaryText }]}>{label}</Text>
    </View>
  );
};

const AchievementCard = ({
  achievement,
  textColor,
  secondaryText,
  cardColor,
  borderColor,
}: {
  achievement: Achievement;
  textColor: string;
  secondaryText: string;
  cardColor: string;
  borderColor: string;
}) => {
  const opacity = achievement.unlocked ? 1 : 0.5;
  return (
    <View
      style={[
        styles.achievementCard,
        { backgroundColor: cardColor, borderColor, opacity },
      ]}
    >
      <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
      <Text style={[styles.achievementName, { color: textColor }]}>
        {achievement.name}
      </Text>
      <Text style={[styles.achievementDesc, { color: secondaryText }]}>
        {achievement.description}
      </Text>
    </View>
  );
};

export default function WordleGame() {
  const router = useRouter();
  const { background } = useTheme();

  const BG = background.backgroundColor ?? "#f9f5ec";
  const TEXT = background.textColor ?? "#111827";
  const SUBTEXT = background.secondaryText ?? "#6b7280";
  const CARD = background.cardColor ?? "#ffffff";
  const BORDER = background.borderColor ?? "#e5e7eb";
  const IS_DARK = background.isDark ?? false;

  const [screen, setScreen] = useState<Screen>("menu");
  const [menuTab, setMenuTab] = useState<MenuTab>("play");

  const [gameMode, setGameMode] = useState<GameMode>("daily");
  const [solution, setSolution] = useState<string>(() => getDailySolution());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluatedLetter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  const [message, setMessage] = useState<string | null>(null);

  // Result overlay state (can be opened either from game end or from Play menu "View Result")
  const [showResult, setShowResult] = useState(false);
  const [overlayOrigin, setOverlayOrigin] = useState<OverlayOrigin>("game_end");
  const [overlayMode, setOverlayMode] = useState<GameMode>("daily");
  const [overlayStatus, setOverlayStatus] = useState<"won" | "lost">("lost");
  const [overlaySolutionWord, setOverlaySolutionWord] = useState<string>(() =>
    getDailySolution()
  );
  const [overlayGuessesCount, setOverlayGuessesCount] = useState<number>(0);
  const [overlayTimeSeconds, setOverlayTimeSeconds] = useState<number | null>(null);
  const [overlayShareText, setOverlayShareText] = useState<string>("");

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

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const winBounceAnim = useRef(new Animated.Value(0)).current;

  const resetFlipAnimations = useCallback(() => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        flipAnims[r][c].setValue(0);
      }
    }
  }, [flipAnims]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

  const triggerWinBounce = useCallback(() => {
    winBounceAnim.setValue(0);
    Animated.sequence([
      Animated.timing(winBounceAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(winBounceAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [winBounceAnim]);

  const showMessageFn = useCallback(
    (text: string) => {
      setMessage(text);
      triggerShake();
    },
    [triggerShake]
  );

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 1500);
    return () => clearTimeout(id);
  }, [message]);

  const revealRow = useCallback(
    (rowIndex: number) => {
      const rowAnims = flipAnims[rowIndex];
      const animations = rowAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        })
      );
      Animated.stagger(80, animations).start();
    },
    [flipAnims]
  );

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [loadedStats, loadedLock] = await Promise.all([
          loadWordleStats(),
          loadDailyLock(),
        ]);

        if (!isMounted) return;

        setStats(mergeLoadedStats(loadedStats));

        if (
          loadedLock &&
          typeof loadedLock === "object" &&
          typeof loadedLock.dateISO === "string" &&
          (loadedLock.result === "won" || loadedLock.result === "lost")
        ) {
          setDailyLock({
            dateISO: loadedLock.dateISO,
            result: loadedLock.result,
            guessesCount:
              typeof loadedLock.guessesCount === "number"
                ? loadedLock.guessesCount
                : undefined,
            timeSeconds:
              loadedLock.timeSeconds == null
                ? undefined
                : Number(loadedLock.timeSeconds),
          });
        } else {
          setDailyLock(null);
        }

        setHydrated(true);
      } catch (e) {
        console.warn("Failed to hydrate Wordle storage", e);
        setHydrated(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        await saveWordleStats(stats);
      } catch (e) {
        console.warn("Failed to save Wordle stats", e);
      }
    })();
  }, [hydrated, stats]);

  const isDailyCompletedToday = dailyLock != null && dailyLock.dateISO === todayISO;

  useEffect(() => {
    if (!isDailyCompletedToday) {
      setNextDailySeconds(null);
      return;
    }

    setNextDailySeconds(getSecondsUntilNextMidnight());
    const id = setInterval(() => {
      setNextDailySeconds(getSecondsUntilNextMidnight());
    }, 1000);

    return () => clearInterval(id);
  }, [isDailyCompletedToday]);

  const backToGames = useCallback(() => router.back(), [router]);

  const closeResult = useCallback(() => {
    setShowResult(false);
    setOverlayOrigin("game_end");
  }, []);

  const goToMenu = useCallback((tab: MenuTab = "play") => {
    setMenuTab(tab);
    setScreen("menu");
  }, []);

  const resetGameState = useCallback(
    (targetMode: GameMode) => {
      setGameMode(targetMode);

      setGuesses([]);
      setEvaluations([]);
      setCurrentGuess("");
      setStatus("playing");
      setMessage(null);
      setStartTime(Date.now());
      resetFlipAnimations();

      if (targetMode === "daily") {
        setSolution(getDailySolution());
      } else {
        setSolution(getRandomPracticeSolution());
      }
    },
    [resetFlipAnimations]
  );

  const startGame = useCallback(
    (targetMode: GameMode) => {
      // Daily is selected from the Play menu; if already completed today, we don't enter the game.
      if (targetMode === "daily" && isDailyCompletedToday) {
        showMessageFn("Daily Challenge complete — tap View Result.");
        return;
      }
      resetGameState(targetMode);
      setScreen("game");
    },
    [isDailyCompletedToday, resetGameState, showMessageFn]
  );

  const openDailyResultFromMenu = useCallback(() => {
    if (!isDailyCompletedToday) return;

    setOverlayOrigin("menu_view");
    setOverlayMode("daily");
    setOverlayStatus(dailyLock?.result ?? "lost");
    setOverlaySolutionWord(getDailySolution());
    setOverlayGuessesCount(dailyLock?.guessesCount ?? 0);
    setOverlayTimeSeconds(
      typeof dailyLock?.timeSeconds === "number" ? dailyLock.timeSeconds : null
    );
    setShowResult(true);
  }, [dailyLock, isDailyCompletedToday]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (screen !== "game") return;
      if (status !== "playing") return;

      if (gameMode === "daily" && isDailyCompletedToday) {
        showMessageFn("Daily Challenge complete — return to the Play menu.");
        return;
      }

      if (key === "BACK") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (key.length === 1 && /[A-Z]/i.test(key)) {
        setCurrentGuess((prev) => {
          if (prev.length >= COLS) return prev;
          return (prev + key.toLowerCase()).slice(0, COLS);
        });
      }
    },
    [gameMode, isDailyCompletedToday, screen, showMessageFn, status]
  );

  const endGame = useCallback(
    async (
      result: "won" | "lost",
      guessesUsed: number,
      elapsedSeconds: number | null
    ) => {
      if (status !== "playing") return;

      setStatus(result);

      if (result === "won") triggerWinBounce();

      // Update overlay payload first (so it can be opened later even if we jump back to menu)
      setOverlayOrigin("game_end");
      setOverlayMode(gameMode);
      setOverlayStatus(result);
      setOverlaySolutionWord(solution);
      setOverlayGuessesCount(guessesUsed);
      setOverlayTimeSeconds(elapsedSeconds);

      // Build share text
      const emojiRows = evaluations.map((row) =>
        row.map((cell) =>
          cell.state === "correct" ? "🟩" : cell.state === "present" ? "🟨" : "⬜"
        ).join("")
      );
      const timeStr = elapsedSeconds != null ? ` • ${formatSeconds(elapsedSeconds)}` : "";
      const modeStr = gameMode === "daily" ? "Wordle Daily" : "Wordle Practice";
      const resultStr = result === "won" ? `${guessesUsed}/6` : "X/6";
      const shareText = `${modeStr} ${resultStr}${timeStr}\n\n${emojiRows.join("\n")}`;
      setOverlayShareText(shareText);

      setStats((prev) => {
        const key = gameMode === "daily" ? "daily" : "practice";
        const prevMode = prev[key];

        const gamesPlayed = prevMode.gamesPlayed + 1;
        const gamesWon = result === "won" ? prevMode.gamesWon + 1 : prevMode.gamesWon;

        // For streak to continue, the last daily must have been played yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
        const playedYesterday = dailyLock?.dateISO === yesterdayISO;

        const currentStreak =
          gameMode === "daily"
            ? result === "won"
              ? (prevMode.currentStreak === 0 || playedYesterday ? prevMode.currentStreak + 1 : 1)
              : 0
            : prevMode.currentStreak;

        const bestStreak =
          gameMode === "daily"
            ? Math.max(prevMode.bestStreak, currentStreak)
            : prevMode.bestStreak;

        const totalTimeSeconds =
          elapsedSeconds != null
            ? prevMode.totalTimeSeconds + elapsedSeconds
            : prevMode.totalTimeSeconds;

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

      if (gameMode === "daily") {
        const lock: DailyLockState = {
          dateISO: todayISO,
          result,
          guessesCount: guessesUsed,
          timeSeconds: elapsedSeconds,
        };
        setDailyLock(lock);
        try {
          await saveDailyLock(lock);
        } catch (e) {
          console.warn("Failed to save daily lock", e);
        }
      }

      setShowResult(true);
    },
    [gameMode, solution, status, todayISO, triggerWinBounce]
  );

  const submitGuess = useCallback(() => {
    if (screen !== "game") return;
    if (status !== "playing") return;

    if (gameMode === "daily" && isDailyCompletedToday) {
      showMessageFn("Daily Challenge complete — return to the Play menu.");
      return;
    }

    if (currentGuess.length < COLS) {
      showMessageFn("Not enough letters");
      return;
    }

    const guessLower = currentGuess.toLowerCase();

    // ✅ Case-insensitive membership (fixes sally/SALLY mismatches)
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
        endGame(didWin ? "won" : "lost", rowIndex + 1, elapsedSeconds);
      }, delayMs);
    }
  }, [
    currentGuess,
    endGame,
    gameMode,
    guesses.length,
    isDailyCompletedToday,
    revealRow,
    screen,
    showMessageFn,
    solution,
    startTime,
    status,
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

  const gridShakeX = shakeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const statusScale = winBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const renderTile = (rowIndex: number, colIndex: number) => {
    const guess = guesses[rowIndex];
    const letter =
      guess?.[colIndex] ??
      (rowIndex === guesses.length ? currentGuess[colIndex] ?? "" : "");

    const hasEvaluation =
      !!(evaluations[rowIndex] && evaluations[rowIndex][colIndex]);

    const evaluatedState: LetterState = hasEvaluation
      ? evaluations[rowIndex][colIndex].state
      : "empty";

    const anim = flipAnims[rowIndex][colIndex];

    const frontRotateX = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ["0deg", "90deg", "90deg"],
    });

    const backRotateX = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ["-90deg", "-90deg", "0deg"],
    });

    const frontBg = letter ? CARD : "transparent";
    const frontBorder = BORDER;
    const frontText = TEXT;

    let backBg = CARD;
    let backBorder = BORDER;
    let backText = TEXT;

    if (hasEvaluation) {
      if (evaluatedState === "correct") {
        backBg = "#22c55e";
        backBorder = "#16a34a";
        backText = "#f9fafb";
      } else if (evaluatedState === "present") {
        backBg = "#fde047";
        backBorder = "#facc15";
        backText = "#1a1a1a";
      } else if (evaluatedState === "absent") {
        backBg = "#9ca3af";
        backBorder = "#6b7280";
        backText = "#111827";
      }
    }

    return (
      <View
        key={`${rowIndex}-${colIndex}`}
        style={[
          styles.tileContainer,
          {
            width: TILE_SIZE,
            height: TILE_SIZE,
            marginHorizontal: TILE_GAP / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.tileFace,
            {
              borderRadius: TILE_RADIUS,
              backgroundColor: frontBg,
              borderColor: frontBorder,
              transform: [{ perspective: 900 }, { rotateX: frontRotateX }],
            },
          ]}
        >
          <Text style={[styles.tileText, { color: frontText }]}>
            {letter ? letter.toUpperCase() : ""}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.tileFace,
            {
              borderRadius: TILE_RADIUS,
              backgroundColor: backBg,
              borderColor: backBorder,
              transform: [{ perspective: 900 }, { rotateX: backRotateX }],
            },
          ]}
        >
          <Text style={[styles.tileText, { color: backText }]}>
            {letter ? letter.toUpperCase() : ""}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderKeyboardRow = (row: string[], rowIndex: number) => {
    const weights = row.map((k) => (k === "BACK" ? 1.6 : 1));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const availableWidth =
      SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - KEY_GAP * (row.length - 1);

    const unit = availableWidth / totalWeight;

    return (
      <View key={`kb-row-${rowIndex}`} style={styles.keyRow}>
        {row.map((k, idx) => {
          const state = keyStates[k.toUpperCase()] ?? "empty";

          let backgroundColor = CARD;
          let borderColor = BORDER;
          let textColor = TEXT;

          if (state === "correct") {
            backgroundColor = "#22c55e";
            borderColor = "#16a34a";
            textColor = "#f9fafb";
          } else if (state === "present") {
            backgroundColor = "#fde047";
            borderColor = "#facc15";
            textColor = "#1a1a1a";
          } else if (state === "absent") {
            backgroundColor = "#9ca3af";
            borderColor = "#6b7280";
            textColor = "#111827";
          } else if (IS_DARK) {
            backgroundColor = "#1f2937";
            borderColor = "#374151";
            textColor = "#f9fafb";
          }

          const width = unit * weights[idx];

          return (
            <Pressable
              key={`${k}-${rowIndex}`}
              onPress={() => handleKeyPress(k)}
              style={({ pressed }) => [
                styles.key,
                {
                  width,
                  marginHorizontal: KEY_GAP / 2,
                  backgroundColor: pressed ? (backgroundColor === "#fde047" ? "#fbbf24" : backgroundColor) : backgroundColor,
                  borderColor,
                  transform: [{ scale: pressed ? 0.88 : 1 }],
                },
              ]}
            >
              <Text style={[styles.keyText, { color: textColor }]}>
                {k === "BACK" ? "⌫" : k}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  // ======= STATS + ACHIEVEMENTS (Menu -> Stats tab) =======
  const winRateDaily = useMemo(() => getWinRate(stats.daily), [stats.daily]);
  const winRatePractice = useMemo(
    () => getWinRate(stats.practice),
    [stats.practice]
  );

  const avgTimeDaily = useMemo(
    () => getAverageTimeSeconds(stats.daily),
    [stats.daily]
  );
  const avgTimePractice = useMemo(
    () => getAverageTimeSeconds(stats.practice),
    [stats.practice]
  );

  const avgGuessesDaily = useMemo(
    () => getAverageGuesses(stats.daily),
    [stats.daily]
  );
  const avgGuessesPractice = useMemo(
    () => getAverageGuesses(stats.practice),
    [stats.practice]
  );

  const lifetimeGames = stats.daily.gamesPlayed + stats.practice.gamesPlayed;
  const lifetimeWins = stats.daily.gamesWon + stats.practice.gamesWon;
  const lifetimeWinRate =
    lifetimeGames > 0 ? Math.round((lifetimeWins / lifetimeGames) * 100) : 0;
  const lifetimeTime = stats.daily.totalTimeSeconds + stats.practice.totalTimeSeconds;
  const lifetimeGuesses = stats.daily.totalGuesses + stats.practice.totalGuesses;
  const lifetimePerfect =
    (stats.daily.guessDistribution?.[1] ?? 0) +
    (stats.practice.guessDistribution?.[1] ?? 0);

  const achievements: Achievement[] = useMemo(() => {
    const dailyWins = stats.daily.gamesWon;
    const practiceWins = stats.practice.gamesWon;
    const totalWins = dailyWins + practiceWins;

    const bestStreak = stats.daily.bestStreak;
    const perfectWins = lifetimePerfect;

    const fastestAny =
      stats.daily.fastestTimeSeconds == null
        ? stats.practice.fastestTimeSeconds
        : stats.practice.fastestTimeSeconds == null
        ? stats.daily.fastestTimeSeconds
        : Math.min(stats.daily.fastestTimeSeconds, stats.practice.fastestTimeSeconds);

    const twoGuessWins =
      (stats.daily.guessDistribution?.[2] ?? 0) +
      (stats.practice.guessDistribution?.[2] ?? 0);

    return [
      { id: "first_win", emoji: "✅", name: "First Win", description: "Win your first game", unlocked: totalWins >= 1 },
      { id: "daily_win", emoji: "📅", name: "Daily Solver", description: "Win a Daily Challenge", unlocked: dailyWins >= 1 },
      { id: "practice_win", emoji: "🎯", name: "Practice Pays", description: "Win a Practice game", unlocked: practiceWins >= 1 },
      { id: "perfect", emoji: "⚡", name: "One & Done", description: "Solve in 1 guess", unlocked: perfectWins >= 1 },
      { id: "two_try", emoji: "🎉", name: "Two Tries", description: "Get 5 wins in 2 guesses", unlocked: twoGuessWins >= 5 },
      { id: "streak_7", emoji: "🔥", name: "Hot Streak", description: "Reach a 7-day best streak", unlocked: bestStreak >= 7 },
      { id: "streak_14", emoji: "🌶️", name: "Spicy", description: "Reach a 14-day best streak", unlocked: bestStreak >= 14 },
      { id: "streak_30", emoji: "🏆", name: "Champion", description: "Reach a 30-day best streak", unlocked: bestStreak >= 30 },
      { id: "speed_60", emoji: "⏱️", name: "Quick Thinker", description: "Win in under 60 seconds", unlocked: fastestAny != null && fastestAny <= 60 },
      { id: "speed_30", emoji: "⚡", name: "Lightning", description: "Win in under 30 seconds", unlocked: fastestAny != null && fastestAny <= 30 },
      { id: "play_25", emoji: "🧩", name: "Word Worker", description: "Play 25 games", unlocked: lifetimeGames >= 25 },
      { id: "play_100", emoji: "💯", name: "Century Club", description: "Play 100 games", unlocked: lifetimeGames >= 100 },
      { id: "wins_25", emoji: "🥇", name: "Winner", description: "Win 25 games", unlocked: totalWins >= 25 },
      { id: "wins_50", emoji: "🏅", name: "Win Streaker", description: "Win 50 games", unlocked: totalWins >= 50 },
    ];
  }, [lifetimeGames, lifetimePerfect, stats.daily, stats.practice]);

  // ======= PLAY MENU helpers =======
  const dailySummaryText = useMemo(() => {
    if (!isDailyCompletedToday || !dailyLock) return null;
    const resultText = dailyLock.result === "won" ? "Won" : "Lost";
    const guessesText =
      typeof dailyLock.guessesCount === "number" && dailyLock.guessesCount > 0
        ? `${dailyLock.guessesCount} guess${dailyLock.guessesCount === 1 ? "" : "es"}`
        : null;
    const timeText =
      typeof dailyLock.timeSeconds === "number"
        ? formatSeconds(dailyLock.timeSeconds)
        : null;

    if (guessesText && timeText) return `${resultText} • ${guessesText} • ${timeText}`;
    if (guessesText) return `${resultText} • ${guessesText}`;
    return resultText;
  }, [dailyLock, isDailyCompletedToday]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
      <View style={[styles.container, { backgroundColor: BG }]}>
        {/* Header (matches other games) */}
        <View style={styles.appHeader}>
          <Pressable style={styles.backToGamesButton} onPress={backToGames} hitSlop={8}>
            <Text style={[styles.backToGamesText, { color: SUBTEXT }]}>← Games</Text>
          </Pressable>

          <Text style={[styles.appTitle, { color: TEXT }]}>Wordle</Text>

          {/* Spacer keeps title centered */}
          <View style={styles.headerSpacer} />
        </View>

        {/* MENU (Play / Stats) */}
        {screen === "menu" ? (
          <>
            {/* Segment pill slider */}
            <View style={styles.segmentWrapper}>
              <View style={[styles.segmentSwitcher, { backgroundColor: CARD }]}>
                {([
                  { key: "play" as const, label: "Play" },
                  { key: "stats" as const, label: "Stats" },
                ] as const).map(({ key, label }) => {
                  const isActive = key === menuTab;
                  return (
                    <Pressable
                      key={key}
                      style={[styles.segmentButton, isActive && { backgroundColor: BG }]}
                      onPress={() => setMenuTab(key)}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          { color: SUBTEXT },
                          isActive && { color: TEXT, fontWeight: "600" },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Content */}
            {menuTab === "play" ? (
              <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={styles.menuScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Daily */}
                <Text style={[styles.sectionTitle, { color: TEXT }]}>Daily Challenge</Text>

                <View style={[styles.modeCard, { backgroundColor: CARD, borderColor: BORDER }]}>
                  <Text style={[styles.modeCardTitle, { color: TEXT }]}>Today's Word</Text>
                  <Text style={[styles.modeCardSubtitle, { color: SUBTEXT }]}>
                    One word per day — same for everyone.
                  </Text>

                  {isDailyCompletedToday ? (
                    <>
                      <View style={styles.completedRow}>
                        <View
                          style={[
                            styles.completedPill,
                            { borderColor: BORDER, backgroundColor: BG },
                          ]}
                        >
                          <Text style={[styles.completedPillText, { color: TEXT }]}>
                            Completed
                          </Text>
                        </View>

                        <Pressable
                          onPress={openDailyResultFromMenu}
                          style={({ pressed }) => [
                            styles.viewResultButton,
                            {
                              borderColor: BORDER,
                              backgroundColor: BG,
                              opacity: pressed ? 0.75 : 1,
                            },
                          ]}
                        >
                          <Text style={[styles.viewResultText, { color: TEXT }]}>
                            View Result
                          </Text>
                        </Pressable>
                      </View>

                      {dailySummaryText ? (
                        <Text style={[styles.modeCardMeta, { color: SUBTEXT }]}>
                          {dailySummaryText}
                        </Text>
                      ) : null}

                      {nextDailySeconds != null ? (
                        <Text style={[styles.modeCardMeta, { color: SUBTEXT }]}>
                          Next Daily in {formatCountdown(nextDailySeconds)}
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <Pressable
                      onPress={() => startGame("daily")}
                      style={({ pressed }) => [
                        styles.primaryCta,
                        { borderColor: BORDER, backgroundColor: BG, opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Text style={[styles.primaryCtaText, { color: TEXT }]}>Play Daily</Text>
                    </Pressable>
                  )}
                </View>

                {/* Practice */}
                <Text style={[styles.sectionTitle, { color: TEXT, marginTop: 18 }]}>
                  Practice
                </Text>

                <View style={[styles.modeCard, { backgroundColor: CARD, borderColor: BORDER }]}>
                  <Text style={[styles.modeCardTitle, { color: TEXT }]}>Random Word</Text>
                  <Text style={[styles.modeCardSubtitle, { color: SUBTEXT }]}>
                    Play as much as you want.
                  </Text>

                  <Pressable
                    onPress={() => startGame("practice")}
                    style={({ pressed }) => [
                      styles.primaryCta,
                      { borderColor: BORDER, backgroundColor: BG, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text style={[styles.primaryCtaText, { color: TEXT }]}>Play Practice</Text>
                  </Pressable>
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.statsContainer}
                contentContainerStyle={styles.statsContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Lifetime */}
                <Text style={[styles.sectionTitle, { color: TEXT }]}>Lifetime</Text>
                <View style={styles.statsGrid}>
                  <StatsCard label="Games Played" value={`${lifetimeGames}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Wins" value={`${lifetimeWins} (${lifetimeWinRate}%)`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Total Time" value={lifetimeTime > 0 ? formatTotalTime(lifetimeTime) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Total Guesses" value={`${lifetimeGuesses}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Perfect Wins" value={`${lifetimePerfect}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                </View>

                {/* Daily */}
                <Text style={[styles.sectionTitle, { color: TEXT, marginTop: 25 }]}>
                  Daily Challenge Stats
                </Text>
                <View style={styles.statsGrid}>
                  <StatsCard label="Dailies Played" value={`${stats.daily.gamesPlayed}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Wins" value={`${stats.daily.gamesWon} (${winRateDaily}%)`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Current Streak" value={`${stats.daily.currentStreak} day${stats.daily.currentStreak === 1 ? "" : "s"}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Best Streak" value={`${stats.daily.bestStreak} day${stats.daily.bestStreak === 1 ? "" : "s"}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Avg Time (wins)" value={avgTimeDaily != null ? formatSeconds(avgTimeDaily) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Fastest (wins)" value={stats.daily.fastestTimeSeconds != null ? formatSeconds(stats.daily.fastestTimeSeconds) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Avg Guesses (wins)" value={avgGuessesDaily != null ? avgGuessesDaily.toFixed(2) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Perfect Wins" value={`${stats.daily.guessDistribution?.[1] ?? 0}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Total Time" value={stats.daily.totalTimeSeconds > 0 ? formatTotalTime(stats.daily.totalTimeSeconds) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Total Guesses" value={`${stats.daily.totalGuesses}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                </View>

                {/* Practice */}
                <Text style={[styles.sectionTitle, { color: TEXT, marginTop: 25 }]}>
                  Practice Stats
                </Text>
                <View style={styles.statsGrid}>
                  <StatsCard label="Games Played" value={`${stats.practice.gamesPlayed}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Wins" value={`${stats.practice.gamesWon} (${winRatePractice}%)`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Avg Time (wins)" value={avgTimePractice != null ? formatSeconds(avgTimePractice) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Fastest (wins)" value={stats.practice.fastestTimeSeconds != null ? formatSeconds(stats.practice.fastestTimeSeconds) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Avg Guesses (wins)" value={avgGuessesPractice != null ? avgGuessesPractice.toFixed(2) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Perfect Wins" value={`${stats.practice.guessDistribution?.[1] ?? 0}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Total Time" value={stats.practice.totalTimeSeconds > 0 ? formatTotalTime(stats.practice.totalTimeSeconds) : "--"} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  <StatsCard label="Total Guesses" value={`${stats.practice.totalGuesses}`} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                </View>

                {/* Achievements */}
                <Text style={[styles.sectionTitle, { color: TEXT, marginTop: 25 }]}>
                  Achievements ({achievements.length})
                </Text>
                <View style={styles.achievementsGrid}>
                  {achievements.map((a) => (
                    <AchievementCard key={a.id} achievement={a} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  ))}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </>
        ) : (
          // GAME SCREEN
          <>
            <View style={styles.gameTopArea}>
              <Text style={[styles.modeTitle, { color: SUBTEXT }]}>
                {gameMode === "daily" ? "Daily Challenge" : "Practice"}
              </Text>

              <View style={styles.messageBar}>
                {message ? (
                  <View style={[styles.messagePill, { borderColor: BORDER, backgroundColor: CARD }]}>
                    <Text style={[styles.messageText, { color: TEXT }]}>{message}</Text>
                  </View>
                ) : (
                  <View style={{ height: 30 }} />
                )}
              </View>

              <Animated.View style={[styles.grid, { transform: [{ translateX: gridShakeX }] }]}>
                {Array.from({ length: ROWS }).map((_, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.row}>
                    {Array.from({ length: COLS }).map((__, colIndex) => renderTile(rowIndex, colIndex))}
                  </View>
                ))}
              </Animated.View>

              <View style={styles.statusArea}>
                {status !== "playing" ? (
                  <Animated.Text style={[styles.statusText, { color: SUBTEXT, transform: [{ scale: statusScale }] }]}>
                    {status === "won"
                      ? `You solved it in ${guesses.length} guess${guesses.length === 1 ? "" : "es"}.`
                      : "Out of guesses."}
                  </Animated.Text>
                ) : (
                  <View style={{ height: 20 }} />
                )}
              </View>
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.keyboard}>
                {KEYBOARD_ROWS.map((row, rowIndex) => renderKeyboardRow(row, rowIndex))}
              </View>

              <Pressable
                onPress={submitGuess}
                style={({ pressed }) => [
                  styles.enterButton,
                  { borderColor: BORDER, backgroundColor: CARD, opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Text style={[styles.enterText, { color: TEXT }]}>ENTER</Text>
              </Pressable>
            </View>
          </>
        )}

        <WordleResultOverlay
          visible={showResult}
          mode={overlayMode}
          status={overlayStatus}
          solutionWord={overlaySolutionWord}
          guessesCount={overlayGuessesCount}
          timeSeconds={overlayTimeSeconds}
          currentStreak={overlayMode === "daily" ? stats.daily.currentStreak : null}
          bestStreak={overlayMode === "daily" ? stats.daily.bestStreak : null}
          averageTimeSeconds={overlayMode === "daily" ? (avgTimeDaily ?? null) : (avgTimePractice ?? null)}
          averageGuesses={overlayMode === "daily" ? (avgGuessesDaily ?? null) : (avgGuessesPractice ?? null)}
          onClose={() => {
            closeResult();
            if (overlayOrigin === "game_end") {
              // After a completed game, return to Play menu (per requested flow)
              goToMenu("play");
            }
          }}
          onPlayAgain={() => {
            if (overlayMode === "practice") {
              resetGameState("practice");
              closeResult();
              setScreen("game");
            }
          }}
          onGoHome={() => {
            closeResult();
            goToMenu("play");
          }}
          onGoPractice={() => {
            closeResult();
            startGame("practice");
          }}
          nextDailySecondsRemaining={overlayMode === "daily" && isDailyCompletedToday ? nextDailySeconds : null}
          shareText={overlayShareText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 10,
  },

  // Header
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backToGamesButton: {
    padding: 8,
    width: 90,
  },
  backToGamesText: {
    fontSize: 14,
    fontWeight: "500",
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 90,
  },

  // Segment Switcher (Pill Slider)
  segmentWrapper: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  segmentSwitcher: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 999,
    padding: 4,
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Menu scroll
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },

  // Sections
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  // Mode cards (Play menu)
  modeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  modeCardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  modeCardMeta: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  primaryCta: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  primaryCtaText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  completedRow: {
    alignItems: "center",
    gap: 10,
  },
  completedPill: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completedPillText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  viewResultButton: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  viewResultText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Stats layout
  statsContainer: {
    flex: 1,
  },
  statsContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  statsCard: {
    width: "48%",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 10,
  },
  statsCardWide: {
    width: "100%",
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  statsLabel: {
    fontSize: 12,
    textAlign: "center",
  },

  // Achievements
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
  },
  achievementCard: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 10,
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 11,
    textAlign: "center",
  },

  // Game screen
  gameTopArea: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    alignItems: "center",
  },

  modeTitle: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },

  messageBar: {
    marginTop: 10,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
  },
  messagePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  messageText: { fontSize: 13, fontWeight: "600" },

  grid: {
    alignSelf: "center",
    marginTop: 8,
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: TILE_GAP / 2,
  },

  tileContainer: {
    position: "relative",
  },
  tileFace: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
  tileText: {
    fontSize: Math.max(24, Math.floor(TILE_SIZE * 0.52)),
    fontWeight: "900",
  },

  statusArea: {
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  bottomControls: {
    paddingHorizontal: HORIZONTAL_PADDING,
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 6,
    flexShrink: 0,
  },

  keyboard: {
    alignSelf: "center",
    marginTop: 0,
  },
  keyRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: KEY_ROW_MARGIN_V,
  },
  key: {
    minHeight: KEY_MIN_HEIGHT,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    paddingHorizontal: 8,
  },
  keyText: {
    fontSize: 16,
    fontWeight: "900",
  },

  enterButton: {
    marginTop: 8,
    alignSelf: "center",
    borderWidth: 2,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 999,
  },
  enterText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
