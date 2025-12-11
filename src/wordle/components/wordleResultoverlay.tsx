import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

const CREAM = "#f9f5ec";
const BROWN = "#8b5a2b";

export type WordleResultOverlayProps = {
  visible: boolean;
  mode: "daily" | "practice";
  status: "won" | "lost";
  solutionWord: string;
  guessesCount: number;
  timeSeconds: number | null;
  currentStreak: number | null;
  bestStreak: number | null;
  averageTimeSeconds: number | null;
  averageGuesses: number | null;
  onClose: () => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onGoPractice: () => void;
};

type StatPillProps = {
  label: string;
  value: string;
};

const StatPill: React.FC<StatPillProps> = ({ label, value }) => (
  <View style={styles.statPill}>
    <Text style={styles.statPillLabel}>{label}</Text>
    <Text style={styles.statPillValue}>{value}</Text>
  </View>
);

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ label, onPress }) => (
  <Pressable style={styles.primaryButton} onPress={onPress}>
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${mins}:${rem.toString().padStart(2, "0")}`;
}

const WordleResultOverlay: React.FC<WordleResultOverlayProps> = ({
  visible,
  mode,
  status,
  solutionWord,
  guessesCount,
  timeSeconds,
  currentStreak,
  bestStreak,
  averageTimeSeconds,
  averageGuesses,
  onClose,
  onPlayAgain,
  onGoHome,
  onGoPractice,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    scaleAnim.setValue(0.9);
    cardOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scaleAnim, cardOpacity]);

  if (!visible) return null;

  const isDaily = mode === "daily";
  const isWin = status === "won";

  let title = isWin ? "Nice!" : "Out of guesses";
  let subtitle: string;

  if (isDaily) {
    if (isWin) {
      subtitle = `You solved today's word in ${guessesCount} ${
        guessesCount === 1 ? "guess" : "guesses"
      }.`;
    } else {
      subtitle = "Try again tomorrow.";
    }
  } else {
    if (isWin) {
      subtitle = `You solved it in ${guessesCount} ${
        guessesCount === 1 ? "guess" : "guesses"
      }.`;
    } else {
      subtitle = `The word was ${solutionWord.toUpperCase()}.`;
    }
  }

  const timeText =
    timeSeconds != null ? formatTime(Math.max(0, Math.floor(timeSeconds))) : null;
  const avgTimeText =
    averageTimeSeconds != null
      ? formatTime(Math.max(0, Math.floor(averageTimeSeconds)))
      : null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.card,
          { opacity: cardOpacity, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Title + subtitle */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Word */}
        <View style={styles.wordBlock}>
          <Text style={styles.wordLabel}>Word</Text>
          <Text style={styles.word}>{solutionWord.toUpperCase()}</Text>
        </View>

        {/* Per-game summary row */}
        <View style={styles.inlineStatsRow}>
          <StatPill label="Guesses" value={String(guessesCount)} />
          {timeText && <StatPill label="Time" value={timeText} />}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Mode-specific summary */}
        {isDaily ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily stats</Text>
            <View style={styles.statsRow}>
              <StatPill
                label="Current streak"
                value={String(currentStreak ?? 0)}
              />
              <StatPill
                label="Best streak"
                value={String(bestStreak ?? 0)}
              />
            </View>
            <View style={styles.statsRow}>
              {avgTimeText && (
                <StatPill label="Avg time" value={avgTimeText} />
              )}
              {averageGuesses != null && (
                <StatPill
                  label="Avg guesses"
                  value={averageGuesses.toFixed(1)}
                />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Practice stats</Text>
            <View style={styles.statsRow}>
              {avgTimeText && (
                <StatPill label="Avg time" value={avgTimeText} />
              )}
              {averageGuesses != null && (
                <StatPill
                  label="Avg guesses"
                  value={averageGuesses.toFixed(1)}
                />
              )}
            </View>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          {isDaily ? (
            <>
              <PrimaryButton label="Main Menu" onPress={onGoHome} />
              <PrimaryButton label="Practice" onPress={onGoPractice} />
            </>
          ) : (
            <>
              <PrimaryButton label="Play Again" onPress={onPlayAgain} />
              <PrimaryButton label="Main Menu" onPress={onGoHome} />
            </>
          )}
        </View>

        <Pressable
          style={[styles.secondaryButton, styles.closeButton]}
          onPress={onClose}
        >
          <Text style={styles.secondaryButtonText}>Close</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default WordleResultOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: CREAM,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderWidth: 2,
    borderColor: BROWN,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginTop: 4,
  },
  wordBlock: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  wordLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  word: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 6,
    color: "#111827",
  },
  inlineStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    alignSelf: "stretch",
    marginVertical: 12,
  },
  section: {
    alignSelf: "stretch",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  statPill: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fff7ed",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  statPillLabel: {
    fontSize: 11,
    color: "#9a3412",
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7c2d12",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: BROWN,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: CREAM,
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  closeButton: {
    alignSelf: "center",
  },
});
