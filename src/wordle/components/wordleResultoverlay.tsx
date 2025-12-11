import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

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
    timeSeconds != null ? formatSeconds(timeSeconds) : undefined;

  const avgTimeText =
    averageTimeSeconds != null ? formatSeconds(averageTimeSeconds) : undefined;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
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
        <View style={styles.buttonRow}>
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
      </View>
    </View>
  );
};

export default WordleResultOverlay;

const styles = StyleSheet.create({
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
    borderRadius: 16,
    padding: 16,
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
    letterSpacing: 3,
    color: "#111827",
  },
  inlineStatsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  statPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f3e7d7",
    minWidth: 90,
    alignItems: "center",
  },
  statPillLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
  statPillValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    width: "100%",
    marginTop: 12,
    marginBottom: 8,
  },
  section: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: BROWN,
    backgroundColor: CREAM,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: BROWN,
  },
  secondaryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
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
