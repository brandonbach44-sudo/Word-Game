// src/hexhive/components/RankProgressBar.tsx
// The rank ladder readout: current rank name + score bubble on the left,
// dots (one per rank, filled up to the current rank, final one a square)
// centered in the remaining space to the right — single row to keep this
// compact right under the header.

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
      <View style={styles.leftGroup}>
        <Text style={[styles.rankName, { color: textColor }]}>{RANKS[rankIndex].name}</Text>
        <View style={[styles.scoreBubble, { backgroundColor: accentColor }]}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  leftGroup: { flexDirection: 'row', alignItems: 'center' },
  rankName: { fontSize: 15, fontWeight: '700', marginRight: 8 },
  scoreBubble: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  scoreText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  dotsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginLeft: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  dotSquare: { width: 9, height: 9, borderRadius: 2, borderWidth: 1.5 },
});
