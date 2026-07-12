// app/anagrams/categories.tsx — Category picker for Anagrams' Categories
// Quick Play mode. Modeled on Hangman's category-select screen
// (src/hangman/HangmanScreen.tsx): a back header + a card grid, tapping a
// card jumps straight into a game rather than requiring a second
// confirmation step.

import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../src/shared/ThemeContext';
import { ANAGRAMS_CATEGORIES } from '../../src/anagrams/data/categories';

export default function AnagramsCategoriesScreen() {
  const { background } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap} pointerEvents="box-none">
          <Text style={[styles.title, { color: background.textColor }]}>Categories</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: background.secondaryText }]}>
          Pick a category — same 5-word run, themed words
        </Text>

        <View style={styles.grid}>
          {ANAGRAMS_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.card, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}
              onPress={() => router.push({ pathname: '/anagrams/category-game', params: { category: category.id } })}
              activeOpacity={0.8}
            >
              <Text style={styles.cardEmoji}>{category.emoji}</Text>
              <Text style={[styles.cardName, { color: background.textColor }]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    position: 'relative',
  },
  backButton: { padding: 8, zIndex: 1 },
  backText: { fontSize: 16, fontWeight: '500' },
  headerPlaceholder: { width: 60, zIndex: 1 },
  titleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },

  content: { paddingHorizontal: 20, paddingTop: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  card: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  cardEmoji: { fontSize: 32, marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: 'bold' },
});
