import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TierName, TIERS, getTierEmoji } from '../utils/tiers';

interface CareerProgressProps {
  nextTier: TierName | null;
  currentScore: number;
  requiredScore: number;
  progress: number; // 0 to 1
}

export const CareerProgress = ({ 
  nextTier, 
  currentScore, 
  requiredScore, 
  progress 
}: CareerProgressProps) => {
  // All tiers unlocked
  if (!nextTier) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Career Progress</Text>
          <Text style={styles.maxedLabel}>🏆 MAX</Text>
        </View>
        <View style={styles.maxedContainer}>
          <Text style={styles.maxedText}>All career tiles unlocked!</Text>
        </View>
      </View>
    );
  }

  const tier = TIERS[nextTier];
  const progressPercent = Math.min(progress * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Next Unlock</Text>
        <View style={styles.tierInfo}>
          <Text style={styles.tierEmoji}>{getTierEmoji(nextTier)}</Text>
          <Text style={styles.tierName}>{tier.displayName}</Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
      
      <View style={styles.scoreRow}>
        <Text style={styles.currentScore}>{currentScore.toLocaleString()}</Text>
        <Text style={styles.separator}>/</Text>
        <Text style={styles.requiredScore}>{requiredScore.toLocaleString()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(22, 33, 62, 0.9)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(78, 204, 163, 0.3)',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#0f1a2e',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ecca3',
    borderRadius: 5,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
  },
  currentScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ecca3',
  },
  separator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 6,
  },
  requiredScore: {
    fontSize: 14,
    color: '#888',
  },
  maxedContainer: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  maxedLabel: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: 'bold',
  },
  maxedText: {
    fontSize: 14,
    color: '#4ecca3',
    fontStyle: 'italic',
  },
});
