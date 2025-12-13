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
import WordleResultOverlay from "../components/wordleResultoverlay";
import { SOLUTIONS, VALID_GUESSES } from "../data/wordle_words";
import {
  clearDailyLock,
  loadDailyLock,
  loadWordleStats,
  saveDailyLock,
  saveWordleStats,
} from "../storage/wordleStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ROWS = 6;
const COLS = 5;

const HORIZONTAL_PADDING = 16;
const KEY_GAP = 4;

type Mode = "daily" | "practice" | "stats";

type LetterState = "correct" | "present" | "absent" | "empty";

type EvaluatedLetter = {
  letter: string;
  state: LetterState;
};

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
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  };
}

// Keyboard rows WITHOUT Enter (we use a custom Enter button below)
const KEYBOARD_ROWS: string[][] = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  [..."ZXCVBNM".split(""), "BACK"],
];

function evaluateGuess(guess: string, solution: string): EvaluatedLetter[] {
  const result: EvaluatedLetter[] = [];

  const solutionChars = solution.toUpperCase().split("");
  const guessChars = guess.toUpperCase().split("");

  const solutionCounts: Record<string, number> = {};
  for (const ch of solutionChars) {
    solutionCounts[ch] = (solutionCounts[ch] || 0) + 1;
  }

  // First pass: greens
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

  // Second pass: yellows vs grays
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
  return VALID_GUESSES.includes(guess.toUpperCase());
}

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function getTodayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getSecondsUntilNextMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

export default function WordleGame() {
  const router = useRouter();
  const { background } = useTheme();

  const themeBg = background.backgroundColor ?? "#f5f0e6";
  const themeText = background.textColor;
  const themeSecondary = background.secondaryText;
  const themeCard = background.cardColor;
  const themeBorder = background.borderColor;
  const isDark = background.isDark;

  // Slightly softer than the main border color so tiles/keys don’t look too heavy.
  const subtleBorder = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)";
  const softKeyBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const emptyTileBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";

  const [mode, setMode] = useState<Mode>("daily");
  const [solution, setSolution] = useState<string>(() => getDailySolution());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluatedLetter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [startTime, setStartTime] = useState<number | null>(Date.now());
  const [lastGameTimeSeconds, setLastGameTimeSeconds] =
    useState<number | null>(null);

  const [stats, setStats] = useState<{ daily: ModeStats; practice: ModeStats }>({
    daily: createEmptyModeStats(),
    practice: createEmptyModeStats(),
  });

  const [hydrated, setHydrated] = useState(false);

  const [dailyLock, setDailyLock] = useState<DailyLockState | null>(null);
  const [nextDailySeconds, setNextDailySeconds] = useState<number | null>(null);
  const [hasShownDailyLockOverlay, setHasShownDailyLockOverlay] =
    useState(false);

  // Animations
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

  // ── Hydrate stats + daily lock ──
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
            daily: { ...createEmptyModeStats(), ...(loadedStats.daily || {}) },
            practice: {
              ...createEmptyModeStats(),
              ...(loadedStats.practice || {}),
            },
          });
        }

        if (loadedLock) {
          setDailyLock(loadedLock as DailyLockState);
        }
      } catch (e) {
        console.warn("Failed to load Wordle data", e);
      } finally {
        if (isMounted) setHydrated(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Persist stats ──
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

  // ── Persist / clear daily lock ──
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        if (dailyLock) await saveDailyLock(dailyLock);
        else await clearDailyLock();
      } catch (e) {
        console.warn("Failed to save Wordle daily lock", e);
      }
    })();
  }, [dailyLock, hydrated]);

  // ── Countdown while locked today ──
  useEffect(() => {
    const todayISO = getTodayISODate();
    if (!dailyLock || dailyLock.dateISO !== todayISO) {
      setNextDailySeconds(null);
      return;
    }

    const update = () => setNextDailySeconds(getSecondsUntilNextMidnight());
    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [dailyLock]);

  // Keyboard letter states derived from evaluations
  const keyboardStates = useMemo(() => {
    const stateMap = new Map<string, LetterState>();

    for (const row of evaluations) {
      for (const { letter, state } of row) {
        if (!letter) continue;

        const existing = stateMap.get(letter);

        if (state === "correct") {
          stateMap.set(letter, "correct");
        } else if (state === "present") {
          if (!existing || existing === "absent")
            stateMap.set(letter, "present");
        } else if (state === "absent") {
          if (!existing) stateMap.set(letter, "absent");
        }
      }
    }

    return stateMap;
  }, [evaluations]);

  const showMessage = useCallback((text: string) => {
    setMessage(text);
  }, []);

  // Auto clear transient messages
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 1500);
    return () => clearTimeout(id);
  }, [message]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

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
      Animated.stagger(70, animations).start();
    },
    [flipAnims]
  );

  const openResult = useCallback(() => setShowResult(true), []);
  const closeResult = useCallback(() => setShowResult(false), []);

  const todayISO = getTodayISODate();
  const isDailyLocked =
    mode === "daily" && !!dailyLock && dailyLock.dateISO === todayISO;

  // Reset overlay auto-open flag when not locked
  useEffect(() => {
    if (!isDailyLocked) setHasShownDailyLockOverlay(false);
  }, [isDailyLocked]);

  // Auto-open overlay when we detect "today is locked" (first time only)
  useEffect(() => {
    if (mode === "daily" && isDailyLocked && !hasShownDailyLockOverlay) {
      setShowResult(true);
      setHasShownDailyLockOverlay(true);
    }
  }, [mode, isDailyLocked, hasShownDailyLockOverlay]);

  const resetGameState = useCallback(() => {
    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess("");
    setStatus("playing");
    setMessage(null);
    setLastGameTimeSeconds(null);

    const newSolution =
      mode === "daily" ? getDailySolution() : getRandomPracticeSolution();
    setSolution(newSolution);

    setStartTime(Date.now());

    winBounceAnim.setValue(0);
    shakeAnim.setValue(0);
    resetFlipAnimations();
  }, [mode, resetFlipAnimations, shakeAnim, winBounceAnim]);

  const updateStatsForGame = useCallback(
    (result: "won" | "lost", guessCount: number, elapsedSeconds: number) => {
      if (mode === "stats") return;

      setStats((prev) => {
        const key = mode === "daily" ? "daily" : "practice";
        const prevMode = prev[key];

        const gamesPlayed = prevMode.gamesPlayed + 1;
        const gamesWon =
          result === "won" ? prevMode.gamesWon + 1 : prevMode.gamesWon;

        const currentStreak = result === "won" ? prevMode.currentStreak + 1 : 0;
        const bestStreak = Math.max(prevMode.bestStreak, currentStreak);

        const totalTimeSeconds = prevMode.totalTimeSeconds + elapsedSeconds;

        let fastestTimeSeconds = prevMode.fastestTimeSeconds;
        if (result === "won") {
          if (fastestTimeSeconds === null || elapsedSeconds < fastestTimeSeconds) {
            fastestTimeSeconds = elapsedSeconds;
          }
        }

        const totalGuesses =
          prevMode.totalGuesses + (result === "won" ? guessCount : 0);

        const guessDistribution = { ...prevMode.guessDistribution };
        if (result === "won") {
          guessDistribution[guessCount] =
            (guessDistribution[guessCount] || 0) + 1;
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
    },
    [mode]
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      if (mode === "stats") return;

      if (isDailyLocked && mode === "daily") {
        showMessage("You've already played today's Daily. Try Practice mode.");
        return;
      }

      if (status !== "playing") return;

      if (key === "BACK") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (currentGuess.length >= COLS) return;
      setCurrentGuess((prev) => (prev + key).toUpperCase());
    },
    [currentGuess.length, isDailyLocked, mode, showMessage, status]
  );

  const handleEnter = useCallback(() => {
    if (mode === "stats") return;

    if (isDailyLocked) {
      showMessage("You've already played today's Daily. Try Practice mode.");
      return;
    }

    if (status !== "playing") return;

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

    const guessCount = nextGuesses.length;

    // Determine result
    let result: "won" | "lost" | null = null;
    if (currentGuess.toUpperCase() === solution.toUpperCase()) {
      setStatus("won");
      result = "won";
      Animated.spring(winBounceAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start(() => winBounceAnim.setValue(0));
      openResult();
    } else if (nextGuesses.length === ROWS) {
      setStatus("lost");
      result = "lost";
      openResult();
    }

    if (result && startTime) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      setLastGameTimeSeconds(elapsedSeconds);
      updateStatsForGame(result, guessCount, elapsedSeconds);

      if (mode === "daily") {
        setDailyLock({ dateISO: getTodayISODate(), result });
      }
    }
  }, [
    currentGuess,
    evaluations,
    guesses,
    isDailyLocked,
    mode,
    openResult,
    revealRow,
    showMessage,
    solution,
    startTime,
    status,
    triggerShake,
    updateStatsForGame,
    winBounceAnim,
  ]);

  const handleReset = useCallback(() => {
    if (mode === "daily") {
      const today = getTodayISODate();
      if (dailyLock && dailyLock.dateISO === today) {
        showMessage("You've already played today's Daily. Try Practice mode instead.");
        return;
      }
    }
    resetGameState();
  }, [dailyLock, mode, resetGameState, showMessage]);

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    closeResult();

    if (nextMode === "daily") setSolution(getDailySolution());
    if (nextMode === "practice") setSolution(getRandomPracticeSolution());

    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess("");
    setStatus("playing");
    setMessage(null);
    setLastGameTimeSeconds(null);
    setStartTime(Date.now());

    winBounceAnim.setValue(0);
    shakeAnim.setValue(0);
    resetFlipAnimations();
  };

  const handleGoHome = () => router.back();
  const handleGoPractice = () => handleModeChange("practice");

  const statusText =
    status === "won"
      ? `You solved it in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}.`
      : status === "lost"
      ? "Out of guesses."
      : "";

  const statsForCurrentMode = mode === "daily" ? stats.daily : stats.practice;

  const avgTimeForCurrentMode =
    statsForCurrentMode.gamesWon > 0
      ? statsForCurrentMode.totalTimeSeconds / statsForCurrentMode.gamesWon
      : null;

  const avgGuessesForCurrentMode =
    statsForCurrentMode.gamesWon > 0
      ? statsForCurrentMode.totalGuesses / statsForCurrentMode.gamesWon
      : null;

  const winRate =
    stats.daily.gamesPlayed > 0
      ? Math.round((stats.daily.gamesWon / stats.daily.gamesPlayed) * 100)
      : 0;

  const overlayStatus: "won" | "lost" =
    mode === "daily" && dailyLock && dailyLock.dateISO === todayISO
      ? dailyLock.result
      : status === "won"
      ? "won"
      : "lost";

  const renderTile = (rowIndex: number, colIndex: number) => {
    const guess = guesses[rowIndex];
    const letter =
      guess?.[colIndex] ??
      (rowIndex === guesses.length ? currentGuess[colIndex] ?? "" : "");

    const anim = flipAnims[rowIndex][colIndex];

    let backState: LetterState = "empty";
    if (evaluations[rowIndex] && evaluations[rowIndex][colIndex]) {
      backState = evaluations[rowIndex][colIndex].state;
    } else if (rowIndex < guesses.length) {
      backState = "absent";
    }

    // FRONT FACE (pre-reveal): neutral tile
    const frontBg = letter ? themeCard : emptyTileBg;
    const frontBorder = subtleBorder;
    const frontText = themeText;

    // BACK FACE (post-reveal): colored state
    let backBg = frontBg;
    let backBorder = subtleBorder;
    let backText = themeText;

    if (backState === "correct") {
      backBg = "#22c55e";
      backBorder = "#16a34a";
      backText = "#f9fafb";
    } else if (backState === "present") {
      backBg = "#eab308";
      backBorder = "#ca8a04";
      backText = "#f9fafb";
    } else if (backState === "absent") {
      backBg = "#9ca3af";
      backBorder = "#6b7280";
      backText = "#f9fafb";
    }

    const frontRotateX = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ["0deg", "90deg", "90deg"],
    });

    const backRotateX = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ["-90deg", "0deg", "0deg"],
    });

    return (
      <View key={`${rowIndex}-${colIndex}`} style={styles.tile}>
        {/* Front (neutral) */}
        <Animated.View
          style={[
            styles.tileFace,
            {
              backgroundColor: frontBg,
              borderColor: frontBorder,
              transform: [{ perspective: 800 }, { rotateX: frontRotateX }],
            },
          ]}
        >
          <Text style={[styles.tileText, { color: frontText }]}>
            {letter.toUpperCase()}
          </Text>
        </Animated.View>

        {/* Back (evaluated) */}
        <Animated.View
          style={[
            styles.tileFace,
            {
              backgroundColor: backBg,
              borderColor: backBorder,
              transform: [{ perspective: 800 }, { rotateX: backRotateX }],
            },
          ]}
        >
          <Text style={[styles.tileText, { color: backText }]}>
            {letter.toUpperCase()}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const StatRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: themeSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: themeText }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeBg }]}>
      <View style={[styles.container, { backgroundColor: themeBg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleGoHome} hitSlop={8}>
            <Text style={[styles.backLabel, { color: themeSecondary }]}>←</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeText }]}>WORDLE</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Mode switcher */}
        <View
          style={[
            styles.modeSwitcher,
            { backgroundColor: themeCard, borderColor: themeBorder },
          ]}
        >
          {(["daily", "practice", "stats"] as Mode[]).map((m) => {
            const isActive = mode === m;
            const label = m === "daily" ? "Daily" : m === "practice" ? "Practice" : "Stats";
            return (
              <Pressable
                key={m}
                style={styles.modePillWrapper}
                onPress={() => handleModeChange(m)}
              >
                <View
                  style={[
                    styles.modePill,
                    isActive && { backgroundColor: themeBorder },
                  ]}
                >
                  <Text
                    style={[
                      styles.modePillText,
                      { color: isActive ? themeBg : themeSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Message */}
        {message && (
          <View style={[styles.messageBar, { backgroundColor: themeText }]}>
            <Text style={[styles.messageText, { color: themeBg }]}>{message}</Text>
          </View>
        )}

        {/* Content */}
        {mode === "stats" ? (
          <ScrollView
            contentContainerStyle={styles.statsScreen}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.statsTitle, { color: themeText }]}>Stats</Text>

            <View
              style={[
                styles.statsCard,
                { backgroundColor: themeCard, borderColor: themeBorder },
              ]}
            >
              <Text style={[styles.statsCardTitle, { color: themeText }]}>Daily</Text>
              <StatRow label="Games played" value={String(stats.daily.gamesPlayed)} />
              <StatRow label="Wins" value={`${stats.daily.gamesWon} (${winRate}%)`} />
              <StatRow label="Current streak" value={String(stats.daily.currentStreak)} />
              <StatRow label="Best streak" value={String(stats.daily.bestStreak)} />
              <StatRow
                label="Average time"
                value={
                  stats.daily.gamesWon > 0
                    ? formatSeconds(stats.daily.totalTimeSeconds / stats.daily.gamesWon)
                    : "--"
                }
              />
              <StatRow
                label="Fastest time"
                value={
                  stats.daily.fastestTimeSeconds != null
                    ? formatSeconds(stats.daily.fastestTimeSeconds)
                    : "--"
                }
              />
              <StatRow
                label="Average guesses"
                value={
                  stats.daily.gamesWon > 0
                    ? (stats.daily.totalGuesses / stats.daily.gamesWon).toFixed(2)
                    : "--"
                }
              />
            </View>

            <View
              style={[
                styles.statsCard,
                { backgroundColor: themeCard, borderColor: themeBorder },
              ]}
            >
              <Text style={[styles.statsCardTitle, { color: themeText }]}>Practice</Text>
              <StatRow label="Games played" value={String(stats.practice.gamesPlayed)} />
              <StatRow label="Wins" value={String(stats.practice.gamesWon)} />
              <StatRow label="Current streak" value={String(stats.practice.currentStreak)} />
              <StatRow label="Best streak" value={String(stats.practice.bestStreak)} />
              <StatRow
                label="Average time"
                value={
                  stats.practice.gamesWon > 0
                    ? formatSeconds(stats.practice.totalTimeSeconds / stats.practice.gamesWon)
                    : "--"
                }
              />
              <StatRow
                label="Fastest time"
                value={
                  stats.practice.fastestTimeSeconds != null
                    ? formatSeconds(stats.practice.fastestTimeSeconds)
                    : "--"
                }
              />
              <StatRow
                label="Average guesses"
                value={
                  stats.practice.gamesWon > 0
                    ? (stats.practice.totalGuesses / stats.practice.gamesWon).toFixed(2)
                    : "--"
                }
              />
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Mode title */}
            <View style={styles.modeTitleContainer}>
              <Text style={[styles.modeTitle, { color: themeText }]}>
                {mode === "daily" ? "Daily" : "Practice"}
              </Text>
            </View>

            {/* Grid */}
            <View style={styles.gridContainer}>
              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: shakeAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, -6, 6],
                      }),
                    },
                  ],
                }}
              >
                {Array.from({ length: ROWS }).map((_, rowIndex) => (
                  <Animated.View
                    key={rowIndex}
                    style={[
                      styles.row,
                      status === "won" && {
                        transform: [
                          {
                            translateY: winBounceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -4],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {Array.from({ length: COLS }).map((_, colIndex) =>
                      renderTile(rowIndex, colIndex)
                    )}
                  </Animated.View>
                ))}
              </Animated.View>
            </View>

            {/* Reserved status area */}
            <View style={styles.statusArea}>
              {status !== "playing" ? (
                <View style={styles.statusContainer}>
                  {!!statusText && (
                    <Text style={[styles.statusText, { color: themeText }]}>
                      {statusText}
                    </Text>
                  )}

                  {mode === "practice" && (
                    <Pressable
                      style={[styles.resetButton, { borderColor: themeBorder }]}
                      onPress={handleReset}
                    >
                      <Text style={[styles.resetText, { color: themeBorder }]}>
                        Play Again
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : isDailyLocked ? (
                <View style={styles.statusContainer}>
                  <Text style={[styles.statusText, { color: themeText }]}>
                    You've already played today's Daily.{"\n"}Try Practice mode.
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Keyboard */}
            <View style={styles.keyboardContainer}>
              {KEYBOARD_ROWS.map((row, rowIndex) => {
                const rowLength = row.length;
                const totalGaps = KEY_GAP * (rowLength - 1);
                const availableWidth =
                  SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - totalGaps;
                const keyWidth = availableWidth / rowLength;

                return (
                  <View key={rowIndex} style={styles.keyRow}>
                    {row.map((key) => {
                      if (key === "BACK") {
                        return (
                          <Pressable
                            key={`back-${rowIndex}`}
                            onPress={() => handleKeyPress("BACK")}
                            style={({ pressed }) => [
                              styles.key,
                              styles.backKey,
                              {
                                width: keyWidth * 1.6,
                                opacity: pressed ? 0.72 : 1,
                                backgroundColor: softKeyBg,
                                borderColor: subtleBorder,
                              },
                            ]}
                          >
                            <Text style={[styles.keyLabel, { color: themeText }]}>
                              ⌫
                            </Text>
                          </Pressable>
                        );
                      }

                      const state = keyboardStates.get(key);
                      let bg = softKeyBg;
                      let keyTextColor = themeText;

                      if (state === "correct") {
                        bg = "#22c55e";
                        keyTextColor = "#f9fafb";
                      } else if (state === "present") {
                        bg = "#eab308";
                        keyTextColor = "#f9fafb";
                      } else if (state === "absent") {
                        bg = "#9ca3af";
                        keyTextColor = "#f9fafb";
                      }

                      return (
                        <Pressable
                          key={key}
                          onPress={() => handleKeyPress(key)}
                          style={({ pressed }) => [
                            styles.key,
                            {
                              width: keyWidth,
                              backgroundColor: bg,
                              borderColor: subtleBorder,
                              transform: [{ scale: pressed ? 0.94 : 1 }],
                            },
                          ]}
                        >
                          <Text style={[styles.keyLabel, { color: keyTextColor }]}>
                            {key}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            {/* Enter */}
            <View style={styles.enterContainer}>
              <Pressable
                onPress={handleEnter}
                style={({ pressed }) => [
                  styles.enterButton,
                  {
                    borderColor: themeBorder,
                    backgroundColor: themeBg,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text style={[styles.enterLabel, { color: themeBorder }]}>ENTER</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Result Overlay */}
        <WordleResultOverlay
          visible={showResult && mode !== "stats"}
          mode={mode === "stats" ? "daily" : (mode as "daily" | "practice")}
          status={overlayStatus}
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
          nextDailySecondsRemaining={isDailyLocked ? nextDailySeconds : null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 16,
  },

  header: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backLabel: { fontSize: 20, fontWeight: "900" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 4,
  },

  modeSwitcher: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    marginTop: 8,
    marginBottom: 6,
    borderWidth: 2,
  },
  modePillWrapper: { flex: 1 },
  modePill: {
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
  },
  modePillText: { fontSize: 13, fontWeight: "900" },

  messageBar: {
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  messageText: { fontSize: 12, fontWeight: "800" },

  modeTitleContainer: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  modeTitle: { fontSize: 16, fontWeight: "900" },

  gridContainer: { marginTop: 4, marginBottom: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 2,
  },

  tile: {
    width: 46,
    height: 46,
    marginHorizontal: 2,
    borderRadius: 6,
    position: "relative",
  },
  tileFace: {
    position: "absolute",
    inset: 0,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
  tileText: { fontSize: 24, fontWeight: "900" },

  statusArea: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statusContainer: { alignItems: "center" },
  statusText: { fontSize: 14, textAlign: "center", fontWeight: "800" },

  resetButton: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
  },
  resetText: { fontSize: 13, fontWeight: "900" },

  keyboardContainer: { marginTop: 4 },
  keyRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 2,
  },
  key: {
    minHeight: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: KEY_GAP / 2,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  backKey: { minWidth: 60 },
  keyLabel: { fontSize: 16, fontWeight: "900" },

  enterContainer: { marginTop: 6, alignItems: "center" },
  enterButton: {
    borderRadius: 999,
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderWidth: 2,
  },
  enterLabel: { fontSize: 16, fontWeight: "900" },

  statsScreen: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  statsCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  statsCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  statLabel: { fontSize: 14, fontWeight: "700" },
  statValue: { fontSize: 14, fontWeight: "900" },
});
