import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { InkBreakdown as InkBreakdownType } from '../utils/storage';
import { InkCoinIcon } from './InkDisplay';

interface InkBreakdownProps {
  breakdown: InkBreakdownType;
  onAnimationComplete?: () => void;
}

export const InkBreakdownDisplay = ({ breakdown, onAnimationComplete }: InkBreakdownProps) => {
  const fadeAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  const totalAnim = useRef(new Animated.Value(0)).current;
  const totalScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Stagger the animations for each line
    const animations = fadeAnims.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 200,
        useNativeDriver: true,
      });
    });

    // Total animation (appears last with scale effect)
    const totalAnimation = Animated.parallel([
      Animated.timing(totalAnim, {
        toValue: 1,
        duration: 400,
        delay: fadeAnims.length * 200 + 200,
        useNativeDriver: true,
      }),
      Animated.spring(totalScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        delay: fadeAnims.length * 200 + 200,
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([
      Animated.stagger(200, animations),
      totalAnimation,
    ]).start(() => {
      onAnimationComplete?.();
    });
  }, []);

  const lines = [
    { label: 'Match Completed', value: breakdown.matchCompletion, show: true },
    { label: `Words Found (${breakdown.wordCount})`, value: breakdown.wordsFound, show: breakdown.wordCount > 0 },
    { label: '3-Game Streak!', value: breakdown.streakBonus, show: breakdown.isStreakBonus },
    { label: 'First Win Today!', value: breakdown.firstDailyWin, show: breakdown.isFirstDailyWin },
  ].filter(line => line.show);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ink Earned</Text>
      
      <View style={styles.breakdownContainer}>
        {lines.map((line, index) => (
          <Animated.View 
            key={line.label}
            style={[
              styles.lineContainer,
              { opacity: fadeAnims[index] }
            ]}
          >
            <Text style={styles.lineLabel}>{line.label}</Text>
            <View style={styles.lineValue}>
              <Text style={styles.plusSign}>+</Text>
              <Text style={styles.valueText}>{line.value}</Text>
              <InkCoinIcon size={18} />
            </View>
          </Animated.View>
        ))}
        
        {/* Divider */}
        <Animated.View 
          style={[
            styles.divider,
            { opacity: fadeAnims[lines.length] || totalAnim }
          ]}
        />
        
        {/* Total */}
        <Animated.View 
          style={[
            styles.totalContainer,
            { 
              opacity: totalAnim,
              transform: [{ scale: totalScale }]
            }
          ]}
        >
          <Text style={styles.totalLabel}>Total</Text>
          <View style={styles.totalValue}>
            <Text style={styles.totalPlus}>+</Text>
            <Text style={styles.totalText}>{breakdown.total}</Text>
            <InkCoinIcon size={24} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(22, 33, 62, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#4ecca3',
    minWidth: 280,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ecca3',
    textAlign: 'center',
    marginBottom: 15,
  },
  breakdownContainer: {
    gap: 10,
  },
  lineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lineLabel: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  lineValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusSign: {
    fontSize: 14,
    color: '#4ecca3',
    fontWeight: 'bold',
    marginRight: 2,
  },
  valueText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 6,
    minWidth: 30,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalPlus: {
    fontSize: 18,
    color: '#4ecca3',
    fontWeight: 'bold',
    marginRight: 2,
  },
  totalText: {
    fontSize: 24,
    color: '#4ecca3',
    fontWeight: 'bold',
    marginRight: 8,
  },
});
