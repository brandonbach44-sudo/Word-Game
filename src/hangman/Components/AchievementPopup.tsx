import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Achievement } from '../utils/achievements';

const { width } = Dimensions.get('window');
const POPUP_DURATION = 3500; // 3.5 seconds

type AchievementPopupProps = {
  achievement: Achievement | null;
  onDismiss: () => void;
  backgroundColor:  string;
  textColor: string;
};

export const AchievementPopup:  React.FC<AchievementPopupProps> = ({
  achievement,
  onDismiss,
  backgroundColor,
  textColor,
}) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (achievement) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction:  8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      timerRef.current = setTimeout(() => {
        dismissPopup();
      }, POPUP_DURATION);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [achievement]);

  const dismissPopup = () => {
    // Clear the auto-dismiss timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Slide out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 250,
        useNativeDriver:  true,
      }),
      Animated.timing(opacityAnim, {
        toValue:  0,
        duration: 250,
        useNativeDriver:  true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.popup, { backgroundColor }]}
        onPress={dismissPopup}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>{achievement.emoji}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.unlocked}>Achievement Unlocked!</Text>
            <Text style={[styles.name, { color: textColor }]}>
              {achievement.name}
            </Text>
            <Text style={[styles.description, { color: textColor, opacity: 0.7 }]}>
              {achievement.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated. View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popup: {
    width: width - 40,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  unlocked: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  name:  {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom:  2,
  },
  description:  {
    fontSize: 13,
  },
});

export default AchievementPopup;