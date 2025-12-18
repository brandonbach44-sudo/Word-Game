
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDisplayDate } from '../utils/dailyChallenge';

type DailyChallengePopupProps = {
  visible: boolean;
  won: boolean;
  word: string;
  streak: number;
  bestStreak: number;
  onBackToMenu: () => void;
};

export const DailyChallengePopup: React.FC<DailyChallengePopupProps> = ({
  visible,
  won,
  word,
  streak,
  bestStreak,
  onBackToMenu,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>Daily Challenge</Text>
          <Text style={styles.date}>{formatDisplayDate()}</Text>
          <Text style={styles.resultText}>{won ? '🎉 You Won!' : '😢 Try Again Tomorrow!'}</Text>
          <Text style={styles.wordReveal}>Word: <Text style={{ fontWeight: 'bold' }}>{word}</Text></Text>
          <View style={styles.streakRow}>
            <Text style={styles.streak}>🔥 {streak} Streak</Text>
            <Text style={styles.streak}>🏆 {bestStreak} Best</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={onBackToMenu}>
            <Text style={styles.buttonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: 320,
    borderRadius: 18,
    backgroundColor: '#faf4eb',
    padding: 28,
    borderWidth: 2,
    borderColor: '#e4dacb',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  date: { fontSize: 16, marginBottom: 10 },
  resultText: { fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
  wordReveal: { fontSize: 16, marginBottom: 10 },
  streakRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  streak: { fontSize: 15 },
  button: {
    marginTop: 10,
    backgroundColor: '#e0b873',
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  buttonText: { fontWeight: 'bold', fontSize: 16, color: '#2c2416' },
});