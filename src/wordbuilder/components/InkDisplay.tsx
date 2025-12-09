import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface InkDisplayProps {
  ink: number;
  totalScore: number;
  compact?: boolean; // For smaller displays during gameplay
}

export const InkDisplay = ({ ink, totalScore, compact = false }: InkDisplayProps) => {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactItem}>
          <View style={styles.inkCoinSmall}>
            <Text style={styles.inkCoinTextSmall}>I</Text>
          </View>
          <Text style={styles.compactValue}>{ink.toLocaleString()}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Ink Balance */}
      <View style={styles.item}>
        <View style={styles.inkCoin}>
          <Text style={styles.inkCoinText}>I</Text>
        </View>
        <Text style={styles.value}>{ink.toLocaleString()}</Text>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Total Score */}
      <View style={styles.item}>
        <Text style={styles.icon}>⭐</Text>
        <Text style={styles.value}>{totalScore.toLocaleString()}</Text>
      </View>
    </View>
  );
};

// Standalone Ink coin icon component (for use in shop, etc.)
export const InkCoinIcon = ({ size = 24 }: { size?: number }) => {
  const fontSize = size * 0.6;
  
  return (
    <View style={[styles.inkCoin, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.inkCoinText, { fontSize }]}>I</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(78, 204, 163, 0.3)',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  compactValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Ink Coin Styles
  inkCoin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffd700', // Gold
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    // Subtle shadow for depth
    shadowColor: '#b8860b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
    // Border for definition
    borderWidth: 2,
    borderColor: '#daa520',
  },
  inkCoinSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    borderWidth: 1.5,
    borderColor: '#daa520',
  },
  inkCoinText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b4513', // Dark brown for embossed look
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inkCoinTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8b4513',
  },
});
