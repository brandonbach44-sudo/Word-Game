// src/hexhive/components/RankProgressBar.tsx
// The rank ladder readout: current rank name + score bubble, and a row of
// dots (one per rank) filled up to the current rank, final one a square to
// mark the top rank — matches the reference game's progress bar shape.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RANKS } from '../utils/scoring';

interface RankProgressBarProps {
  rankIndex: number;
  score: number;
  accentColor: string;
  textColor: string;
  borderColor: string;
}

export default function RankProgressBar({ rankIndex, score, accentColor, textColor, borderColor }: RankProgressBarProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rankName, { color: textColor }]}>{RANKS[rankIndex].name}</Text>
      <View style={[styles.scoreBubble, { backgroundColor: accentColor }]}>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
      <View style={styles.dotsRow}>
        {RANKS.map((rank, i) => {
          const isLast = i === RANKS.length - 1;
          const filled = i <= rankIndex;
          return (
            <View
              key={rank.name}
              style={[
                isLast ? styles.dotSquare : styles.dot,
                {
                  backgroundColor: filled ? accentColor : 'transparent',
                  borderColor: filled ? accentColor : borderColor,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  rankName: { fontSize: 15, fontWeight: '700', marginRight: 8 },
  scoreBubble: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 10,
  },
  scoreText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  dotSquare: { width: 9, height: 9, borderRadius: 2, borderWidth: 1.5 },
});
