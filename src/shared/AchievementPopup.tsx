// src/shared/AchievementPopup.tsx
// Canonical achievement-unlocked popup, shared by every game so the
// slide-in toast looks and behaves identically everywhere. Accepts any
// achievement-shaped object ({ emoji, name, description }) so each game's
// own Achievement type works without adaptation.
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';

const { width } = Dimensions.get('window');

export type AchievementLike = {
  emoji: string;
  name: string;
  description: string;
};

interface AchievementPopupProps {
  achievement: AchievementLike | null;
  onDismiss: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
  onDismiss,
  backgroundColor = '#ffffff',
  textColor = '#2c2416',
}) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        dismissPopup();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const dismissPopup = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!achievement) return null;

  return (
    <Modal
      transparent
      visible={!!achievement}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.popup, { backgroundColor }]}
          onPress={dismissPopup}
          activeOpacity={0.9}
        >
          <View style={styles.header}>
            <Text style={styles.unlockLabel}>Achievement Unlocked!</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.emoji}>{achievement.emoji}</Text>
            <View style={styles.textContainer}>
              <Text style={[styles.name, { color: textColor }]}>{achievement.name}</Text>
              <Text style={[styles.description, { color: textColor, opacity: 0.7 }]}>
                {achievement.description}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  popup: {
    width: width - 40,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4ecca3',
  },
  header: {
    marginBottom: 8,
  },
  unlockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ecca3',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
  },
});

export default AchievementPopup;
