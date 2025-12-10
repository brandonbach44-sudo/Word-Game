import React, { useEffect, useRef } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

const CREAM = "#f9f5ec";
const BROWN = "#8b5a2b";

type Mode = "daily" | "practice" | "stats";
type Status = "playing" | "won" | "lost";

type Props = {
  visible: boolean;
  status: Status;
  mode: Mode;
  guessesCount: number;
  onClose: () => void;
  onPlayAgain: () => void;
};

const WordleResultOverlay: React.FC<Props> = ({
  visible,
  status,
  mode,
  guessesCount,
  onClose,
  onPlayAgain,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  if (!visible) return null;

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const title =
    status === "won" ? "Nice work!" : status === "lost" ? "Good try!" : "Game over";
  const subtitle =
    mode === "daily"
      ? "Daily Puzzle"
      : mode === "practice"
      ? "Practice Mode"
      : "Wordle";

  const guessesLabel = guessesCount === 0 ? "-" : String(guessesCount);
  const resultText =
    status === "won" ? "Win" : status === "lost" ? "Loss" : "—";

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: anim,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Result</Text>
            <Text style={styles.statValue}>{resultText}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Guesses</Text>
            <Text style={styles.statValue}>{guessesLabel}</Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={onClose}
          >
            <Text style={styles.secondaryText}>Close</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={onPlayAgain}
          >
            <Text style={styles.primaryText}>Play Again</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
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
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "80%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  primaryButton: {
    backgroundColor: BROWN,
  },
  secondaryText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  primaryText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
  },
});
