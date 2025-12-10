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
// post-game overlay
import WordleResultOverlay from "../components/wordleResultsOverlay";

const ROWS = 6;
const COLS = 5;

type LetterState = "correct" | "present" | "absent" | "empty";

type EvaluatedLetter = {
  letter: string;
  state: LetterState;
};

type Mode = "daily" | "practice" | "stats";

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

// ---------- Word helpers (Daily / Practice / Validation) ----------

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

// ------------------------------------------------------------------

export default function WordleGame() {
  const [mode, setMode] = useState<Mode>("daily");
  const [solution, setSolution] = useState<string>(() => getDailySolution());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluatedLetter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

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
      showMessage(`The word was ${solution.toUpperCase()}`);
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

    // Daily: keep today’s daily word (but in case date rolled over, recompute)
    if (mode === "daily") {
      setSolution(getDailySolution());
    }

    // Practice: new random word every time you hit Play Again
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
      ? `Out of guesses. The word was ${solution.toUpperCase()}.`
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
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
              Stats tracking is coming soon.{"\n"}
              This screen will show your streaks, win rate, and guess
              distribution for Daily and Practice modes.
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
                  <Pressable style={styles.resetButton} onPress={handleReset}>
                    <Text style={styles.resetText}>Play Again</Text>
                  </Pressable>
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

            {/* Custom Enter button below keyboard */}
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
          onClose={closeResult}
          onPlayAgain={handleReset}
        />
      </View>
    </SafeAreaView>
  );
}

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
  },
  title: {
    fontSize: 32, // larger title
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
    width: 62, // bigger tiles
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
  // Reserved area so text never overlaps tiles
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
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: BROWN,
    backgroundColor: CREAM,
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
