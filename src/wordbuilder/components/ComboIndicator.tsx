import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';

interface ComboIndicatorProps {
  comboCount: number;
  /** Increments each time a combo word is found — triggers the bar to reset. */
  resetKey: number;
}

const COMBO_DURATION = 4000;

function getMultiplierLabel(count: number): string {
  if (count >= 4) return 'x2.5';
  if (count >= 3) return 'x2';
  if (count >= 2) return 'x1.5';
  return 'x1';
}

function getComboColor(count: number): string {
  if (count >= 4) return '#FF3B00';
  if (count >= 3) return '#FF6200';
  return '#FF9500';
}

export const ComboIndicator: React.FC<ComboIndicatorProps> = ({ comboCount, resetKey }) => {
  const timerAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(0);

  const effectiveCount = Math.min(comboCount, 4);
  const multiplierLabel = getMultiplierLabel(effectiveCount);
  const comboColor = getComboColor(effectiveCount);

  // Restart draining bar each time a new combo word lands
  useEffect(() => {
    if (comboCount < 2) return;
    timerAnim.stopAnimation();
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: COMBO_DURATION,
      useNativeDriver: false,
    }).start();
  }, [resetKey]);

  // Pulse when combo level increases
  useEffect(() => {
    if (comboCount > prevCountRef.current && comboCount >= 2) {
      scaleAnim.setValue(1.25);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 200,
      }).start();
    }
    prevCountRef.current = comboCount;
  }, [comboCount]);

  if (comboCount < 2) return null;

  const barWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.badge, { backgroundColor: comboColor }]}>
        <Flame size={14} color="#fff" fill="#fff" />
        <Text style={styles.multiplierText}>{multiplierLabel}</Text>
        <Text style={styles.comboLabel}>COMBO</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { backgroundColor: comboColor, width: barWidth }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  multiplierText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  comboLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  barTrack: {
    width: 130,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
