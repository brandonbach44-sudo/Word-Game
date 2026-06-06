import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { FallingLetters } from './FallingLetters';
import { useTheme } from './ThemeContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const { background } = useTheme();

  // Fade out the whole splash
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Hover animation for "Tap to Play"
  const hoverAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: -10,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleTap = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => onFinish());
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View
        style={[
          styles.root,
          { backgroundColor: background.backgroundColor, opacity: fadeAnim },
        ]}
      >
        <FallingLetters />

        <View style={styles.content}>
          <Text style={[styles.title, { color: background.textColor }]}>
            Word Fury
          </Text>

          <Animated.Text
            style={[
              styles.tapToPlay,
              { color: background.secondaryText, transform: [{ translateY: hoverAnim }] },
            ]}
          >
            Tap to Play
          </Animated.Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 32,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tapToPlay: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.8,
  },
});
