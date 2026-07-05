// src/hexhive/components/WordList.tsx
// Matches the found-word badge style used in Wordsmith (Word Builder):
// small pill badges in a wrapped row, tinted with the accent color, rather
// than a plain divided list.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WordListProps {
  foundWords: string[]; // already sorted however the caller wants
  pangrams: Set<string>;
  textColor: string;
  secondaryTextColor: string;
  accentColor: string;
  borderColor: string;
}

export default function WordList({
  foundWords,
  pangrams,
  secondaryTextColor,
  accentColor,
}: WordListProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: secondaryTextColor }]}>
        Found: {foundWords.length}
      </Text>

      {foundWords.length > 0 && (
        <View style={styles.wrap}>
          {foundWords.map((word) => {
            const isPangram = pangrams.has(word);
            return (
              <View
                key={word}
                style={[
                  styles.badge,
                  {
                    backgroundColor: isPangram ? accentColor : `${accentColor}26`,
                    borderColor: accentColor,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: isPangram ? '#ffffff' : accentColor }]}>
                  {word.toUpperCase()}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
