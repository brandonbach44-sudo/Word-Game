// src/hexhive/components/WordList.tsx
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
  textColor,
  secondaryTextColor,
  accentColor,
  borderColor,
}: WordListProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: textColor }]}>
        {foundWords.length === 0
          ? 'You have found 0 words'
          : `You have found ${foundWords.length} word${foundWords.length === 1 ? '' : 's'}`}
      </Text>

      {foundWords.length > 0 && (
        <View style={styles.list}>
          {foundWords.map((word) => (
            <View key={word} style={[styles.wordRow, { borderBottomColor: borderColor }]}>
              <Text
                style={[
                  styles.word,
                  { color: pangrams.has(word) ? accentColor : textColor },
                  pangrams.has(word) && styles.pangramWord,
                ]}
              >
                {word}
              </Text>
              {pangrams.has(word) && <Text style={[styles.pangramTag, { color: accentColor }]}>Pangram</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 14, marginBottom: 8 },
  list: {},
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  word: { fontSize: 15 },
  pangramWord: { fontWeight: '700' },
  pangramTag: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});
