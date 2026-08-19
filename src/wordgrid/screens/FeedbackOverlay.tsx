// src/wordgrid/screens/FeedbackOverlay.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSemanticColors } from '../../shared/semanticColors';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

type FeedbackProps = {
  points: number;
  success: boolean;
  alreadyFound?: boolean;
  onComplete: () => void;
};

export function FeedbackOverlay({ points, success, alreadyFound, onComplete }: FeedbackProps) {
  // These three states were told apart by hue alone, in literal CSS colour
  // names ('green' / 'red' / 'orange') that no setting could reach. Valid vs
  // invalid is exactly the distinction green-red loses under the most common
  // forms of colour vision deficiency, so it goes through the shared semantic
  // palette now. "Already found" keeps amber, which stands alone rather than
  // being distinguished from the other two by hue.
  const semantic = useSemanticColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Animate popup
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      })
    );
    translateY.value = withTiming(-40, { duration: 1000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.popup, animatedStyle]}>
      <Text
        style={[
          styles.text,
          {
            color: success
              ? semantic.correct
              : alreadyFound
                ? semantic.warning
                : semantic.wrong,
          },
        ]}
      >
        {success ? `+${points}` : alreadyFound ? 'Already found!' : 'Invalid!'}
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
});
