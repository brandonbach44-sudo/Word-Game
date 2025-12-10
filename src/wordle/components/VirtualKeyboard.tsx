import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { styles } from '../styles/gameStyles';
import { LetterState } from './LetterTile';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  letterStates: Record<string, LetterState>;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  letterStates,
}) => {
  // QWERTY keyboard layout
  const keyboardLayout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
  ];

  const handleKeyPress = (key: string) => {
    onKeyPress(key);
  };

  const Key: React.FC<{ keyValue: string; isSpecial?: boolean }> = ({ keyValue, isSpecial = false }) => {
    const scaleAnimation = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    };

    const isEnter = keyValue === 'enter';
    const isBackspace = keyValue === 'backspace';

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnimation }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.key,
            getKeyStyle(keyValue),
            isEnter && styles.enterKey,
            isBackspace && styles.backspaceKey,
          ]}
          onPress={() => handleKeyPress(keyValue)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1} // Disable default opacity since we're using scale
        >
          <Text style={styles.keyText}>
            {isEnter ? 'ENTER' : isBackspace ? '⌫' : keyValue.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getKeyStyle = (letter: string) => {
    const state = letterStates[letter.toLowerCase()];
    switch (state) {
      case 'correct':
        return styles.keyCorrect;
      case 'present':
        return styles.keyPresent;
      case 'absent':
        return styles.keyAbsent;
      default:
        return styles.keyDefault;
    }
  };

  const renderKey = (key: string) => {
    return <Key key={key} keyValue={key} />;
  };

  return (
    <View style={styles.keyboardContainer}>
      {keyboardLayout.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.keyboardRow}>
          {row.map((key) => renderKey(key))}
        </View>
      ))}
    </View>
  );
};
