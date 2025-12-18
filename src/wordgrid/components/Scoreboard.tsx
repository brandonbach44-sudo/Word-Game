// src/wordgrid/components/Scoreboard.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type ScoreboardProps = {
  score: number;
};

export default function Scoreboard({ score }: ScoreboardProps) {
  const animatedScore = useSharedValue(score);

  useEffect(() => {
    animatedScore.value = withTiming(score, { duration: 500 });
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.min(animatedScore.value / 5000, 0.2) }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>Score: {score}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#6a11cb',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: 'center',
    marginVertical: 10,
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
