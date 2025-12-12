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
  /** Optional: called when user taps the Share button (Daily only) */
  onShare?: () => void;
};

function formatSeconds(totalSeconds: number | null): string | null {
  if (totalSeconds == null) return null;
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
  onShare,
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

  const timeText = formatSeconds(timeSeconds);
  const avgTimeText = formatSeconds(averageTimeSeconds);

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Title & subtitle */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Solution word */}
        <Text style={styles.solutionLabel}>Solution</Text>
        <Text style={styles.solutionWord}>{solutionWord.toUpperCase()}</Text>

        {/* Per-game stats */}
        <View style={styles.inlineStatsRow}>
          <StatPill label="Guesses" value={String(guessesCount)} />
          {timeText && <StatPill label="Time" value={timeText} />}
        </View>

        {/* Mode-specific stats */}
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

        {/* Share button (Daily only) */}
        {isDaily && onShare && (
          <View style={styles.shareRow}>
            <Pressable
              style={[styles.secondaryButton, styles.shareButton]}
              onPress={onShare}
            >
              <Text style={styles.secondaryButtonText}>Share result</Text>
            </Pressable>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Primary buttons */}
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

        {/* Close */}
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
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: CREAM,
    borderRadius: 20,
    padding: 16,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    textAlign: "center",
    color: "#4b5563",
  },
  solutionLabel: {
    marginTop: 12,
    fontSize: 12,
    textAlign: "center",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  solutionWord: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
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
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 4,
  },
  shareRow: {
    marginTop: 10,
    marginBottom: 4,
    alignItems: "center",
  },
  shareButton: {
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 12,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 6,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: BROWN,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fefce8",
  },
  secondaryButton: {
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
    marginTop: 4,
    alignSelf: "center",
  },
});