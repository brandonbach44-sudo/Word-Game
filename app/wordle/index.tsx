import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Styles
import { styles } from '../../src/wordle/styles/gameStyles';

export default function WordleMenu() {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#1a1a2e' }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 16, color: '#4ecca3' }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff', flex: 1, textAlign: 'center' }}>
          Wordle
        </Text>

        <View style={{ width: 50 }} /> {/* Spacer for centering */}
      </View>

      {/* Menu Options */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <TouchableOpacity
          style={menuStyles.menuCard}
          onPress={() => router.push('/wordle/daily')}
        >
          <Text style={menuStyles.menuTitle}>Daily Wordle</Text>
          <Text style={menuStyles.menuDescription}>Guess today&apos;s word - same for everyone!</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={menuStyles.menuCard}
          onPress={() => router.push('/wordle/practice')}
        >
          <Text style={menuStyles.menuTitle}>Practice</Text>
          <Text style={menuStyles.menuDescription}>Play with random words to improve your skills</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={menuStyles.menuCard}
          onPress={() => router.push('/wordle/stats')}
        >
          <Text style={menuStyles.menuTitle}>Statistics</Text>
          <Text style={menuStyles.menuDescription}>View your Wordle performance and streaks</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const menuStyles = {
  menuCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4ecca3',
    alignItems: 'center' as const,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
};