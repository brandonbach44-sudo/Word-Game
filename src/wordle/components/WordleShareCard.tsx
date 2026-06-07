import React from "react";
import { StyleSheet, Text, View } from "react-native";

type CellState = "correct" | "present" | "absent" | "empty";

type EvalRow = CellState[];

interface Props {
  mode: "daily" | "practice";
  status: "won" | "lost";
  solutionWord: string;
  guessesCount: number;
  timeSeconds: number | null;
  evaluationRows: EvalRow[]; // array of 5-cell rows
  currentStreak?: number | null;
  dateString: string;
}

function formatSeconds(s: number): string {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins <= 0) return `${s}s`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const CELL_COLOR: Record<CellState, string> = {
  correct: "#22c55e",
  present: "#fde047",
  absent:  "#374151",
  empty:   "#1f2937",
};

export const WordleShareCard = React.forwardRef<View, Props>(
  ({ mode, status, solutionWord, guessesCount, timeSeconds, evaluationRows, currentStreak, dateString }, ref) => {
    const isWin = status === "won";
    const resultLabel = isWin ? `${guessesCount}/6` : "X/6";

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* Top branding */}
        <Text style={styles.brand}>WORDLE</Text>
        <Text style={styles.modeLabel}>{mode === "daily" ? "Daily Challenge" : "Practice"}</Text>
        <Text style={styles.date}>{dateString}</Text>

        {/* Result */}
        <Text style={styles.result}>{resultLabel}</Text>
        {timeSeconds != null && (
          <Text style={styles.time}>{formatSeconds(timeSeconds)}</Text>
        )}

        {/* Emoji grid */}
        <View style={styles.grid}>
          {evaluationRows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((state, ci) => (
                <View key={ci} style={[styles.cell, { backgroundColor: CELL_COLOR[state] }]} />
              ))}
            </View>
          ))}
        </View>

        {/* Solution word */}
        <View style={styles.solutionRow}>
          <Text style={styles.solutionLabel}>Answer: </Text>
          <Text style={styles.solutionWord}>{solutionWord.toUpperCase()}</Text>
        </View>

        {/* Streak */}
        {currentStreak != null && currentStreak > 0 && (
          <Text style={styles.streak}>🔥 {currentStreak} day streak</Text>
        )}

        {/* Footer */}
        <Text style={styles.footer}>wordfury.app</Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  brand: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 4,
  },
  modeLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 2,
  },
  date: {
    color: "#6b7280",
    fontSize: 11,
    marginBottom: 16,
  },
  result: {
    color: "#f9fafb",
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 2,
  },
  time: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 20,
  },
  grid: {
    gap: 5,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 5,
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  solutionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  solutionLabel: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  solutionWord: {
    color: "#f9fafb",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },
  streak: {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  footer: {
    color: "#374151",
    fontSize: 10,
    marginTop: 12,
    letterSpacing: 1,
  },
});
