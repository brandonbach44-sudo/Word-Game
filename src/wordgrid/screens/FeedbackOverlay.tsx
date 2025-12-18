// src/wordgrid/screens/FeedbackOverlay.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

type FeedbackProps = {
  points: number;
  success: boolean;
  onComplete: () => void;
};

export function FeedbackOverlay({ points, success, onComplete }: FeedbackProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Animate popup
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 }, () => onComplete())
    );
    translateY.value = withTiming(-40, { duration: 1000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.popup, animatedStyle]}>
      <Text style={[styles.text, success ? styles.success : styles.fail]}>
        {success ? `+${points}` : 'Invalid!'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  success: { color: 'green' },
  fail: { color: 'red' },
});
