import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import WordleResultOverlay from "../components/wordleResultoverlay";
import { SOLUTIONS, VALID_GUESSES } from "../data/wordle_words";
import {
  clearDailyLock,
  loadDailyLock,
  loadWordleStats,
  saveDailyLock,
  saveWordleStats,
} from "../storage/wordleStorage";

// ───────────── Types & constants ─────────────

const ROWS = 6;
const COLS = 5;

type LetterState = "correct" | "present" | "absent" | "empty";

type EvaluatedLetter = {
  letter: string;
  state: LetterState;
};

type Mode = "daily" | "practice" | "stats";
type Status = "playing" | "won" | "lost";

type GuessDistribution = {
  [guessCount: number]: number; // 1–6
};

type ModeStats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  totalTimeSeconds: number;
  fastestTimeSeconds: number | null;
  totalGuesses: number;
  guessDistribution: GuessDistribution; // wins only
};

type DailyLockState = {
  dateISO: string; // YYYY-MM-DD
  result: "won" | "lost";
};

function createEmptyModeStats(): ModeStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalTimeSeconds: 0,
    fastestTimeSeconds: null,
    totalGuesses: 0,
    guessDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    },
  };
}

const KEYBOARD_ROWS: string[][] = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  [..."ZXCVBNM".split(""), "BACK"],
];

const CREAM = "#f9f5ec";
const HORIZONTAL_PADDING = 16;
const KEY_GAP = 6;

const SCREEN_WIDTH = Dimensions.get("window").width;

// ───────────── Helpers ─────────────

function evaluateGuess(guess: string, solution: string): EvaluatedLetter[] {
  const letters = guess.toUpperCase().split("");
  const sol = solution.toUpperCase().split("");

  const result: EvaluatedLetter[] = new Array(COLS).fill(null).map((_, i) => ({
    letter: letters[i] || "",
    state: "absent",
  }));

  const remaining: Record<string, number> = {};

  for (let i = 0; i < COLS; i++) {
    const s = sol[i];
    remaining[s] = (remaining[s] || 0) + 1;
  }

  // First pass: correct
  for (let i = 0; i < COLS; i++) {
    if (letters[i] && letters[i] === sol[i]) {
      result[i].state = "correct";
      remaining[letters[i]] -= 1;
    }
  }

  // Second pass: present / absent
  for (let i = 0; i < COLS; i++) {
    if (!letters[i]) continue;
    if (result[i].state === "correct") continue;

    const upper = letters[i];
    if (remaining[upper] > 0) {
      result[i].state = "present";
      remaining[upper] -= 1;
    } else {
      result[i].state = "absent";
    }
  }

  return result;
}

function mergeKeyboardState(
  prev: Record<string, LetterState>,
  guessEval: EvaluatedLetter[]
): Record<string, LetterState> {
  const next = { ...prev };

  const rank: Record<LetterState, number> = {
    correct: 3,
    present: 2,
    absent: 1,
    empty: 0,
  };

  for (const tile of guessEval) {
    const existing = next[tile.letter];
    if (!existing || rank[tile.state] > rank[existing]) {
      next[tile.letter] = tile.state;
    }
  }

  return next;
}

function getDailyIndex(date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayNumber = Math.floor(date.setHours(0, 0, 0, 0) / msPerDay);
  return Math.abs(dayNumber) % SOLUTIONS.length;
}

function getDailySolution(): string {
  return SOLUTIONS[getDailyIndex()];
}

function getRandomPracticeSolution(): string {
  const idx = Math.floor(Math.random() * SOLUTIONS.length);
  return SOLUTIONS[idx];
}

function isValidWord(guess: string): boolean {
  const upper = guess.toUpperCase();
  return VALID_GUESSES.includes(upper);
}

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function getTodayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ───────────── Main WordleGame component ─────────────

export default function WordleGame() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("daily");
  const [solution, setSolution] = useState<string>(() => getDailySolution());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluatedLetter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState<Status>("playing");
  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [startTime, setStartTime] = useState<number | null>(Date.now());
  const [lastGameTimeSeconds, setLastGameTimeSeconds] =
    useState<number | null>(null);

  const [stats, setStats] = useState<{
    daily: ModeStats;
    practice: ModeStats;
  }>({
    daily: createEmptyModeStats(),
    practice: createEmptyModeStats(),
  });

  const [hydrated, setHydrated] = useState(false);
  const [dailyLock, setDailyLock] = useState<DailyLockState | null>(null);

  const [keyboardState, setKeyboardState] = useState<Record<string, LetterState>>(
    {}
  );

  // ── Hydrate stats + daily lock from AsyncStorage on mount ──
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [loadedStats, loadedLock] = await Promise.all([
          loadWordleStats(),
          loadDailyLock(),
        ]);

        if (!isMounted) return;

        if (loadedStats) {
          setStats({
            daily: {
              ...createEmptyModeStats(),
              ...(loadedStats.daily || {}),
            },
            practice: {
              ...createEmptyModeStats(),
              ...(loadedStats.practice || {}),
            },
          });
        }

        if (loadedLock && typeof loadedLock.dateISO === "string") {
          setDailyLock(loadedLock as DailyLockState);
        }

        setHydrated(true);
      } catch (error) {
        console.warn("Error loading Wordle stats/daily lock", error);
        setHydrated(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist stats whenever they change
  useEffect(() => {
    if (!hydrated) return;
    saveWordleStats(stats).catch((error) =>
      console.warn("Error saving Wordle stats", error)
    );
  }, [hydrated, stats]);

  // Persist daily lock whenever it changes
  useEffect(() => {
    if (!hydrated) return;

    if (dailyLock) {
      saveDailyLock(dailyLock).catch((error) =>
        console.warn("Error saving daily lock", error)
      );
    } else {
      clearDailyLock().catch((error) =>
        console.warn("Error clearing daily lock", error)
      );
    }
  }, [hydrated, dailyLock]);

  // Keyboard letter state derived from evaluations
  const derivedKeyboardState = useMemo(() => {
    const stateMap: Record<string, LetterState> = {};

    const rank: Record<LetterState, number> = {
      correct: 3,
      present: 2,
      absent: 1,
      empty: 0,
    };

    for (const row of evaluations) {
      for (const tile of row) {
        const upper = tile.letter.toUpperCase();
        const existing = stateMap[upper];

        if (!existing || rank[tile.state] > rank[existing]) {
          stateMap[upper] = tile.state;
        }
      }
    }

    return stateMap;
  }, [evaluations]);

  useEffect(() => {
    setKeyboardState(derivedKeyboardState);
  }, [derivedKeyboardState]);

  const showMessage = useCallback((text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 1500);
  }, []);

  // Animate invalid word row shake
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

  // Flip animations: one Animated.Value per tile
  const flipAnims = useRef(
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => new Animated.Value(0))
    )
  ).current;

  const revealRow = useCallback(
    (rowIndex: number) => {
      const row = flipAnims[rowIndex];
      const animations = row.map((val, i) =>
        Animated.timing(val, {
          toValue: 1,
          duration: 220,
          delay: i * 80,
          useNativeDriver: true,
        })
      );

      Animated.stagger(80, animations).start();
    },
    [flipAnims]
  );

  // Win bounce animation on the whole grid
  const winBounceAnim = useRef(new Animated.Value(0)).current;

  const gridScale = winBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const triggerWinBounce = useCallback(() => {
    winBounceAnim.setValue(0);
    Animated.sequence([
      Animated.timing(winBounceAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(winBounceAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [winBounceAnim]);

  const resetGameState = useCallback(() => {
    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess("");
    setStatus("playing");
    setMessage(null);
    setLastGameTimeSeconds(null);

    flipAnims.forEach((row) =>
      row.forEach((value) => {
        value.setValue(0);
      })
    );

    winBounceAnim.setValue(0);
    setStartTime(Date.now());
  }, [flipAnims, winBounceAnim]);

  const todayISO = getTodayISODate();
  const isDailyLocked =
    mode === "daily" &&
    dailyLock != null &&
    dailyLock.dateISO === todayISO;

  const updateStatsForGame = useCallback(
    (result: "won" | "lost", guessCount: number, elapsedSeconds: number) => {
      if (mode === "stats") return;

      setStats((prev) => {
        const key = mode === "daily" ? "daily" : "practice";
        const prevMode = prev[key];

        const gamesPlayed = prevMode.gamesPlayed + 1;
        const gamesWon =
          result === "won" ? prevMode.gamesWon + 1 : prevMode.gamesWon;
        const currentStreak =
          result === "won" ? prevMode.currentStreak + 1 : 0;
        const bestStreak = Math.max(prevMode.bestStreak, currentStreak);

        const totalTimeSeconds = prevMode.totalTimeSeconds + elapsedSeconds;
        const fastestTimeSeconds =
          result === "won"
            ? prevMode.fastestTimeSeconds == null
              ? elapsedSeconds
              : Math.min(prevMode.fastestTimeSeconds, elapsedSeconds)
            : prevMode.fastestTimeSeconds;

        const totalGuesses = prevMode.totalGuesses + guessCount;
        const guessDistribution = { ...prevMode.guessDistribution };

        if (result === "won" && guessCount >= 1 && guessCount <= 6) {
          guessDistribution[guessCount] =
            (guessDistribution[guessCount] || 0) + 1;
        }

        return {
          ...prev,
          [key]: {
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
    },
    [mode]
  );

  const handleLetter = useCallback(
    (letter: string) => {
      if (isDailyLocked && mode === "daily") {
        showMessage("You've already played today's Daily. Try Practice.");
        return;
      }

      if (status !== "playing") return;
      if (mode === "stats") return;

      if (currentGuess.length >= COLS) return;
      setCurrentGuess((g) => (g + letter).toUpperCase());
    },
    [currentGuess.length, isDailyLocked, mode, showMessage, status]
  );

  const handleBackspace = useCallback(() => {
    if (isDailyLocked && mode === "daily") {
      showMessage("You've already played today's Daily. Try Practice.");
      return;
    }

    if (status !== "playing") return;
    if (mode === "stats") return;

    if (currentGuess.length === 0) return;
    setCurrentGuess((g) => g.slice(0, -1));
  }, [currentGuess.length, isDailyLocked, mode, showMessage, status]);

  const handleEnter = useCallback(() => {
    if (isDailyLocked && mode === "daily") {
      showMessage("You've already played today's Daily. Try Practice.");
      return;
    }

    if (status !== "playing") return;
    if (mode === "stats") return;

    if (currentGuess.length < COLS) {
      showMessage("Not enough letters");
      triggerShake();
      return;
    }

    if (!isValidWord(currentGuess)) {
      showMessage("Not in word list");
      triggerShake();
      return;
    }

    const evaluated = evaluateGuess(currentGuess, solution);
    const nextGuesses = [...guesses, currentGuess.toUpperCase()];
    const nextEvals = [...evaluations, evaluated];
    const newRowIndex = nextGuesses.length - 1;

    setGuesses(nextGuesses);
    setEvaluations(nextEvals);
    setCurrentGuess("");

    revealRow(newRowIndex);

    const upperGuess = currentGuess.toUpperCase();
    const mergedKeyboard = mergeKeyboardState(derivedKeyboardState, evaluated);
    setKeyboardState(mergedKeyboard);

    const guessCount = nextGuesses.length;
    const isWin = evaluated.every((tile) => tile.state === "correct");
    const isLastRow = guessCount >= ROWS;

    let result: "won" | "lost" | null = null;

    if (isWin) {
      setStatus("won");
      showMessage(
        `Nice! You solved it in ${guessCount} ${
          guessCount === 1 ? "guess" : "guesses"
        }.`
      );
      triggerWinBounce();
      result = "won";
      setShowResult(true);
    } else if (isLastRow) {
      setStatus("lost");
      showMessage("Out of guesses.");
      result = "lost";
      setShowResult(true);
    }

    if (result && startTime != null) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      setLastGameTimeSeconds(elapsedSeconds);

      updateStatsForGame(result, guessCount, elapsedSeconds);

      if (mode === "daily") {
        const today = getTodayISODate();
        setDailyLock({ dateISO: today, result });
      }
    }
  }, [
    currentGuess,
    derivedKeyboardState,
    evaluations,
    guesses,
    isDailyLocked,
    mode,
    revealRow,
    showMessage,
    solution,
    startTime,
    status,
    triggerShake,
    triggerWinBounce,
    updateStatsForGame,
  ]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === "BACK") {
        handleBackspace();
      } else if (key.length === 1 && /[A-Z]/.test(key)) {
        handleLetter(key);
      }
    },
    [handleBackspace, handleLetter]
  );

  const closeResult = useCallback(() => {
    setShowResult(false);
  }, []);

  const handleReset = () => {
    closeResult();
    resetGameState();

    if (mode === "daily") {
      setSolution(getDailySolution());
    }

    if (mode === "practice") {
      setSolution(getRandomPracticeSolution());
    }
  };

  const handleShare = useCallback(() => {
    if (evaluations.length === 0) return;

    const isDailyMode = mode === "daily";
    const header = isDailyMode
      ? `Word Game – Daily ${todayISO}`
      : "Word Game – Practice";

    const guessCount = guesses.length;
    const resultMarker =
      status === "won" ? `${guessCount}/${ROWS}` : `X/${ROWS}`;

    const timePart =
      lastGameTimeSeconds != null
        ? ` • ${formatSeconds(lastGameTimeSeconds)}`
        : "";

    const grid = evaluations
      .map((row) =>
        row
          .map((tile) => {
            if (tile.state === "correct") return "🟩";
            if (tile.state === "present") return "🟨";
            return "⬛";
          })
          .join("")
      )
      .join("\n");

    const message = `${header}\n${resultMarker}${timePart}\n\n${grid}`;

    Share.share({ message }).catch((err) => {
      console.warn("Error sharing Wordle result", err);
    });
  }, [
    evaluations,
    mode,
    todayISO,
    guesses.length,
    status,
    lastGameTimeSeconds,
  ]);

  const statusText =
    status === "won"
      ? `You solved it in ${guesses.length} ${
          guesses.length === 1 ? "guess" : "guesses"
        }.`
      : status === "lost"
      ? "Out of guesses."
      : "";

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);

    if (nextMode === "daily") {
      setSolution(getDailySolution());
    } else if (nextMode === "practice") {
      setSolution(getRandomPracticeSolution());
    }

    closeResult();
    resetGameState();
  };

  const handleGoHome = useCallback(() => {
    closeResult();
    router.back();
  }, [router, closeResult]);

  const handleGoPractice = useCallback(() => {
    closeResult();
    setMode("practice");
    setSolution(getRandomPracticeSolution());
    resetGameState();
  }, [resetGameState, closeResult]);

  // Derived stats for Stats screen & overlay
  const dailyStats = stats.daily;
  const practiceStats = stats.practice;

  const dailyWinRate =
    dailyStats.gamesPlayed > 0
      ? (dailyStats.gamesWon / dailyStats.gamesPlayed) * 100
      : null;

  const practiceWinRate =
    practiceStats.gamesPlayed > 0
      ? (practiceStats.gamesWon / practiceStats.gamesPlayed) * 100
      : null;

  const dailyAvgTime =
    dailyStats.gamesPlayed > 0
      ? dailyStats.totalTimeSeconds / dailyStats.gamesPlayed
      : null;

  const practiceAvgTime =
    practiceStats.gamesPlayed > 0
      ? practiceStats.totalTimeSeconds / practiceStats.gamesPlayed
      : null;

  const dailyAvgGuesses =
    dailyStats.gamesPlayed > 0
      ? dailyStats.totalGuesses / dailyStats.gamesPlayed
      : null;

  const practiceAvgGuesses =
    practiceStats.gamesPlayed > 0
      ? practiceStats.totalGuesses / practiceStats.gamesPlayed
      : null;

  const statsForCurrentMode =
    mode === "daily" ? dailyStats : practiceStats;
  const avgTimeForCurrentMode =
    mode === "daily" ? dailyAvgTime : practiceAvgTime;
  const avgGuessesForCurrentMode =
    mode === "daily" ? dailyAvgGuesses : practiceAvgGuesses;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleGoHome}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <Text style={styles.title}>Wordle</Text>
        </View>

        {/* Mode selector */}
        <View style={styles.modeSwitcher}>
          {(["daily", "practice", "stats"] as Mode[]).map((m) => {
            const isActive = mode === m;
            const label =
              m === "daily" ? "Daily" : m === "practice" ? "Practice" : "Stats";

            return (
              <Pressable
                key={m}
                style={[
                  styles.modeButton,
                  isActive && styles.modeButtonActive,
                ]}
                onPress={() => handleModeChange(m)}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    isActive && styles.modeButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Message */}
        {message && (
          <View style={styles.messageBar}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        {/* Content */}
        {mode === "stats" ? (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Stats</Text>

            {/* Daily stats */}
            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Daily</Text>
              <Text style={styles.statsText}>
                Games played: {dailyStats.gamesPlayed}
              </Text>
              <Text style={styles.statsText}>
                Wins: {dailyStats.gamesWon}
                {dailyWinRate != null
                  ? ` (${dailyWinRate.toFixed(0)}% win rate)`
                  : ""}
              </Text>
              <Text style={styles.statsText}>
                Current streak: {dailyStats.currentStreak}
              </Text>
              <Text style={styles.statsText}>
                Best streak: {dailyStats.bestStreak}
              </Text>
              <Text style={styles.statsText}>
                Avg time:{" "}
                {dailyAvgTime != null ? formatSeconds(dailyAvgTime) : "--"}
              </Text>
              <Text style={styles.statsText}>
                Fastest time:{" "}
                {dailyStats.fastestTimeSeconds != null
                  ? formatSeconds(dailyStats.fastestTimeSeconds)
                  : "--"}
              </Text>
              <Text style={styles.statsText}>
                Avg guesses:{" "}
                {dailyAvgGuesses != null
                  ? dailyAvgGuesses.toFixed(2)
                  : "--"}
              </Text>
              <Text style={[styles.statsText, { marginTop: 6 }]}>
                Guess distribution (wins only):
                {"\n"}
                1 guess: {dailyStats.guessDistribution[1]}
                {"\n"}
                2 guesses: {dailyStats.guessDistribution[2]}
                {"\n"}
                3 guesses: {dailyStats.guessDistribution[3]}
                {"\n"}
                4 guesses: {dailyStats.guessDistribution[4]}
                {"\n"}
                5 guesses: {dailyStats.guessDistribution[5]}
                {"\n"}
                6 guesses: {dailyStats.guessDistribution[6]}
              </Text>
            </View>

            {/* Practice stats */}
            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Practice</Text>
              <Text style={styles.statsText}>
                Games played: {practiceStats.gamesPlayed}
              </Text>
              <Text style={styles.statsText}>
                Wins: {practiceStats.gamesWon}
                {practiceWinRate != null
                  ? ` (${practiceWinRate.toFixed(0)}% win rate)`
                  : ""}
              </Text>
              <Text style={styles.statsText}>
                Current streak: {practiceStats.currentStreak}
              </Text>
              <Text style={styles.statsText}>
                Best streak: {practiceStats.bestStreak}
              </Text>
              <Text style={styles.statsText}>
                Avg time:{" "}
                {practiceAvgTime != null
                  ? formatSeconds(practiceAvgTime)
                  : "--"}
              </Text>
              <Text style={styles.statsText}>
                Fastest time:{" "}
                {practiceStats.fastestTimeSeconds != null
                  ? formatSeconds(practiceStats.fastestTimeSeconds)
                  : "--"}
              </Text>
              <Text style={styles.statsText}>
                Avg guesses:{" "}
                {practiceAvgGuesses != null
                  ? practiceAvgGuesses.toFixed(2)
                  : "--"}
              </Text>
              <Text style={[styles.statsText, { marginTop: 6 }]}>
                Guess distribution (wins only):
                {"\n"}
                1 guess: {practiceStats.guessDistribution[1]}
                {"\n"}
                2 guesses: {practiceStats.guessDistribution[2]}
                {"\n"}
                3 guesses: {practiceStats.guessDistribution[3]}
                {"\n"}
                4 guesses: {practiceStats.guessDistribution[4]}
                {"\n"}
                5 guesses: {practiceStats.guessDistribution[5]}
                {"\n"}
                6 guesses: {practiceStats.guessDistribution[6]}
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Grid */}
            <Animated.View
              style={[
                styles.gridWrapper,
                { transform: [{ scale: gridScale }] },
              ]}
            >
              {Array.from({ length: ROWS }).map((_, rowIndex) => {
                const RowComponent =
                  rowIndex === guesses.length && status === "playing"
                    ? Animated.View
                    : View;

                const rowShake =
                  rowIndex === guesses.length && status === "playing"
                    ? {
                        transform: [
                          {
                            translateX: shakeAnim.interpolate({
                              inputRange: [-8, 8],
                              outputRange: [-8, 8],
                            }),
                          },
                        ],
                      }
                    : {};

                return (
                  <RowComponent
                    key={rowIndex}
                    style={[styles.row, rowShake]}
                  >
                    {Array.from({ length: COLS }).map((_, colIndex) => {
                      const guessForRow = guesses[rowIndex] || "";
                      let letter = "";
                      let state: LetterState = "empty";

                      if (rowIndex < guesses.length) {
                        letter = guessForRow[colIndex] || "";
                        state = evaluations[rowIndex]?.[colIndex]?.state ?? "empty";
                      } else if (
                        rowIndex === guesses.length &&
                        status === "playing"
                      ) {
                        letter = currentGuess[colIndex] || "";
                      }

                      let background = "transparent";
                      let border = "#d3d6da";
                      let textColor = "#111827";

                      if (state === "correct") {
                        background = "#6aaa64";
                        border = "#6aaa64";
                        textColor = "#ffffff";
                      } else if (state === "present") {
                        background = "#c9b458";
                        border = "#c9b458";
                        textColor = "#ffffff";
                      } else if (state === "absent" && letter) {
                        background = "#787c7e";
                        border = "#787c7e";
                        textColor = "#ffffff";
                      } else if (letter) {
                        border = "#565758";
                      }

                      const flipValue = flipAnims[rowIndex][colIndex];
                      const rotateX = flipValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ["0deg", "90deg", "0deg"],
                      });

                      return (
                        <Animated.View
                          key={colIndex}
                          style={[
                            styles.tile,
                            { borderColor: border, backgroundColor: background },
                            {
                              transform: [{ perspective: 1000 }, { rotateX }],
                            },
                          ]}
                        >
                          <Text style={[styles.tileText, { color: textColor }]}>
                            {letter}
                          </Text>
                        </Animated.View>
                      );
                    })}
                  </RowComponent>
                );
              })}
            </Animated.View>

            {/* Status + Reset */}
            <View style={styles.statusArea}>
              {!!statusText && (
                <Text style={styles.statusText}>{statusText}</Text>
              )}
              {status !== "playing" && (
                <Pressable style={styles.resetButton} onPress={handleReset}>
                  <Text style={styles.resetText}>New {mode === "daily" ? "Daily" : "Practice"}</Text>
                </Pressable>
              )}
            </View>

            {/* Keyboard */}
            <View style={styles.keyboardContainer}>
              {KEYBOARD_ROWS.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.keyboardRow}>
                  {row.map((key) => {
                    const isBackspace = key === "BACK";

                    const letterState = keyboardState[key] || "empty";

                    let background = "#d3d6da";
                    let color = "#111827";

                    if (letterState === "correct") {
                      background = "#6aaa64";
                      color = "#ffffff";
                    } else if (letterState === "present") {
                      background = "#c9b458";
                      color = "#ffffff";
                    } else if (letterState === "absent") {
                      background = "#787c7e";
                      color = "#ffffff";
                    }

                    const label = isBackspace ? "⌫" : key;
                    const keyWidth =
                      key === "BACK" ? 56 : (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - KEY_GAP * 9) / 10;

                    const pressValue = useRef(new Animated.Value(0)).current;
                    const keyScale = pressValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.9],
                    });

                    const onKeyPressAnimated = () => {
                      Animated.sequence([
                        Animated.timing(pressValue!, {
                          toValue: 1,
                          duration: 70,
                          useNativeDriver: true,
                        }),
                        Animated.timing(pressValue!, {
                          toValue: 0,
                          duration: 90,
                          useNativeDriver: true,
                        }),
                      ]).start();
                      handleKeyPress(key);
                    };

                    return (
                      <Animated.View
                        key={key}
                        style={[
                          styles.keyWrapper,
                          { transform: [{ scale: keyScale }] },
                        ]}
                      >
                        <Pressable
                          style={[
                            styles.key,
                            {
                              backgroundColor: background,
                              width: keyWidth,
                            },
                          ]}
                          onPress={onKeyPressAnimated}
                        >
                          <Text style={[styles.keyText, { color }]}>
                            {label}
                          </Text>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Custom Enter button */}
            <View style={styles.enterWrapper}>
              <Pressable style={styles.enterButton} onPress={handleEnter}>
                <Text style={styles.enterText}>Enter</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Post-game overlay */}
        <WordleResultOverlay
          visible={showResult && mode !== "stats"}
          mode={mode === "stats" ? "daily" : (mode as "daily" | "practice")}
          status={status === "playing" ? "lost" : (status as "won" | "lost")}
          solutionWord={solution}
          guessesCount={guesses.length}
          timeSeconds={lastGameTimeSeconds}
          currentStreak={statsForCurrentMode.currentStreak}
          bestStreak={statsForCurrentMode.bestStreak}
          averageTimeSeconds={avgTimeForCurrentMode ?? null}
          averageGuesses={avgGuessesForCurrentMode ?? null}
          onClose={closeResult}
          onPlayAgain={handleReset}
          onGoHome={handleGoHome}
          onGoPractice={handleGoPractice}
          onShare={handleShare}
        />
      </View>
    </SafeAreaView>
  );
}

// ───────────── Styles ─────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CREAM,
  },
  container: {
    flex: 1,
    backgroundColor: CREAM,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 22,
    color: "#4b5563",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#111827",
  },
  modeSwitcher: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d3d6da",
    backgroundColor: "#e5decf",
  },
  modeButtonActive: {
    backgroundColor: "#ffffff",
    borderColor: "#b59b7b",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  modeButtonTextActive: {
    color: "#111827",
  },
  messageBar: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#eee3d3",
  },
  messageText: {
    color: "#111827",
    fontSize: 14,
  },
  gridWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  tile: {
    width: 54,
    height: 54,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    fontSize: 26,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusArea: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statusText: {
    color: "#111827",
    fontSize: 14,
    textAlign: "center",
  },
  resetButton: {
    marginTop: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d3d6da",
  },
  resetText: {
    color: "#111827",
    fontSize: 14,
  },
  keyboardContainer: {
    gap: 8,
    marginBottom: 8,
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: KEY_GAP,
  },
  keyWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  key: {
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  enterWrapper: {
    marginTop: 4,
    alignItems: "center",
  },
  enterButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#8b5a2b",
    backgroundColor: CREAM,
  },
  enterText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#8b5a2b",
    textTransform: "uppercase",
  },
  statsContainer: {
    flex: 1,
    alignSelf: "stretch",
    marginTop: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  statsSection: {
    marginBottom: 16,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  statsText: {
    fontSize: 14,
    color: "#4b5563",
  },
});
