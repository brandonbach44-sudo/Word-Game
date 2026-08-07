import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Share2, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../shared/ThemeContext";
import { formatSeconds } from "../utils/crosswordUtils";

type Props = {
  visible: boolean;
  timeSeconds: number | null;
  mistakes: number;
  hintsUsed: number;
  currentStreak: number | null;
  bestStreak: number | null;
  gamesPlayed: number | null;
  averageTimeSeconds: number | null;
  onClose: () => void;
  onGoHome: () => void;
  nextDailySecondsRemaining?: number | null;
  shareText?: string;
  hasThisGameData: boolean;
};

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

const CrosswordResultOverlay = ({
  visible,
  timeSeconds,
  mistakes,
  hintsUsed,
  currentStreak,
  bestStreak,
  gamesPlayed,
  averageTimeSeconds,
  onClose,
  onGoHome,
  nextDailySecondsRemaining,
  shareText,
  hasThisGameData,
}: Props) => {
  const { background } = useTheme();
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    try {
      const text = shareText && shareText.length > 0 ? shareText : "Crossword — solved today's puzzle!";
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

  const isPerfect = hasThisGameData && mistakes === 0 && hintsUsed === 0;
  const title = !hasThisGameData
    ? "Already solved"
    : isPerfect
    ? "Flawless!"
    : "Solved!";

  const subtitle = hasThisGameData
    ? isPerfect
      ? "No mistakes, no hints. Clean sweep."
      : `You finished today's puzzle${mistakes > 0 ? ` with ${mistakes} mistake${mistakes === 1 ? "" : "s"}` : ""}${hintsUsed > 0 ? `${mistakes > 0 ? " and" : " with"} ${hintsUsed} hint${hintsUsed === 1 ? "" : "s"}` : ""}.`
    : "You've already completed today's Daily.";

  const timeText = timeSeconds != null ? formatSeconds(timeSeconds) : undefined;
  const avgTimeText = averageTimeSeconds != null ? formatSeconds(averageTimeSeconds) : undefined;

  // Rendered in a native Modal so this always covers the full screen and
  // always sits above everything else (including achievement toasts),
  // regardless of the parent play screen's layout.
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: BG }]}>
      <View style={[styles.pageHeader, { borderColor: BORDER, paddingTop: insets.top + 14 }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.brand, { color: SUBTEXT }]}>CROSSWORD</Text>
        <Pressable
          style={({ pressed }) => [styles.closeIconButton, { opacity: pressed ? 0.6 : 1 }]}
          onPress={onClose}
          hitSlop={16}
        >
          <X size={22} color={SUBTEXT} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={[styles.title, { color: TEXT }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: SUBTEXT }]}>{subtitle}</Text>

          {hasThisGameData && (
            <>
              <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
              <Text style={[styles.sectionTitle, { color: TEXT }]}>This game</Text>
              <View style={styles.statsRow}>
                {timeText && (
                  <StatPill label="Time" value={timeText} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
                )}
                <StatPill label="Mistakes" value={`${mistakes}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
                <StatPill label="Hints" value={`${hintsUsed}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
          <Text style={[styles.sectionTitle, { color: TEXT }]}>Overall</Text>
          <View style={styles.statsRow}>
            <StatPill label="Current streak" value={`${currentStreak ?? 0}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
            <StatPill label="Best streak" value={`${bestStreak ?? 0}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
          </View>
          <View style={styles.statsRow}>
            <StatPill label="Played" value={`${gamesPlayed ?? 0}`} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
            {avgTimeText && (
              <StatPill label="Avg time" value={avgTimeText} textColor={TEXT} borderColor={BORDER} backgroundColor={CARD} />
            )}
          </View>

          {nextDailySecondsRemaining != null && (
            <Text style={[styles.nextDaily, { color: SUBTEXT }]}>
              Next puzzle in {formatSeconds(nextDailySecondsRemaining)}
            </Text>
          )}

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.shareButton, { borderColor: BORDER, backgroundColor: CARD, opacity: pressed ? 0.75 : 1 }]}
          >
            <Share2 size={18} color={TEXT} />
            <Text style={[styles.shareText, { color: TEXT }]}>Share</Text>
          </Pressable>

          <Pressable
            onPress={onGoHome}
            style={({ pressed }) => [styles.homeButton, { borderColor: BORDER, opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={[styles.homeText, { color: SUBTEXT }]}>Back to menu</Text>
          </Pressable>
        </View>
      </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerSpacer: { width: 22 },
  brand: { fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  closeIconButton: { padding: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  card: { alignItems: "stretch" },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 16, lineHeight: 20 },
  divider: { height: 1, marginVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statPillLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4, opacity: 0.75, textAlign: "center" },
  statPillValue: { fontSize: 18, fontWeight: "800" },
  nextDaily: { fontSize: 12, textAlign: "center", marginTop: 8, marginBottom: 4 },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  shareText: { fontSize: 15, fontWeight: "700" },
  homeButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    opacity: 0.85,
  },
  homeText: { fontSize: 14, fontWeight: "600" },
});

export default CrosswordResultOverlay;
