// src/shared/introVisuals.tsx
//
// Small typographic illustrations for the first-run intros.
//
// These are deliberately built out of letters and arrows rather than images:
// the app already speaks that language (the share blocks, the → in Word
// Ladder), it costs no assets, and it scales to any theme and text size for
// free. An illustration that can't survive dark mode isn't worth the bytes.
//
// They're generic primitives — a chain of words, a ring of letters — not
// game-specific logic, so the games stay the only place that knows their own
// rules.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * A chain of words with the letter that CHANGED from the previous word picked
 * out in the accent colour.
 *
 * Highlighting the change is the entire teaching move: "change one letter" is
 * an instruction you can read twice and still not picture, whereas seeing
 * COLD → CORD with the L→R swap lit up needs no explanation at all.
 */
export function WordChain({
  words,
  accent,
  textColor,
  secondaryText,
}: {
  words: string[];
  accent: string;
  textColor: string;
  secondaryText: string;
}) {
  return (
    <View style={styles.chainWrap}>
      {words.map((word, wi) => {
        const prev = wi > 0 ? words[wi - 1] : null;
        return (
          <View key={wi} style={styles.chainRow}>
            {wi > 0 && (
              <Text style={[styles.chainArrow, { color: secondaryText }]}>→</Text>
            )}
            <View style={styles.chainWord}>
              {word.split('').map((ch, ci) => {
                const changed = prev !== null && prev[ci] !== ch;
                return (
                  <Text
                    key={ci}
                    style={[
                      styles.chainLetter,
                      { color: changed ? accent : textColor },
                      changed && styles.chainLetterChanged,
                    ]}
                  >
                    {ch}
                  </Text>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * The centre letter and its six neighbours, with the centre marked — the one
 * rule in Hex Hive that people miss, shown rather than stated.
 */
export function HiveLetters({
  center,
  outer,
  accent,
  textColor,
  borderColor,
}: {
  center: string;
  outer: string[];
  accent: string;
  textColor: string;
  borderColor: string;
}) {
  return (
    <View style={styles.hiveWrap}>
      <View style={[styles.hiveTile, styles.hiveCenter, { backgroundColor: accent }]}>
        <Text style={[styles.hiveLetter, { color: '#fff' }]}>{center}</Text>
      </View>
      {outer.map((ch, i) => (
        <View key={i} style={[styles.hiveTile, { borderColor }]}>
          <Text style={[styles.hiveLetter, { color: textColor }]}>{ch}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * An example word with the required centre letter picked out, so "must use the
 * centre letter" becomes visible instead of abstract.
 */
export function WordWithRequiredLetter({
  word,
  required,
  accent,
  textColor,
}: {
  word: string;
  required: string;
  accent: string;
  textColor: string;
}) {
  return (
    <View style={styles.chainWord}>
      {word.split('').map((ch, i) => {
        const isRequired = ch === required;
        return (
          <Text
            key={i}
            style={[
              styles.chainLetter,
              { color: isRequired ? accent : textColor },
              isRequired && styles.chainLetterChanged,
            ]}
          >
            {ch}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chainWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 6,
  },
  chainRow: { flexDirection: 'row', alignItems: 'center' },
  chainArrow: { fontSize: 15, marginHorizontal: 6, fontWeight: '700' },
  chainWord: { flexDirection: 'row', alignItems: 'center' },
  chainLetter: { fontSize: 19, fontWeight: '800', letterSpacing: 1 },
  chainLetterChanged: { fontWeight: '900' },

  hiveWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    maxWidth: 210,
  },
  hiveTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiveCenter: { borderWidth: 0 },
  hiveLetter: { fontSize: 17, fontWeight: '900' },
});
