// src/wordgrid/screens/ScoreBanner.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

type ScoreBannerProps = {
  score: number;
};

export function ScoreBanner({ score }: ScoreBannerProps) {
  const animatedScore = useSharedValue(score);

  // Animate whenever score changes
  useEffect(() => {
    animatedScore.value = withTiming(score, { duration: 500 });
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.min(animatedScore.value / 5000, 0.2) }],
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text style={styles.text}>Total Points: {score}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#6a11cb', // purple gradient base
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
