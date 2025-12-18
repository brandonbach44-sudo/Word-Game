// src/wordgrid/components/WordList.tsx
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

type WordListProps = {
  words: string[];
};

export default function WordList({ words }: WordListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Words Found</Text>
      {words.length === 0 ? (
        <Text style={styles.placeholder}>No words yet...</Text>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <Text style={styles.word}>{item}</Text>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginVertical: 10, paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  placeholder: { color: '#888', fontSize: 16 },
  word: { fontSize: 16, paddingVertical: 4 },
});
