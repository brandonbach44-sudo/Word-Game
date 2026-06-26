import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Share2 } from "lucide-react-native";

import { useTheme } from "../../shared/ThemeContext";

type CellState = "correct" | "present" | "absent" | "empty";

type Props = {
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
  nextDailySecondsRemaining?: number | null;
  shareText?: string;
  evaluationRows?: CellState[][];
};

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
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
  return `${h.toString().padStart(2, "0")}h ${m
    .toString()
    .padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
}

const StatPill = ({
  label,
  value,
  textColor,
  borderColor,
  backgroundColor,
}: {
  label: string;
  value: string;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
}) => {
  return (
    <View style={[styles.statPill, { borderColor, backgroundColor }]}>
      <Text style={[styles.statPillLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.statPillValue, { color: textColor }]}>{value}</Text>
    </View>
  );
};

const PrimaryButton = ({
  label,
  onPress,
  borderColor,
  textColor,
  backgroundColor,
}: {
  label: string;
  onPress: () => void;
  borderColor: string;
  textColor: string;
  backgroundColor: string;
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        { borderColor, backgroundColor, opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.primaryButtonText, { color: textColor }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const WordleResultOverlay = ({
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
  nextDailySecondsRemaining,
  shareText,
  evaluationRows,
}: Props) => {
  const { background } = useTheme();

  const handleShare = async () => {
    try {
      const text = shareText && shareText.length > 0
        ? shareText
        : `Wordle ${isWin ? `${guessesCount}/6` : "X/6"}`;
      const { Share } = require("react-native");
      await Share.share({ message: text });
    } catch (e) {
      console.warn("Share failed", e);
    }
  };

  const BG = background.backgroundColor ?? "#f9f5ec";
  const TEXT = background.textColor ?? "#111827";
  const SUBTEXT = background.secondaryText ?? "#6b7280";
  const CARD = background.cardColor ?? "#ffffff";
  const BORDER = background.borderColor ?? "#e5e7eb";

  if (!visible) return null;

  const isDaily = mode === "daily";
  const isWin = status === "won";
  const hasThisGameData = guessesCount > 0 || timeSeconds != null;

  let title = isWin ? "Nice!" : "Out of guesses";
  let subtitle: string;

  if (isDaily) {
    if (isWin) {
      subtitle = hasThisGameData
        ? `You solved today's word in ${guessesCount} ${
            guessesCount === 1 ? "guess" : "guesses"
          }.`
        : "You already completed today's Daily.";
    } else {
      subtitle = hasThisGameData
        ? "Better luck tomorrow."
        : "You've already played today's Daily.";
    }
  } else {
    if (isWin) {
      subtitle = hasThisGameData
        ? `You solved it in ${guessesCount} ${
            guessesCount === 1 ? "guess" : "guesses"
          }.`
        : "You solved it.";
    } else {
      subtitle = "Try again!";
    }
  }

  const timeText =
    timeSeconds != null ? formatSeconds(timeSeconds) : undefined;

  const avgTimeText =
    averageTimeSeconds != null ? formatSeconds(averageTimeSeconds) : undefined;

  return (
    <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
      <View style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}>
        {/* Brand */}
        <Text style={[styles.brand, { color: SUBTEXT }]}>WORDLE</Text>

        {/* Title + subtitle */}
        <Text style={[styles.title, { color: TEXT }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: SUBTEXT }]}>{subtitle}</Text>

        {/* Solution */}
        <View style={[styles.solutionBox, { borderColor: BORDER }]}>
          <Text style={[styles.solutionLabel, { color: SUBTEXT }]}>Solution</Text>
          <Text style={[styles.solutionWord, { color: TEXT }]}>
            {solutionWord.toUpperCase()}
          </Text>
        </View>

        {/* This game (only if we have real data) */}
        {hasThisGameData && (
          <>
            <View
              style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]}
            />
            <Text style={[styles.sectionTitle, { color: TEXT }]}>This game</Text>
            <View style={styles.statsRow}>
              <StatPill
                label="Guesses"
                value={`${guessesCount}`}
                textColor={TEXT}
                borderColor={BORDER}
                backgroundColor={BG}
              />
              {timeText ? (
                <StatPill
                  label="Time"
                  value={timeText}
                  textColor={TEXT}
                  borderColor={BORDER}
                  backgroundColor={BG}
                />
              ) : null}
            </View>
          </>
        )}

        {/* Mode stats */}
        <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
        <Text style={[styles.sectionTitle, { color: TEXT }]}>Stats</Text>

        {isDaily ? (
          <View style={styles.statsRow}>
            {currentStreak != null && (
              <StatPill
                label="Streak"
                value={`${currentStreak}`}
                textColor={TEXT}
                borderColor={BORDER}
                backgroundColor={BG}
              />
            )}
            {bestStreak != null && (
              <StatPill
                label="Best"
                value={`${bestStreak}`}
                textColor={TEXT}
                borderColor={BORDER}
                backgroundColor={BG}
              />
            )}
          </View>
        ) : null}

        <View style={styles.statsRow}>
          {avgTimeText ? (
            <StatPill
              label="Avg time"
              value={avgTimeText}
              textColor={TEXT}
              borderColor={BORDER}
              backgroundColor={BG}
            />
          ) : null}
          {averageGuesses != null ? (
            <StatPill
              label="Avg guesses"
              value={averageGuesses.toFixed(1)}
              textColor={TEXT}
              borderColor={BORDER}
              backgroundColor={BG}
            />
          ) : null}
        </View>

        {/* Countdown */}
        {isDaily && nextDailySecondsRemaining != null ? (
          <>
            <View
              style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]}
            />
            <Text style={[styles.countdownLabel, { color: SUBTEXT }]}>
              Next Daily in
            </Text>
            <Text style={[styles.countdownValue, { color: TEXT }]}>
              {formatCountdown(nextDailySecondsRemaining)}
            </Text>
          </>
        ) : null}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {isDaily ? (
            <>
              <PrimaryButton
                label="Main Menu"
                onPress={onGoHome}
                borderColor={BORDER}
                textColor={TEXT}
                backgroundColor={BG}
              />
              <PrimaryButton
                label="Play"
                onPress={onGoPractice}
                borderColor={BORDER}
                textColor={TEXT}
                backgroundColor={BG}
              />
            </>
          ) : (
            <>
              <PrimaryButton
                label="Play Again"
                onPress={onPlayAgain}
                borderColor={BORDER}
                textColor={TEXT}
                backgroundColor={BG}
              />
              <PrimaryButton
                label="Main Menu"
                onPress={onGoHome}
                borderColor={BORDER}
                textColor={TEXT}
                backgroundColor={BG}
              />
            </>
          )}
        </View>

        {hasThisGameData && (
          <Pressable
            style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.75 : 1 }]}
            onPress={handleShare}
          >
            <View style={styles.shareButtonInner}>
              <Share2 size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Share Result</Text>
            </View>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              borderColor: BORDER,
              backgroundColor: BG,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={onClose}
        >
          <Text style={[styles.secondaryButtonText, { color: TEXT }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default WordleResultOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
  },
  brand: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  solutionBox: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  solutionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  solutionWord: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  statPill: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 120,
    alignItems: "center",
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: "800",
    opacity: 0.8,
    marginBottom: 2,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: "900",
  },
  countdownLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 1,
  },
  countdownValue: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  shareButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#22c55e",
  },
  shareButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
