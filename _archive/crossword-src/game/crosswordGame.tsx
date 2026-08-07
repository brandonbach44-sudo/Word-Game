import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../shared/ThemeContext";
import { AchievementPopup, AchievementLike } from "../../shared/AchievementPopup";
import { CROSSWORD_PUZZLES, CrosswordPuzzle } from "../data/crossword_puzzles";
import {
  GRID_SIZE,
  buildGridMeta,
  blackSetOf,
  createEmptyFilled,
  isGridComplete,
  getPuzzleForDate,
  getTodayISODate,
  getSecondsUntilNextMidnight,
  formatSeconds,
  formatCountdown,
  getSlotCells,
  CellMeta,
} from "../utils/crosswordUtils";
import {
  loadCrosswordStats,
  saveCrosswordStats,
  loadDailyLock,
  saveDailyLock,
  clearDailyLock,
  loadDailyProgress,
  saveDailyProgress,
  clearDailyProgress,
  DailyLockState,
} from "../storage/crosswordStorage";
import CrosswordResultOverlay from "../components/CrosswordResultOverlay";

type Screen = "menu" | "game";
type MenuTab = "play" | "stats";
type Direction = "A" | "D";

type ModeStats = {
  gamesPlayed: number;
  currentStreak: number;
  bestStreak: number;
  totalTimeSeconds: number;
  fastestTimeSeconds: number | null;
  totalMistakes: number;
  perfectSolves: number;
  hintsUsedTotal: number;
};

type CrosswordStats = {
  daily: ModeStats;
  dailyHistory: Record<string, { mistakes: number; timeSeconds: number; hintsUsed: number }>;
};

type Achievement = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
};

function createEmptyModeStats(): ModeStats {
  return {
    gamesPlayed: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalTimeSeconds: 0,
    fastestTimeSeconds: null,
    totalMistakes: 0,
    perfectSolves: 0,
    hintsUsedTotal: 0,
  };
}

function createDefaultStats(): CrosswordStats {
  return { daily: createEmptyModeStats(), dailyHistory: {} };
}

const KEYBOARD_ROWS: string[][] = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  [..."ZXCVBNM".split(""), "BACK"],
];

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
  const showProgress = !achievement.unlocked && achievement.progress !== undefined && achievement.progress > 0;
  return (
    <View style={[styles.achievementCard, { backgroundColor: cardColor, borderColor, opacity }]}>
      <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
      <Text style={[styles.achievementName, { color: textColor }]}>{achievement.name}</Text>
      <Text style={[styles.achievementDesc, { color: secondaryText }]}>{achievement.description}</Text>
      {showProgress && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(achievement.progress! * 100)}%` }]} />
        </View>
      )}
    </View>
  );
};

export default function CrosswordGame() {
  const router = useRouter();
  const { background } = useTheme();

  const BG = background.backgroundColor ?? "#f9f5ec";
  const TEXT = background.textColor ?? "#111827";
  const SUBTEXT = background.secondaryText ?? "#6b7280";
  const CARD = background.cardColor ?? "#ffffff";
  const BORDER = background.borderColor ?? "#e5e7eb";
  const ACCENT = "#4ecca3";
  const MISTAKE_COLOR = "#e94560";

  const [screen, setScreen] = useState<Screen>("menu");
  const [menuTab, setMenuTab] = useState<MenuTab>("play");

  const puzzle: CrosswordPuzzle = useMemo(() => getPuzzleForDate(CROSSWORD_PUZZLES), []);
  const gridMeta = useMemo(() => buildGridMeta(puzzle), [puzzle]);
  const black = useMemo(() => blackSetOf(puzzle), [puzzle]);

  const [filled, setFilled] = useState<string[][]>(() => createEmptyFilled());
  const [selected, setSelected] = useState<{ row: number; col: number }>(() => {
    // default to the first non-black cell
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!gridMeta.cells[r][c].black) return { row: r, col: c };
      }
    }
    return { row: 0, col: 0 };
  });
  const [direction, setDirection] = useState<Direction>("A");
  const [clueTab, setClueTab] = useState<Direction>("A");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const [stats, setStats] = useState<CrosswordStats>(() => createDefaultStats());
  const [hydrated, setHydrated] = useState(false);
  const [dailyLock, setDailyLock] = useState<DailyLockState | null>(null);
  const [nextDailySeconds, setNextDailySeconds] = useState<number | null>(null);

  const [showResult, setShowResult] = useState(false);
  const [overlayShareText, setOverlayShareText] = useState("");
  const [overlayHasGameData, setOverlayHasGameData] = useState(true);

  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const sessionStartUnlockedRef = useRef<Set<string> | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayISO = getTodayISODate();

  // ── Hydrate from storage ──
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [savedStats, savedLock, savedProgress] = await Promise.all([
        loadCrosswordStats(),
        loadDailyLock(),
        loadDailyProgress(),
      ]);
      if (!isMounted) return;

      if (savedStats) {
        setStats({
          daily: { ...createEmptyModeStats(), ...savedStats.daily },
          dailyHistory: savedStats.dailyHistory ?? {},
        });
      }

      const lockedToday = savedLock && savedLock.dateISO === todayISO;
      if (lockedToday && savedLock) {
        setDailyLock(savedLock);
        setIsComplete(true);
        if (savedLock.filled) setFilled(savedLock.filled);
        setElapsedSeconds(savedLock.timeSeconds);
        setHintsUsed(savedLock.hintsUsed);
        setMistakeCount(savedLock.mistakes ?? 0);
      } else if (savedProgress && savedProgress.dateISO === todayISO) {
        setFilled(savedProgress.filled);
        setElapsedSeconds(savedProgress.elapsedSeconds);
        setHintsUsed(savedProgress.hintsUsed);
        setMistakeCount(savedProgress.mistakeCount ?? 0);
      }

      setHydrated(true);
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Timer ──
  useEffect(() => {
    if (screen !== "game" || isComplete) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, isComplete]);

  // ── Countdown to next daily (shown after completion) ──
  useEffect(() => {
    if (!isComplete) return;
    setNextDailySeconds(getSecondsUntilNextMidnight());
    const id = setInterval(() => setNextDailySeconds(getSecondsUntilNextMidnight()), 1000);
    return () => clearInterval(id);
  }, [isComplete]);

  // ── Autosave progress ──
  useEffect(() => {
    if (!hydrated || isComplete) return;
    saveDailyProgress({
      dateISO: todayISO,
      filled,
      elapsedSeconds,
      hintsUsed,
      mistakeCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled, elapsedSeconds, hintsUsed, mistakeCount, hydrated, isComplete]);

  // ── Achievements (computed from stats) ──
  const achievements: Achievement[] = useMemo(() => {
    const s = stats.daily;
    const winRate = s.gamesPlayed > 0 ? 100 : 0;
    return [
      { id: "first_win", emoji: "✅", name: "First Solve", description: "Complete your first crossword", unlocked: s.gamesPlayed >= 1 },
      { id: "perfect", emoji: "⚡", name: "Flawless", description: "Solve with zero mistakes and zero hints", unlocked: s.perfectSolves >= 1 },
      { id: "perfect_5", emoji: "🎯", name: "Sharp Solver", description: "Solve flawlessly 5 times", unlocked: s.perfectSolves >= 5, progress: Math.min(s.perfectSolves / 5, 1) },
      { id: "streak_3", emoji: "🌱", name: "On a Roll", description: "Reach a 3-day streak", unlocked: s.bestStreak >= 3, progress: Math.min(s.bestStreak / 3, 1) },
      { id: "streak_7", emoji: "🔥", name: "Hot Streak", description: "Reach a 7-day streak", unlocked: s.bestStreak >= 7, progress: Math.min(s.bestStreak / 7, 1) },
      { id: "streak_14", emoji: "🌶️", name: "Spicy", description: "Reach a 14-day streak", unlocked: s.bestStreak >= 14, progress: Math.min(s.bestStreak / 14, 1) },
      { id: "streak_30", emoji: "🏆", name: "Champion", description: "Reach a 30-day streak", unlocked: s.bestStreak >= 30, progress: Math.min(s.bestStreak / 30, 1) },
      { id: "speed_120", emoji: "⏱️", name: "Quick Thinker", description: "Solve in under 2 minutes", unlocked: s.fastestTimeSeconds != null && s.fastestTimeSeconds <= 120 },
      { id: "speed_60", emoji: "💨", name: "Lightning", description: "Solve in under 1 minute", unlocked: s.fastestTimeSeconds != null && s.fastestTimeSeconds <= 60 },
      { id: "no_hints_10", emoji: "🧠", name: "All Me", description: "Solve 10 puzzles without using a hint", unlocked: (s.gamesPlayed - (s.hintsUsedTotal > 0 ? 0 : 0)) >= 10 && s.hintsUsedTotal === 0 && s.gamesPlayed >= 10, progress: Math.min(s.gamesPlayed / 10, 1) },
      { id: "play_25", emoji: "🧩", name: "Puzzle Regular", description: "Complete 25 puzzles", unlocked: s.gamesPlayed >= 25, progress: Math.min(s.gamesPlayed / 25, 1) },
      { id: "play_100", emoji: "💯", name: "Century Club", description: "Complete 100 puzzles", unlocked: s.gamesPlayed >= 100, progress: Math.min(s.gamesPlayed / 100, 1) },
      { id: "play_365", emoji: "🗓️", name: "Full Year", description: "Complete 365 puzzles", unlocked: s.gamesPlayed >= 365, progress: Math.min(s.gamesPlayed / 365, 1) },
      { id: "early_bird", emoji: "🌅", name: "Early Bird", description: "Complete a daily challenge", unlocked: s.gamesPlayed >= 1 },
    ];
  }, [stats]);

  useEffect(() => {
    if (hydrated && sessionStartUnlockedRef.current === null) {
      sessionStartUnlockedRef.current = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));
    }
  }, [hydrated, achievements]);

  useEffect(() => {
    if (!hydrated || sessionStartUnlockedRef.current === null) return;
    const newlyUnlocked = achievements.filter((a) => a.unlocked && !sessionStartUnlockedRef.current!.has(a.id));
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((a) => sessionStartUnlockedRef.current!.add(a.id));
      setPendingAchievements((prev) => [...prev, ...newlyUnlocked]);
    }
  }, [achievements, hydrated]);

  // ── Cell selection & typing ──
  const activeSlotIdx = useMemo(() => {
    const cell = gridMeta.cells[selected.row][selected.col];
    if (direction === "A") return cell.acrossSlotIdx ?? cell.downSlotIdx;
    return cell.downSlotIdx ?? cell.acrossSlotIdx;
  }, [selected, direction, gridMeta]);

  const activeSlot = activeSlotIdx != null ? puzzle.slots[activeSlotIdx] : null;
  const activeCells = useMemo(() => (activeSlot ? new Set(getSlotCells(activeSlot).map(([r, c]) => `${r},${c}`)) : new Set<string>()), [activeSlot]);

  const selectCell = useCallback(
    (r: number, c: number) => {
      if (gridMeta.cells[r][c].black || isComplete) return;
      const cell = gridMeta.cells[r][c];
      if (r === selected.row && c === selected.col) {
        // toggle direction if the cell supports both
        if (cell.acrossSlotIdx != null && cell.downSlotIdx != null) {
          setDirection((d) => (d === "A" ? "D" : "A"));
        }
      } else {
        setSelected({ row: r, col: c });
        if (direction === "A" && cell.acrossSlotIdx == null && cell.downSlotIdx != null) setDirection("D");
        if (direction === "D" && cell.downSlotIdx == null && cell.acrossSlotIdx != null) setDirection("A");
      }
    },
    [selected, direction, gridMeta, isComplete]
  );

  const advanceCell = useCallback(
    (fromR: number, fromC: number, dir: Direction) => {
      const dr = dir === "D" ? 1 : 0;
      const dc = dir === "A" ? 1 : 0;
      let r = fromR + dr;
      let c = fromC + dc;
      if (r < GRID_SIZE && c < GRID_SIZE && !gridMeta.cells[r][c].black) {
        setSelected({ row: r, col: c });
      }
    },
    [gridMeta]
  );

  const retreatCell = useCallback(
    (fromR: number, fromC: number, dir: Direction) => {
      const dr = dir === "D" ? -1 : 0;
      const dc = dir === "A" ? -1 : 0;
      let r = fromR + dr;
      let c = fromC + dc;
      if (r >= 0 && c >= 0 && !gridMeta.cells[r][c].black) {
        setSelected({ row: r, col: c });
      }
    },
    [gridMeta]
  );

  const finishIfComplete = useCallback(
    (nextFilled: string[][]) => {
      if (isComplete) return;
      if (isGridComplete(nextFilled, gridMeta.answers, black)) {
        const finalMistakes = mistakeCount; // cumulative wrong keystrokes this session
        const finalTime = elapsedSeconds;
        setIsComplete(true);
        if (timerRef.current) clearInterval(timerRef.current);

        const isPerfect = finalMistakes === 0 && hintsUsed === 0;
        const shareText = [
          `Crossword ${todayISO}`,
          isPerfect ? "Flawless solve! ⚡" : `Solved in ${formatSeconds(finalTime)}${hintsUsed > 0 ? ` (${hintsUsed} hint${hintsUsed === 1 ? "" : "s"})` : ""}`,
        ].join("\n");

        const lock: DailyLockState = {
          dateISO: todayISO,
          timeSeconds: finalTime,
          mistakes: finalMistakes,
          hintsUsed,
          filled: nextFilled,
          shareText,
        };
        saveDailyLock(lock);
        clearDailyProgress();
        setDailyLock(lock);

        setStats((prev) => {
          const s = prev.daily;
          const wasYesterday = (() => {
            const dates = Object.keys(prev.dailyHistory).sort();
            if (dates.length === 0) return false;
            const last = dates[dates.length - 1];
            const lastDate = new Date(last + "T00:00:00");
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return (
              lastDate.getFullYear() === yesterday.getFullYear() &&
              lastDate.getMonth() === yesterday.getMonth() &&
              lastDate.getDate() === yesterday.getDate()
            );
          })();
          const newStreak = wasYesterday || s.gamesPlayed === 0 ? s.currentStreak + 1 : 1;
          const next: CrosswordStats = {
            daily: {
              gamesPlayed: s.gamesPlayed + 1,
              currentStreak: newStreak,
              bestStreak: Math.max(s.bestStreak, newStreak),
              totalTimeSeconds: s.totalTimeSeconds + finalTime,
              fastestTimeSeconds: s.fastestTimeSeconds == null ? finalTime : Math.min(s.fastestTimeSeconds, finalTime),
              totalMistakes: s.totalMistakes + finalMistakes,
              perfectSolves: s.perfectSolves + (isPerfect ? 1 : 0),
              hintsUsedTotal: s.hintsUsedTotal + hintsUsed,
            },
            dailyHistory: {
              ...prev.dailyHistory,
              [todayISO]: { mistakes: finalMistakes, timeSeconds: finalTime, hintsUsed },
            },
          };
          saveCrosswordStats(next);
          return next;
        });

        setOverlayShareText(shareText);
        setOverlayHasGameData(true);
        setShowResult(true);
      }
    },
    [isComplete, gridMeta.answers, black, elapsedSeconds, hintsUsed, mistakeCount, todayISO]
  );

  const typeLetter = useCallback(
    (letter: string) => {
      if (isComplete) return;
      const { row, col } = selected;
      if (gridMeta.cells[row][col].black) return;
      if (letter !== gridMeta.answers[row][col]) {
        setMistakeCount((m) => m + 1);
      }
      setFilled((prev) => {
        const next = prev.map((row2) => [...row2]);
        next[row][col] = letter;
        finishIfComplete(next);
        return next;
      });
      advanceCell(row, col, direction);
    },
    [selected, direction, isComplete, gridMeta, advanceCell, finishIfComplete]
  );

  const backspace = useCallback(() => {
    if (isComplete) return;
    const { row, col } = selected;
    setFilled((prev) => {
      const next = prev.map((row2) => [...row2]);
      if (next[row][col]) {
        next[row][col] = "";
      } else {
        retreatCell(row, col, direction);
      }
      return next;
    });
  }, [selected, direction, isComplete, retreatCell]);

  const useHint = useCallback(() => {
    if (isComplete || !activeSlot) return;
    // Reveal the first incorrect/empty cell in the active word.
    const cells = getSlotCells(activeSlot);
    for (const [r, c] of cells) {
      if (filled[r][c] !== gridMeta.answers[r][c]) {
        setFilled((prev) => {
          const next = prev.map((row2) => [...row2]);
          next[r][c] = gridMeta.answers[r][c];
          finishIfComplete(next);
          return next;
        });
        setHintsUsed((h) => h + 1);
        return;
      }
    }
  }, [activeSlot, filled, gridMeta.answers, isComplete, finishIfComplete]);

  const jumpToSlot = useCallback((slotIdx: number) => {
    const slot = puzzle.slots[slotIdx];
    setSelected({ row: slot.row, col: slot.col });
    setDirection(slot.dir);
    setClueTab(slot.dir);
  }, [puzzle]);

  const startGame = () => {
    setScreen("game");
    if (dailyLock) {
      setShowResult(false);
    }
  };

  const openTodayResult = () => {
    // Reconstruct the full result view from the saved lock, same as Wordle's
    // "View Results" — reopening a completed daily should show real stats,
    // not a generic placeholder.
    setOverlayHasGameData(true);
    setOverlayShareText(dailyLock?.shareText ?? `Crossword ${todayISO} — already solved.`);
    setShowResult(true);
  };

  // ── Render helpers ──
  const acrossSlots = puzzle.slots
    .map((s, i) => ({ slot: s, idx: i }))
    .filter((x) => x.slot.dir === "A")
    .sort((a, b) => (gridMeta.cells[a.slot.row][a.slot.col].number ?? 0) - (gridMeta.cells[b.slot.row][b.slot.col].number ?? 0));
  const downSlots = puzzle.slots
    .map((s, i) => ({ slot: s, idx: i }))
    .filter((x) => x.slot.dir === "D")
    .sort((a, b) => (gridMeta.cells[a.slot.row][a.slot.col].number ?? 0) - (gridMeta.cells[b.slot.row][b.slot.col].number ?? 0));

  const cellSize = 44;

  const renderCell = (r: number, c: number) => {
    const meta = gridMeta.cells[r][c];
    if (meta.black) {
      return <View key={`${r}-${c}`} style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: TEXT }]} />;
    }
    const isSelected = selected.row === r && selected.col === c;
    const isActive = activeCells.has(`${r},${c}`);
    const value = filled[r][c];
    const isWrong = isComplete === false && value !== "" && value !== gridMeta.answers[r][c];

    let bg = CARD;
    if (isSelected) bg = ACCENT;
    else if (isActive) bg = background.isDark ? "rgba(78,204,163,0.25)" : "#dff5ec";

    return (
      <Pressable key={`${r}-${c}`} onPress={() => selectCell(r, c)} style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: bg, borderColor: BORDER }]}>
        {meta.number != null && <Text style={[styles.cellNumber, { color: isSelected ? "#0b3b2e" : SUBTEXT }]}>{meta.number}</Text>}
        <Text style={[styles.cellLetter, { color: isSelected ? "#0b3b2e" : isWrong ? MISTAKE_COLOR : TEXT }]}>{value}</Text>
      </Pressable>
    );
  };

  const renderKeyboardKey = (key: string) => {
    const isBack = key === "BACK";
    return (
      <Pressable
        key={key}
        onPress={() => (isBack ? backspace() : typeLetter(key))}
        style={({ pressed }) => [
          styles.key,
          isBack && styles.keyWide,
          { backgroundColor: CARD, borderColor: BORDER, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.keyText, { color: TEXT }]}>{isBack ? "⌫" : key}</Text>
      </Pressable>
    );
  };

  if (!hydrated) return <SafeAreaView style={[styles.container, { backgroundColor: BG }]} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BG }]}>
      {screen === "menu" ? (
        <>
          <View style={styles.menuHeader}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={[styles.backText, { color: SUBTEXT }]}>← Back</Text>
            </Pressable>
            <Text style={[styles.gameTitle, { color: TEXT }]}>Crossword</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.tabRow, { borderColor: BORDER }]}>
            <Pressable onPress={() => setMenuTab("play")} style={styles.tabButton}>
              <Text style={[styles.tabText, { color: menuTab === "play" ? TEXT : SUBTEXT, fontWeight: menuTab === "play" ? "800" : "600" }]}>Play</Text>
              {menuTab === "play" && <View style={[styles.tabUnderline, { backgroundColor: ACCENT }]} />}
            </Pressable>
            <Pressable onPress={() => setMenuTab("stats")} style={styles.tabButton}>
              <Text style={[styles.tabText, { color: menuTab === "stats" ? TEXT : SUBTEXT, fontWeight: menuTab === "stats" ? "800" : "600" }]}>Stats</Text>
              {menuTab === "stats" && <View style={[styles.tabUnderline, { backgroundColor: ACCENT }]} />}
            </Pressable>
          </View>

          {menuTab === "play" ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>
              <View style={[styles.dailyCard, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Text style={[styles.dailyLabel, { color: SUBTEXT }]}>Daily Challenge</Text>
                <Text style={[styles.dailyDate, { color: TEXT }]}>{todayISO}</Text>
                <Text style={[styles.dailySize, { color: SUBTEXT }]}>7×7 · {puzzle.slots.length} clues</Text>

                {isComplete ? (
                  <>
                    <View style={[styles.completeBadge, { borderColor: ACCENT }]}>
                      <Text style={[styles.completeBadgeText, { color: ACCENT }]}>✓ Completed</Text>
                    </View>
                    <Pressable onPress={openTodayResult} style={({ pressed }) => [styles.primaryButton, { backgroundColor: CARD, borderColor: BORDER, opacity: pressed ? 0.75 : 1 }]}>
                      <Text style={[styles.primaryButtonText, { color: TEXT }]}>View Result</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={startGame} style={({ pressed }) => [styles.primaryButton, { backgroundColor: ACCENT, borderColor: ACCENT, opacity: pressed ? 0.85 : 1 }]}>
                    <Text style={[styles.primaryButtonText, { color: "#0b3b2e" }]}>{elapsedSeconds > 0 ? "Resume" : "Play"}</Text>
                  </Pressable>
                )}

                {stats.daily.currentStreak > 0 && (
                  <Text style={[styles.streakText, { color: SUBTEXT }]}>🔥 {stats.daily.currentStreak} day streak</Text>
                )}
              </View>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>
              <Text style={[styles.sectionTitle, { color: TEXT }]}>Overview</Text>
              <View style={styles.statsGrid}>
                <StatBox label="Played" value={`${stats.daily.gamesPlayed}`} textColor={TEXT} subColor={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                <StatBox label="Current streak" value={`${stats.daily.currentStreak}`} textColor={TEXT} subColor={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                <StatBox label="Best streak" value={`${stats.daily.bestStreak}`} textColor={TEXT} subColor={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                <StatBox label="Flawless solves" value={`${stats.daily.perfectSolves}`} textColor={TEXT} subColor={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                <StatBox
                  label="Fastest"
                  value={stats.daily.fastestTimeSeconds != null ? formatSeconds(stats.daily.fastestTimeSeconds) : "—"}
                  textColor={TEXT}
                  subColor={SUBTEXT}
                  cardColor={CARD}
                  borderColor={BORDER}
                />
                <StatBox
                  label="Avg time"
                  value={stats.daily.gamesPlayed > 0 ? formatSeconds(stats.daily.totalTimeSeconds / stats.daily.gamesPlayed) : "—"}
                  textColor={TEXT}
                  subColor={SUBTEXT}
                  cardColor={CARD}
                  borderColor={BORDER}
                />
              </View>

              <Text style={[styles.sectionTitle, { color: TEXT, marginTop: 28 }]}>
                Achievements ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
              </Text>

              {achievements.filter((a) => a.unlocked).length > 0 && (
                <View style={styles.achievementsGrid}>
                  {achievements.filter((a) => a.unlocked).map((a) => (
                    <AchievementCard key={a.id} achievement={a} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  ))}
                </View>
              )}

              {achievements.filter((a) => a.unlocked).length > 0 && achievements.filter((a) => !a.unlocked).length > 0 && (
                <View style={styles.lockedDivider}>
                  <View style={[styles.dividerLine, { backgroundColor: BORDER }]} />
                  <Text style={[styles.dividerText, { color: SUBTEXT }]}>Locked</Text>
                  <View style={[styles.dividerLine, { backgroundColor: BORDER }]} />
                </View>
              )}

              {achievements.filter((a) => !a.unlocked).length > 0 && (
                <View style={styles.achievementsGrid}>
                  {achievements.filter((a) => !a.unlocked).map((a) => (
                    <AchievementCard key={a.id} achievement={a} textColor={TEXT} secondaryText={SUBTEXT} cardColor={CARD} borderColor={BORDER} />
                  ))}
                </View>
              )}

              {/* How to Play */}
              <Text style={[styles.sectionTitle, { color: TEXT, marginTop: 28 }]}>How to Play</Text>
              <View style={[styles.rulesCard, { backgroundColor: CARD, borderColor: BORDER }]}>
                {[
                  "Fill every cell using the across and down clues",
                  "Tap a cell to select it — tap again to switch between across and down",
                  "Tap a clue in the list to jump straight to that word",
                  "Use Hint to reveal the next letter in the selected word",
                  "A new puzzle unlocks every day",
                  "Solve with no mistakes and no hints for a Flawless solve",
                ].map((rule, i) => (
                  <View key={i} style={styles.ruleItem}>
                    <Text style={[styles.ruleNumber, { color: ACCENT }]}>{i + 1}</Text>
                    <Text style={[styles.ruleText, { color: SUBTEXT }]}>{rule}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </>
      ) : (
        <>
          <View style={styles.gameHeader}>
            <Pressable onPress={() => setScreen("menu")} hitSlop={8}>
              <Text style={[styles.backText, { color: SUBTEXT }]}>← Menu</Text>
            </Pressable>
            <Text style={[styles.modeTitle, { color: SUBTEXT }]}>{formatSeconds(elapsedSeconds)}</Text>
            <Pressable onPress={useHint} hitSlop={8} disabled={isComplete}>
              <Text style={[styles.hintText, { color: isComplete ? SUBTEXT : ACCENT, opacity: isComplete ? 0.4 : 1 }]}>Hint</Text>
            </Pressable>
          </View>

          {activeSlot && (
            <View style={[styles.cluePill, { borderColor: BORDER, backgroundColor: CARD }]}>
              <Text style={[styles.clueNumber, { color: ACCENT }]}>
                {gridMeta.cells[activeSlot.row][activeSlot.col].number}
                {direction === "A" ? "A" : "D"}
              </Text>
              <Text style={[styles.clueText, { color: TEXT }]} numberOfLines={2}>
                {activeSlot.clue}
              </Text>
            </View>
          )}

          <View style={styles.gridWrap}>
            {Array.from({ length: GRID_SIZE }).map((_, r) => (
              <View key={r} style={styles.gridRow}>
                {Array.from({ length: GRID_SIZE }).map((__, c) => renderCell(r, c))}
              </View>
            ))}
          </View>

          <View style={[styles.clueTabRow, { borderColor: BORDER }]}>
            <Pressable onPress={() => setClueTab("A")} style={styles.clueTabButton}>
              <Text style={[styles.clueTabText, { color: clueTab === "A" ? TEXT : SUBTEXT, fontWeight: clueTab === "A" ? "800" : "600" }]}>Across</Text>
            </Pressable>
            <Pressable onPress={() => setClueTab("D")} style={styles.clueTabButton}>
              <Text style={[styles.clueTabText, { color: clueTab === "D" ? TEXT : SUBTEXT, fontWeight: clueTab === "D" ? "800" : "600" }]}>Down</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.clueList} contentContainerStyle={{ paddingBottom: 8 }}>
            {(clueTab === "A" ? acrossSlots : downSlots).map(({ slot, idx }) => {
              const isActiveClue = idx === activeSlotIdx;
              return (
                <Pressable key={idx} onPress={() => jumpToSlot(idx)} style={[styles.clueRow, isActiveClue && { backgroundColor: background.isDark ? "rgba(78,204,163,0.15)" : "#eefaf5" }]}>
                  <Text style={[styles.clueRowNumber, { color: isActiveClue ? ACCENT : SUBTEXT }]}>{gridMeta.cells[slot.row][slot.col].number}</Text>
                  <Text style={[styles.clueRowText, { color: TEXT }]} numberOfLines={1}>{slot.clue}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.keyboard}>
            {KEYBOARD_ROWS.map((row, i) => (
              <View key={i} style={styles.keyboardRow}>
                {row.map((k) => renderKeyboardKey(k))}
              </View>
            ))}
          </View>
        </>
      )}

      <CrosswordResultOverlay
        visible={showResult}
        timeSeconds={overlayHasGameData ? elapsedSeconds : dailyLock?.timeSeconds ?? null}
        mistakes={overlayHasGameData ? mistakeCount : dailyLock?.mistakes ?? 0}
        hintsUsed={overlayHasGameData ? hintsUsed : dailyLock?.hintsUsed ?? 0}
        currentStreak={stats.daily.currentStreak}
        bestStreak={stats.daily.bestStreak}
        gamesPlayed={stats.daily.gamesPlayed}
        averageTimeSeconds={stats.daily.gamesPlayed > 0 ? stats.daily.totalTimeSeconds / stats.daily.gamesPlayed : null}
        nextDailySecondsRemaining={nextDailySeconds}
        shareText={overlayShareText}
        hasThisGameData={overlayHasGameData}
        onClose={() => setShowResult(false)}
        onGoHome={() => {
          setShowResult(false);
          setScreen("menu");
        }}
      />

      {pendingAchievements.length > 0 && (
        <AchievementPopup
          achievement={pendingAchievements[0] as AchievementLike}
          onDismiss={() => setPendingAchievements((prev) => prev.slice(1))}
          backgroundColor={CARD}
          textColor={TEXT}
        />
      )}
    </SafeAreaView>
  );
}

const StatBox = ({
  label,
  value,
  textColor,
  subColor,
  cardColor,
  borderColor,
}: {
  label: string;
  value: string;
  textColor: string;
  subColor: string;
  cardColor: string;
  borderColor: string;
}) => (
  <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}>
    <Text style={[styles.statBoxValue, { color: textColor }]}>{value}</Text>
    <Text style={[styles.statBoxLabel, { color: subColor }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  menuHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  backText: { fontSize: 15, fontWeight: "600" },
  gameTitle: { fontSize: 18, fontWeight: "800" },
  headerSpacer: { width: 50 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 15 },
  tabUnderline: { height: 3, width: 40, borderRadius: 2, marginTop: 6 },

  dailyCard: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: "center" },
  dailyLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  dailyDate: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  dailySize: { fontSize: 13, marginBottom: 20 },
  completeBadge: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 14 },
  completeBadgeText: { fontWeight: "700", fontSize: 13 },
  primaryButton: { borderWidth: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48, alignItems: "center", width: "100%" },
  primaryButtonText: { fontSize: 16, fontWeight: "800" },
  streakText: { marginTop: 16, fontSize: 13, fontWeight: "600" },

  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { width: "31%", borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  statBoxValue: { fontSize: 18, fontWeight: "800" },
  statBoxLabel: { fontSize: 11, marginTop: 4, textAlign: "center" },

  achievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achievementCard: { width: "47%", borderWidth: 1, borderRadius: 14, padding: 14, alignItems: "center" },
  achievementEmoji: { fontSize: 26, marginBottom: 6 },
  achievementName: { fontSize: 13, fontWeight: "800", textAlign: "center", marginBottom: 4 },
  achievementDesc: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  progressTrack: { height: 5, width: "100%", backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 3, marginTop: 8, overflow: "hidden" },
  progressFill: { height: 5, backgroundColor: "#4ecca3", borderRadius: 3 },
  lockedDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: "600" },

  rulesCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 12 },
  ruleItem: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  ruleNumber: { fontSize: 15, fontWeight: "900", width: 20, textAlign: "center" },
  ruleText: { flex: 1, fontSize: 14, lineHeight: 20 },

  gameHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  modeTitle: { fontSize: 14, fontWeight: "700" },
  hintText: { fontSize: 14, fontWeight: "700" },

  cluePill: { marginHorizontal: 16, borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  clueNumber: { fontSize: 14, fontWeight: "800" },
  clueText: { flex: 1, fontSize: 14 },

  gridWrap: { alignSelf: "center", marginBottom: 10 },
  gridRow: { flexDirection: "row" },
  cell: { borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cellNumber: { position: "absolute", top: 2, left: 3, fontSize: 9, fontWeight: "700" },
  cellLetter: { fontSize: 20, fontWeight: "800" },

  clueTabRow: { flexDirection: "row", borderBottomWidth: 1, marginHorizontal: 16 },
  clueTabButton: { flex: 1, alignItems: "center", paddingVertical: 8 },
  clueTabText: { fontSize: 13 },
  clueList: { maxHeight: 90, marginHorizontal: 16, marginBottom: 6 },
  clueRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 8, borderRadius: 8, paddingHorizontal: 6 },
  clueRowNumber: { fontSize: 12, fontWeight: "800", width: 22 },
  clueRowText: { flex: 1, fontSize: 13 },

  keyboard: { paddingHorizontal: 6, paddingBottom: 20, paddingTop: 6 },
  keyboardRow: { flexDirection: "row", justifyContent: "center", marginBottom: 8, gap: 5 },
  key: { minWidth: 30, height: 42, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  keyWide: { minWidth: 50 },
  keyText: { fontSize: 14, fontWeight: "700" },
});
