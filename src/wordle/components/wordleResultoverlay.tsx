import React from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../shared/ThemeContext";

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
  shareText?: string | null;
  nextDailySecondsRemaining?: number | null;
};

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${remainingSeconds}s`);
  return parts.join(" ");
}

type StatPillProps = {
  label: string;
  value: string;
  textColor: string;
  secondaryText: string;
  pillBg: string;
  pillBorder: string;
};

const StatPill: React.FC<StatPillProps> = ({
  label,
  value,
  textColor,
  secondaryText,
  pillBg,
  pillBorder,
}) => (
  <View style={[styles.statPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
    <Text style={[styles.statPillLabel, { color: secondaryText }]}>{label}</Text>
    <Text style={[styles.statPillValue, { color: textColor }]}>{value}</Text>
  </View>
);

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  borderColor: string;
  textColor: string;
  bgColor: string;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  borderColor,
  textColor,
  bgColor,
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.primaryButton,
      {
        borderColor,
        backgroundColor: bgColor,
        opacity: pressed ? 0.75 : 1,
      },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.primaryButtonText, { color: textColor }]}>{label}</Text>
  </Pressable>
);

export default function WordleResultOverlay(props: WordleResultOverlayProps) {
  const {
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
    shareText,
    nextDailySecondsRemaining,
  } = props;

  const { background } = useTheme();

  const themeBg = background.backgroundColor ?? "#000000";
  const themeText = background.textColor;
  const themeSecondary = background.secondaryText;
  const themeCard = background.cardColor;
  const themeBorder = background.borderColor;
  const isDark = background.isDark;

  if (!visible) return null;

  const isDaily = mode === "daily";
  const isWin = status === "won";

  let title = isWin ? "Nice!" : "Out of guesses";
  let subtitle: string;

  if (isDaily) {
    subtitle = isWin ? "Come back tomorrow for a new Daily." : "Try again tomorrow.";
  } else {
    subtitle = isWin ? "Want another round?" : "Try again with a new word.";
  }

  const hasGameData = guessesCount > 0 || timeSeconds != null;

  const timeText = timeSeconds != null ? formatSeconds(timeSeconds) : undefined;

  const avgTimeText =
    averageTimeSeconds != null ? formatSeconds(averageTimeSeconds) : "--";

  const avgGuessesText =
    averageGuesses != null ? averageGuesses.toFixed(2) : "--";

  const showShare = isDaily && !!shareText;

  const pillBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const pillBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  async function handleShare() {
    if (!shareText) return;
    try {
      await Share.share({ message: shareText });
    } catch {
      // user can cancel share — ignore
    }
  }

  return (
    <View
      style={[
        styles.overlay,
        { backgroundColor: isDark ? "rgba(0,0,0,0.60)" : "rgba(0,0,0,0.35)" },
      ]}
    >
      <View style={[styles.card, { backgroundColor: themeCard, borderColor: themeBorder }]}>
        <Text style={[styles.brandLabel, { color: themeBorder }]}>WORDEARL</Text>

        <Text style={[styles.title, { color: themeText }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: themeSecondary }]}>{subtitle}</Text>

        <View style={styles.solutionWrap}>
          <Text style={[styles.solutionLabel, { color: themeSecondary }]}>
            Solution
          </Text>
          <Text style={[styles.solutionWord, { color: themeText }]}>
            {solutionWord.toUpperCase()}
          </Text>
        </View>

        {hasGameData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeText }]}>This game</Text>
            <View style={styles.pillRow}>
              <StatPill
                label="Guesses"
                value={`${guessesCount}`}
                textColor={themeText}
                secondaryText={themeSecondary}
                pillBg={pillBg}
                pillBorder={pillBorder}
              />
              {timeText && (
                <StatPill
                  label="Time"
                  value={timeText}
                  textColor={themeText}
                  secondaryText={themeSecondary}
                  pillBg={pillBg}
                  pillBorder={pillBorder}
                />
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeText }]}>
            {isDaily ? "Daily stats" : "Practice stats"}
          </Text>

          <View style={styles.pillRow}>
            {isDaily && (
              <>
                <StatPill
                  label="Streak"
                  value={`${currentStreak ?? 0}`}
                  textColor={themeText}
                  secondaryText={themeSecondary}
                  pillBg={pillBg}
                  pillBorder={pillBorder}
                />
                <StatPill
                  label="Best"
                  value={`${bestStreak ?? 0}`}
                  textColor={themeText}
                  secondaryText={themeSecondary}
                  pillBg={pillBg}
                  pillBorder={pillBorder}
                />
              </>
            )}

            <StatPill
              label="Avg time"
              value={avgTimeText}
              textColor={themeText}
              secondaryText={themeSecondary}
              pillBg={pillBg}
              pillBorder={pillBorder}
            />
            <StatPill
              label="Avg guesses"
              value={avgGuessesText}
              textColor={themeText}
              secondaryText={themeSecondary}
              pillBg={pillBg}
              pillBorder={pillBorder}
            />
          </View>

          {isDaily && nextDailySecondsRemaining != null && (
            <Text style={[styles.countdown, { color: themeSecondary }]}>
              Next Daily in {formatCountdown(nextDailySecondsRemaining)}
            </Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          {isDaily ? (
            <>
              {showShare && (
                <PrimaryButton
                  label="Share"
                  onPress={handleShare}
                  borderColor={themeBorder}
                  textColor={themeBorder}
                  bgColor={themeBg}
                />
              )}
              <PrimaryButton
                label="Main Menu"
                onPress={onGoHome}
                borderColor={themeBorder}
                textColor={themeBorder}
                bgColor={themeBg}
              />
              <PrimaryButton
                label="Practice"
                onPress={onGoPractice}
                borderColor={themeBorder}
                textColor={themeBorder}
                bgColor={themeBg}
              />
              <PrimaryButton
                label="Close"
                onPress={onClose}
                borderColor={themeBorder}
                textColor={themeBorder}
                bgColor={themeBg}
              />
            </>
          ) : (
            <>
              <PrimaryButton
                label="Play Again"
                onPress={onPlayAgain}
                borderColor={themeBorder}
                textColor={themeBorder}
                bgColor={themeBg}
              />
              <PrimaryButton
                label="Main Menu"
                onPress={onGoHome}
                borderColor={themeBorder}
                textColor={themeBorder}
                bgColor={themeBg}
              />
              <PrimaryButton
                label="Close"
                onPress={onClose}
                borderColor={themeBorder}
                textColor={themeBorder}
                bgColor={themeBg}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 999,
  },
  card: {
    width: "92%",
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
  },
  brandLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 14,
  },
  solutionWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  solutionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  solutionWord: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 3,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 110,
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  statPillValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  countdown: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  primaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    minWidth: 110,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
