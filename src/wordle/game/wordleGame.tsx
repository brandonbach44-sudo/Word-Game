import { useRouter } from "expo-router";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// word list
import { SOLUTIONS, VALID_GUESSES } from "../data/wordle_words";

// ───────────────── Types & constants ─────────────────

const ROWS = 6;
const COLS = 5;

type LetterState = "correct" | "present" | "absent" | "empty";

type EvaluatedLetter = {
  letter: string;
  state: LetterState;
};

type Mode = "daily" | "practice" | "stats";
type Status = "playing" | "won" | "lost";

type Streaks = {
  daily: number;
  practice: number;
};

// Keyboard rows WITHOUT Enter (we'll use a custom Enter button below)
const KEYBOARD_ROWS: string[][] = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  [..."ZXCVBNM".split(""), "BACK"],
];

// Layout constants
const CREAM = "#f9f5ec";
const BROWN = "#8b5a2b";
const HORIZONTAL_PADDING = 16; // same as container paddingHorizontal
const KEY_GAP = 6;

const SCREEN_WIDTH = Dimensions.get("window").width;

// ───────────────── Result Overlay component (inline) ─────────────────

type WordleResultOverlayProps = {
  visible: boolean;
  status: Status;
  mode: Mode;
  guessesCount: number;
  solutionWord: string;
  currentStreak: number;
  onClose: () => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onGoPractice: () => void;
};

const WordleResultOverlay: React.FC<WordleResultOverlayProps> = ({
  visible,
  status,
  mode,
  guessesCount,
  solutionWord,
  currentStreak,
  onClose,
  onPlayAgain,
  onGoHome,
  onGoPractice,
}) => {
  if (!visible) return null;

  const title = status === "won" ? "Nice!" : "Out of guesses";
  const subtitle =
    status === "won"
      ? `You solved it in ${guessesCount} ${
          guessesCount === 1 ? "guess" : "guesses"
        }.`
      : "Try again tomorrow or play Practice.";

  return (
    <View style={overlayStyles.overlay}>
      <View style={overlayStyles.card}>
        <Text style={overlayStyles.title}>{title}</Text>
        <Text style={overlayStyles.subtitle}>{subtitle}</Text>

        {/* Solution word */}
        <Text style={overlayStyles.solutionLabel}>Word</Text>
        <Text style={overlayStyles.solutionWord}>
          {solutionWord.toUpperCase()}
        </Text>

        {/* Streak */}
        <Text style={overlayStyles.streakText}>
          Current streak: {currentStreak}
        </Text>

        {/* Buttons */}
        {mode === "daily" ? (
          <View style={overlayStyles.btnRow}>
            <Pressable style={overlayStyles.btn} onPress={onGoHome}>
              <Text style={overlayStyles.btnText}>Main Menu</Text>
            </Pressable>
            <Pressable style={overlayStyles.btn} onPress={onGoPractice}>
              <Text style={overlayStyles.btnText}>Practice</Text>
            </Pressable>
          </View>
        ) : (
          <View style={overlayStyles.btnRow}>
            <Pressable style={overlayStyles.btn} onPress={onPlayAgain}>
              <Text style={overlayStyles.btnText}>Play Again</Text>
            </Pressable>
            <Pressable style={overlayStyles.btn} onPress={onGoHome}>
              <Text style={overlayStyles.btnText}>Main Menu</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={[overlayStyles.btn, overlayStyles.closeBtn]}
          onPress={onClose}
        >
          <Text style={[overlayStyles.btnText, overlayStyles.closeText]}>
            Close
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

// ───────────────── Word helpers (Daily / Practice / Validation) ─────────────────

function evaluateGuess(guess: string, solution: string): EvaluatedLetter[] {
  const letters = guess.toUpperCase().split("");
  const sol = solution.toUpperCase().split("");

  const result: EvaluatedLetter[] = new Array(COLS).fill(null).map((_, i) => ({
    letter: letters[i] || "",
    state: "absent",
  }));

  // First pass: correct positions + track remaining solution letters
  const remaining: Record<string, number> = {};

  for (let i = 0; i < COLS; i++) {
    if (letters[i] === sol[i]) {
      result[i].state = "correct";
    } else {
      const s = sol[i];
      remaining[s] = (remaining[s] || 0) + 1;
    }
  }

  // Second pass: present letters
  for (let i = 0; i < COLS; i++) {
    if (result[i].state === "correct") continue;
    const letter = letters[i];
    if (letter && remaining[letter] > 0) {
      result[i].state = "present";
      remaining[letter] -= 1;
    } else {
      result[i].state = "absent";
    }
  }

  return result;
}

// Deterministic “same word per calendar day” index
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

// ───────────────── Main WordleGame component ─────────────────

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

  const [streaks, setStreaks] = useState<Streaks>({
    daily: 0,
    practice: 0,
  });

  const keyboardStates = useMemo(() => {
    const stateMap = new Map<string, LetterState>();

    for (const row of evaluations) {
      for (const { letter, state } of row) {
        if (!letter) continue;
        const existing = stateMap.get(letter);
        if (state === "correct") {
          stateMap.set(letter, "correct");
        } else if (state === "present") {
          if (!existing || existing === "absent") {
            stateMap.set(letter, "present");
          }
        } else if (state === "absent") {
          if (!existing) {
            stateMap.set(letter, "absent");
          }
        }
      }
    }

    return stateMap;
  }, [evaluations]);

  const showMessage = useCallback((text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 1500);
  }, []);

  // Shake animation for the current row
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

  // Flip animations: one Animated.Value per tile (row x col)
  const flipAnims = useRef(
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => new Animated.Value(0))
    )
  ).current;

  const revealRow = useCallback(
    (rowIndex: number) => {
      const rowAnimValues = flipAnims[rowIndex];
      const animations = rowAnimValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        })
      );

      // Stagger the flip from left to right
      Animated.stagger(80, animations).start();
    },
    [flipAnims]
  );

  // Win bounce animation on the whole grid
  const winBounceAnim = useRef(new Animated.Value(0)).current;
  const gridScale = winBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  // Keyboard key press animations (per key)
  const keyPressAnims = useRef(new Map<string, Animated.Value>()).current;

  const openResult = useCallback(() => {
    setShowResult(true);
  }, []);

  const closeResult = useCallback(() => {
    setShowResult(false);
  }, []);

  const resetGameState = useCallback(() => {
    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess("");
    setStatus("playing");
    setMessage(null);

    // reset all flip animations
    flipAnims.forEach((row) =>
      row.forEach((value) => {
        value.setValue(0);
      })
    );

    // reset grid bounce
    winBounceAnim.setValue(0);
  }, [flipAnims, winBounceAnim]);

  const updateStreak = useCallback(
    (result: "won" | "lost") => {
      if (mode === "stats") return;

      setStreaks((prev) => {
        const key = mode === "daily" ? "daily" : "practice";
        const current = prev[key];
        const nextValue = result === "won" ? current + 1 : 0;
        return {
          ...prev,
          [key]: nextValue,
        };
      });
    },
    [mode]
  );

  const handleEnter = useCallback(() => {
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

    // trigger flip animation for this row
    revealRow(newRowIndex);

    if (currentGuess.toUpperCase() === solution.toUpperCase()) {
      setStatus("won");
      const guessCount = nextGuesses.length;
      showMessage(
        `Nice! You solved it in ${guessCount} ${
          guessCount === 1 ? "guess" : "guesses"
        }.`
      );

      updateStreak("won");

      // bounce the grid
      Animated.sequence([
        Animated.timing(winBounceAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(winBounceAnim, {
          toValue: 0,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      openResult();
    } else if (nextGuesses.length === ROWS) {
      setStatus("lost");
      showMessage("Out of guesses");
      updateStreak("lost");
      openResult();
    }
  }, [
    currentGuess,
    guesses,
    evaluations,
    status,
    mode,
    solution,
    showMessage,
    triggerShake,
    revealRow,
    winBounceAnim,
    openResult,
    updateStreak,
  ]);

  const handleBackspace = useCallback(() => {
    if (status !== "playing") return;
    if (mode === "stats") return;
    setCurrentGuess((g) => g.slice(0, -1));
  }, [status, mode]);

  const handleLetter = useCallback(
    (letter: string) => {
      if (status !== "playing") return;
      if (mode === "stats") return;
      if (currentGuess.length >= COLS) return;
      setCurrentGuess((g) => (g + letter).toUpperCase());
    },
    [currentGuess.length, status, mode]
  );

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

  const renderTile = (rowIndex: number, colIndex: number) => {
    const isPastRow = rowIndex < guesses.length;
    const isCurrentRow = rowIndex === guesses.length;

    let letter = "";
    let state: LetterState = "empty";

    if (isPastRow) {
      letter = evaluations[rowIndex][colIndex]?.letter || "";
      state = evaluations[rowIndex][colIndex]?.state || "empty";
    } else if (isCurrentRow) {
      letter = currentGuess[colIndex] || "";
      state = letter ? "empty" : "empty";
    }

    // Default / empty tile style
    let background = "transparent";
    let border = "#d3d6da"; // light border
    let textColor = "#111827"; // dark text on cream

    // Color states
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
    }

    // flip animation for this tile
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
        <Text style={[styles.tileText, { color: textColor }]}>{letter}</Text>
      </Animated.View>
    );
  };

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

  // 🔙 Back button action (header + daily "Main Menu" button)
  const handleGoHome = useCallback(() => {
    closeResult();
    router.back(); // assumes we came from main menu
  }, [router, closeResult]);

  // ▶️ From Daily overlay: jump into Practice mode
  const handleGoPractice = useCallback(() => {
    closeResult();
    setMode("practice");
    setSolution(getRandomPracticeSolution());
    resetGameState();
  }, [closeResult, resetGameState]);

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

        {/* Mode selector: Daily | Practice | Stats */}
        <View style={styles.modeSwitcher}>
          {(["daily", "practice", "stats"] as Mode[]).map((m) => {
            const isActive = m === mode;
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

        {/* Content: either Stats or Game */}
        {mode === "stats" ? (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Stats</Text>
            <Text style={styles.statsText}>
              Daily streak: {streaks.daily}
              {"\n"}
              Practice streak: {streaks.practice}
              {"\n\n"}
              More stats (win rate, distributions, etc.) coming soon.
            </Text>
          </View>
        ) : (
          <>
            {/* Grid (with win bounce) */}
            <Animated.View
              style={[styles.gridWrapper, { transform: [{ scale: gridScale }] }]}
            >
              {Array.from({ length: ROWS }).map((_, rowIndex) => {
                const RowComponent =
                  rowIndex === guesses.length && status === "playing"
                    ? Animated.View
                    : View;

                return (
                  <RowComponent
                    key={rowIndex}
                    style={[
                      styles.row,
                      rowIndex === guesses.length &&
                        status === "playing" && {
                          transform: [{ translateX: shakeAnim }],
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

            {/* Reserved status area (prevents overlap / jumping) */}
            <View style={styles.statusArea}>
              {status !== "playing" && (
                <View style={styles.statusContainer}>
                  {!!statusText && (
                    <Text style={styles.statusText}>{statusText}</Text>
                  )}

                  {/* Only allow "Play Again" here in Practice mode.
                     Daily mode is controlled by the overlay buttons. */}
                  {mode === "practice" && (
                    <Pressable style={styles.resetButton} onPress={handleReset}>
                      <Text style={styles.resetText}>Play Again</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            {/* Keyboard */}
            <View style={styles.keyboardContainer}>
              {KEYBOARD_ROWS.map((row, rowIndex) => {
                // Calculate key width so the row always fits the screen
                const rowLength = row.length;
                const totalGaps = KEY_GAP * (rowLength - 1);
                const availableWidth =
                  SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - totalGaps;
                const keyWidth = availableWidth / rowLength;

                return (
                  <View key={rowIndex} style={styles.keyboardRow}>
                    {row.map((key) => {
                      const display = key === "BACK" ? "⌫" : key;
                      const state = keyboardStates.get(key);

                      let background = "#d3d6da";
                      let color = "#000000";

                      if (state === "correct") background = "#6aaa64";
                      else if (state === "present") background = "#c9b458";
                      else if (state === "absent") {
                        background = "#787c7e";
                        color = "#ffffff";
                      }

                      // per-key press animation
                      let pressValue = keyPressAnims.get(key);
                      if (!pressValue) {
                        pressValue = new Animated.Value(0);
                        keyPressAnims.set(key, pressValue);
                      }
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
                              {display}
                            </Text>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            {/* Custom Enter button below keyboard (LONGER) */}
            <View style={styles.enterWrapper}>
              <Pressable style={styles.enterButton} onPress={handleEnter}>
                <Text style={styles.enterText}>Enter</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Post-game overlay */}
        <WordleResultOverlay
          visible={showResult}
          status={status}
          mode={mode}
          guessesCount={guesses.length}
          solutionWord={solution}
          currentStreak={
            mode === "daily" ? streaks.daily : streaks.practice
          }
          onClose={closeResult}
          onPlayAgain={handleReset}
          onGoHome={handleGoHome}
          onGoPractice={handleGoPractice}
        />
      </View>
    </SafeAreaView>
  );
}

// ───────────────── Styles ─────────────────

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
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 22,
    color: "#111827",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  modeSwitcher: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#eee3d3",
    borderRadius: 999,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#ffffff",
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
    marginTop: 2,
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
    gap: 8,
  },
  tile: {
    width: 62,
    height: 62,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
    textTransform: "uppercase",
  },
  statusArea: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  statusContainer: {
    alignItems: "center",
    gap: 6,
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
    fontWeight: "500",
  },
  keyboardContainer: {
    marginTop: 4,
    gap: 8,
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
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 18,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  enterWrapper: {
    marginTop: 12,
    alignItems: "center",
  },
  enterButton: {
    minWidth: 220, // longer enter button
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: BROWN,
    backgroundColor: CREAM,
    alignItems: "center",
  },
  enterText: {
    fontSize: 16,
    fontWeight: "600",
    color: BROWN,
  },
  statsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
  },
});

const overlayStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: BROWN,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 8,
  },
  solutionLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  solutionWord: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 2,
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: BROWN,
    backgroundColor: CREAM,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600",
    color: BROWN,
  },
  closeBtn: {
    marginTop: 6,
    borderColor: "#d3d6da",
    backgroundColor: "#ffffff",
  },
  closeText: {
    color: "#111827",
  },
});