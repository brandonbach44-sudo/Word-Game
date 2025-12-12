import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  Pressable,
  StatusBar,
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
  type DailyLockState,
} from "../storage/wordleStorage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SHARE_APP_NAME = "WordEarl";

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

// Keyboard rows WITHOUT Enter (we use custom Enter button below)
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
    const entry = result[i];
    if (entry.state !== "empty") continue;

    const g = entry.letter;
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

type ShareTextArgs = {
  appName: string;
  dateISO: string;
  result: "won" | "lost";
  guessesCount: number;
  emojiGrid: string;
};

function buildEmojiGrid(evals: EvaluatedLetter[][]): string {
  const toEmoji = (state: LetterState) => {
    if (state === "correct") return "🟩";
    if (state === "present") return "🟨";
    return "⬛";
  };

  return evals
    .map((row) => row.map((cell) => toEmoji(cell.state)).join(""))
    .join("\n");
}

function buildDailyShareText({
  appName,
  dateISO,
  result,
  guessesCount,
  emojiGrid,
}: ShareTextArgs): string {
  const header = `${appName} — Daily (${dateISO})`;
  const score = result === "won" ? `${guessesCount}/6` : "X/6";
  return `${header}\n${score}\n\n${emojiGrid}`;
}

export default function WordleGame() {
  const router = useRouter();
  const { background } = useTheme();

  const themeBg = background.backgroundColor ?? "#000000";
  const themeText = background.textColor;
  const themeSecondary = background.secondaryText;
  const themeCard = background.cardColor;
  const themeBorder = background.borderColor;
  const isDark = background.isDark;

  const subtleBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)";
  const softKeyBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const [mode, setMode] = useState<Mode>("daily");
  const [solution, setSolution] = useState<string>(() => getDailySolution());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluatedLetter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [startTime, setStartTime] = useState<number | null>(Date.now());
  const [lastGameTimeSeconds, setLastGameTimeSeconds] = useState<number | null>(
    null
  );

  const [stats, setStats] = useState<{ daily: ModeStats; practice: ModeStats }>({
    daily: createEmptyModeStats(),
    practice: createEmptyModeStats(),
  });

  const [hydrated, setHydrated] = useState(false);
  const [dailyLock, setDailyLock] = useState<DailyLockState | null>(null);
  const [nextDailySeconds, setNextDailySeconds] = useState<number | null>(null);
  const [hasShownDailyLockOverlay, setHasShownDailyLockOverlay] =
    useState(false);

  const [dailyShareText, setDailyShareText] = useState<string | null>(null);

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
          setDailyLock(loadedLock);
          setDailyShareText(loadedLock.shareText ?? null);
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
        if (dailyLock) {
          await saveDailyLock(dailyLock);
        } else {
          await clearDailyLock();
        }
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
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [dailyLock]);

  // Clear share text when the lock is no longer for today
  useEffect(() => {
    const todayISO = getTodayISODate();
    if (dailyLock && dailyLock.dateISO === todayISO) return;
    setDailyShareText(null);
  }, [dailyLock]);

  const keyboardStates = useMemo(() => {
    const stateMap = new Map<string, LetterState>();

    for (const row of evaluations) {
      for (const { letter, state } of row) {
        if (!letter) continue;
        const existing = stateMap.get(letter);

        if (state === "correct") {
          stateMap.set(letter, "correct");
        } else if (state === "present") {
          if (!existing || existing === "absent") stateMap.set(letter, "present");
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

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 1500);
    return () => clearTimeout(id);
  }, [message]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const revealRow = useCallback(
    (rowIndex: number) => {
      const rowAnims = flipAnims[rowIndex];
      const animations = rowAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 140, useNativeDriver: true })
      );
      Animated.stagger(80, animations).start();
    },
    [flipAnims]
  );

  const todayISO = getTodayISODate();
  const isDailyLocked = mode === "daily" && !!dailyLock && dailyLock.dateISO === todayISO;

  useEffect(() => {
    if (!isDailyLocked) setHasShownDailyLockOverlay(false);
  }, [isDailyLocked]);

  useEffect(() => {
    if (mode === "daily" && isDailyLocked && !hasShownDailyLockOverlay) {
      setShowResult(true);
      setHasShownDailyLockOverlay(true);
    }
  }, [mode, isDailyLocked, hasShownDailyLockOverlay]);

  const openResult = useCallback(() => setShowResult(true), []);
  const closeResult = useCallback(() => setShowResult(false), []);

  const startNewGame = useCallback(
    (nextMode: Mode) => {
      if (nextMode === "daily") setSolution(getDailySolution());
      else if (nextMode === "practice") setSolution(getRandomPracticeSolution());

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
    },
    [resetFlipAnimations, shakeAnim, winBounceAnim]
  );

  const updateStatsForGame = useCallback(
    (result: "won" | "lost", guessCount: number, elapsedSeconds: number) => {
      if (mode === "stats") return;

      setStats((prev) => {
        const key = mode === "daily" ? "daily" : "practice";
        const prevMode = prev[key];

        const gamesPlayed = prevMode.gamesPlayed + 1;
        const gamesWon = result === "won" ? prevMode.gamesWon + 1 : prevMode.gamesWon;

        const currentStreak = result === "won" ? prevMode.currentStreak + 1 : 0;
        const bestStreak = Math.max(prevMode.bestStreak, currentStreak);

        const totalTimeSeconds = prevMode.totalTimeSeconds + elapsedSeconds;

        let fastestTimeSeconds = prevMode.fastestTimeSeconds;
        if (result === "won") {
          if (fastestTimeSeconds === null || elapsedSeconds < fastestTimeSeconds) {
            fastestTimeSeconds = elapsedSeconds;
          }
        }

        const totalGuesses = prevMode.totalGuesses + (result === "won" ? guessCount : 0);

        const guessDistribution = { ...prevMode.guessDistribution };
        if (result === "won") {
          guessDistribution[guessCount] = (guessDistribution[guessCount] || 0) + 1;
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
    if (isDailyLocked) {
      showMessage("You've already played today's Daily. Try Practice mode.");
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

    const guessCount = nextGuesses.length;
    let result: "won" | "lost" | null = null;

    if (currentGuess.toUpperCase() === solution.toUpperCase()) {
      setStatus("won");
      result = "won";
      Animated.spring(winBounceAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start(
        () => winBounceAnim.setValue(0)
      );
      openResult();
    } else if (nextGuesses.length === ROWS) {
      setStatus("lost");
      showMessage("Out of guesses");
      result = "lost";
      openResult();
    }

    if (result && startTime) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      setLastGameTimeSeconds(elapsedSeconds);
      updateStatsForGame(result, guessCount, elapsedSeconds);

      if (mode === "daily") {
        const today = getTodayISODate();
        const emojiGrid = buildEmojiGrid(nextEvals);
        const shareText = buildDailyShareText({
          appName: SHARE_APP_NAME,
          dateISO: today,
          result,
          guessesCount: guessCount,
          emojiGrid,
        });

        setDailyShareText(shareText);
        setDailyLock({ dateISO: today, result, shareText });
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
    startNewGame(mode);
  }, [dailyLock, mode, showMessage, startNewGame]);

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    closeResult();
    startNewGame(nextMode);
  };

  const handleGoHome = () => router.back();

  const handleGoPractice = () => {
    setMode("practice");
    closeResult();
    startNewGame("practice");
  };

  const statusText =
    status === "won"
      ? `You solved it in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}.`
      : status === "lost"
      ? "Out of guesses."
      : "";

  const renderTile = (rowIndex: number, colIndex: number) => {
    const guess = guesses[rowIndex];
    const letter =
      guess?.[colIndex] ??
      (rowIndex === guesses.length ? currentGuess[colIndex] ?? "" : "");

    let state: LetterState = "empty";
    if (evaluations[rowIndex] && evaluations[rowIndex][colIndex]) {
      state = evaluations[rowIndex][colIndex].state;
    }

    const anim = flipAnims[rowIndex][colIndex];
    const rotateX = anim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    let backgroundColor = "transparent";
    let borderColor = subtleBorder;
    let textColor = themeText;

    if (state === "correct") {
      backgroundColor = "#22c55e";
      borderColor = "#16a34a";
      textColor = "#f9fafb";
    } else if (state === "present") {
      backgroundColor = "#eab308";
      borderColor = "#ca8a04";
      textColor = "#f9fafb";
    } else if (state === "absent" && letter) {
      backgroundColor = "#9ca3af";
      borderColor = "#6b7280";
      textColor = "#f9fafb";
    } else if (letter) {
      backgroundColor = themeCard;
      borderColor = subtleBorder;
      textColor = themeText;
    }

    const isCurrentRow = rowIndex === guesses.length;

    return (
      <Animated.View
        key={`${rowIndex}-${colIndex}`}
        style={[
          styles.tile,
          {
            backgroundColor,
            borderColor,
            transform: [{ rotateX }],
            opacity: isCurrentRow && !letter ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[styles.tileText, { color: textColor }]}>
          {letter.toUpperCase()}
        </Text>
      </Animated.View>
    );
  };

  const statsForOverlay = mode === "daily" ? stats.daily : stats.practice;

  const avgTimeForOverlay =
    statsForOverlay.gamesWon > 0
      ? statsForOverlay.totalTimeSeconds / statsForOverlay.gamesWon
      : null;

  const avgGuessesForOverlay =
    statsForOverlay.gamesWon > 0
      ? statsForOverlay.totalGuesses / statsForOverlay.gamesWon
      : null;

  const dailyWinRate =
    stats.daily.gamesPlayed > 0
      ? Math.round((stats.daily.gamesWon / stats.daily.gamesPlayed) * 100)
      : 0;

  const overlayStatus: "won" | "lost" =
    mode === "daily" && dailyLock && dailyLock.dateISO === todayISO
      ? dailyLock.result
      : status === "won"
      ? "won"
      : "lost";

  const overlayShareText =
    dailyLock && dailyLock.dateISO === todayISO
      ? dailyLock.shareText ?? dailyShareText
      : dailyShareText;

  const content = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleGoHome} hitSlop={8}>
          <Text style={[styles.backLabel, { color: themeSecondary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: themeText }]}>WORDLE</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Mode switcher */}
      <View style={[styles.modeSwitcher, { backgroundColor: themeCard, borderColor: themeBorder }]}>
        {(["daily", "practice", "stats"] as Mode[]).map((m) => {
          const isActive = mode === m;
          return (
            <Pressable key={m} style={styles.modePillWrapper} onPress={() => handleModeChange(m)}>
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
                  {m === "daily" ? "Daily" : m === "practice" ? "Practice" : "Stats"}
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
        <View style={styles.statsScreen}>
          <Text style={[styles.statsTitle, { color: themeText }]}>Stats</Text>

          <View style={styles.statsScrollContainer}>
            <View
              style={[
                styles.statsSectionCard,
                { backgroundColor: themeCard, borderColor: themeBorder },
              ]}
            >
              <Text style={[styles.statsSectionTitle, { color: themeText }]}>Daily</Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Games played: {stats.daily.gamesPlayed}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Wins: {stats.daily.gamesWon} ({dailyWinRate}%)
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Current streak: {stats.daily.currentStreak}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Best streak: {stats.daily.bestStreak}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Avg time:{" "}
                {stats.daily.gamesWon > 0
                  ? formatSeconds(stats.daily.totalTimeSeconds / stats.daily.gamesWon)
                  : "--"}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Fastest time:{" "}
                {stats.daily.fastestTimeSeconds != null
                  ? formatSeconds(stats.daily.fastestTimeSeconds)
                  : "--"}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Avg guesses:{" "}
                {stats.daily.gamesWon > 0
                  ? (stats.daily.totalGuesses / stats.daily.gamesWon).toFixed(2)
                  : "--"}
              </Text>
            </View>

            <View
              style={[
                styles.statsSectionCard,
                { backgroundColor: themeCard, borderColor: themeBorder },
              ]}
            >
              <Text style={[styles.statsSectionTitle, { color: themeText }]}>
                Practice
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Games played: {stats.practice.gamesPlayed}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Wins: {stats.practice.gamesWon}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Current streak: {stats.practice.currentStreak}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Best streak: {stats.practice.bestStreak}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Avg time:{" "}
                {stats.practice.gamesWon > 0
                  ? formatSeconds(
                      stats.practice.totalTimeSeconds / stats.practice.gamesWon
                    )
                  : "--"}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Fastest time:{" "}
                {stats.practice.fastestTimeSeconds != null
                  ? formatSeconds(stats.practice.fastestTimeSeconds)
                  : "--"}
              </Text>
              <Text style={[styles.statsText, { color: themeSecondary }]}>
                Avg guesses:{" "}
                {stats.practice.gamesWon > 0
                  ? (stats.practice.totalGuesses / stats.practice.gamesWon).toFixed(2)
                  : "--"}
              </Text>
            </View>
          </View>
        </View>
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
              {Array.from({ length: ROWS }).map((_, rowIndex) => {
                const RowComponent = status === "won" ? Animated.View : View;

                return (
                  <RowComponent
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
                  </RowComponent>
                );
              })}
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
                    style={[
                      styles.resetButton,
                      { borderColor: themeBorder },
                    ]}
                    onPress={handleReset}
                  >
                    <Text style={[styles.resetText, { color: themeBorder }]}>
                      Play Again
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : isDailyLocked && mode === "daily" ? (
              <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: themeText }]}>
                  You&apos;ve already played today&apos;s Daily.{"\n"}
                  Come back tomorrow or switch to Practice.
                </Text>
              </View>
            ) : null}
          </View>

          {/* Keyboard */}
          <View style={styles.keyboardContainer}>
            {KEYBOARD_ROWS.map((row, rowIndex) => {
              const rowLength = row.length;
              const totalGaps = KEY_GAP * (rowLength - 1);
              const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - totalGaps;
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
                              opacity: pressed ? 0.75 : 1,
                              backgroundColor: softKeyBg,
                              borderColor: subtleBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.keyLabel, { color: themeText }]}>⌫</Text>
                        </Pressable>
                      );
                    }

                    const state = keyboardStates.get(key);
                    let bg = softKeyBg;
                    let labelColor = themeText;

                    if (state === "correct") {
                      bg = "#22c55e";
                      labelColor = "#f9fafb";
                    } else if (state === "present") {
                      bg = "#eab308";
                      labelColor = "#f9fafb";
                    } else if (state === "absent") {
                      bg = "#9ca3af";
                      labelColor = "#f9fafb";
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
                        <Text style={[styles.keyLabel, { color: labelColor }]}>
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

      {/* Overlay */}
      <WordleResultOverlay
        visible={showResult && mode !== "stats"}
        mode={mode === "stats" ? "daily" : (mode as "daily" | "practice")}
        status={overlayStatus}
        solutionWord={solution}
        guessesCount={guesses.length}
        timeSeconds={lastGameTimeSeconds}
        currentStreak={statsForOverlay.currentStreak}
        bestStreak={statsForOverlay.bestStreak}
        averageTimeSeconds={avgTimeForOverlay ?? null}
        averageGuesses={avgGuessesForOverlay ?? null}
        onClose={closeResult}
        onPlayAgain={handleReset}
        onGoHome={handleGoHome}
        onGoPractice={handleGoPractice}
        shareText={mode === "daily" ? overlayShareText : null}
        nextDailySecondsRemaining={isDailyLocked ? nextDailySeconds : null}
      />
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeBg }]}>
      <StatusBar
        barStyle={background.statusBar === "light" ? "light-content" : "dark-content"}
      />
      {background.type === "image" && background.backgroundImage ? (
        <ImageBackground
          source={background.backgroundImage}
          style={[styles.container, { backgroundColor: "transparent" }]}
          resizeMode="cover"
        >
          {content}
        </ImageBackground>
      ) : (
        <View style={[styles.container, { backgroundColor: themeBg }]}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  backLabel: { fontSize: 20 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
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
  modePillText: { fontSize: 13, fontWeight: "800" },

  messageBar: {
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  messageText: { fontSize: 12, fontWeight: "700" },

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
  statusText: { fontSize: 14, textAlign: "center", fontWeight: "700" },

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
  keyLabel: { fontSize: 16, fontWeight: "800" },

  enterContainer: { marginTop: 6, alignItems: "center" },
  enterButton: {
    borderRadius: 999,
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderWidth: 2,
  },
  enterLabel: { fontSize: 16, fontWeight: "900" },

  statsScreen: { flex: 1, marginTop: 8 },
  statsTitle: { fontSize: 18, fontWeight: "900", marginBottom: 8, textAlign: "center" },
  statsScrollContainer: { maxHeight: SCREEN_HEIGHT * 0.62 },
  statsSectionCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  statsSectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 6 },
  statsText: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
});
