// src/hexhive/components/HexGrid.tsx
// The honeycomb letter input: a center hex (must be used in every word)
// surrounded by 6 outer hexes, a current-guess readout above, and a
// delete/shuffle/enter control row below.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Delete, RotateCw } from 'lucide-react-native';

const HEX_SIZE = 58; // center-to-vertex radius
const HEX_W = HEX_SIZE * 2;
const HEX_H = HEX_SIZE * Math.sqrt(3);
const GAP = 7;

// Flat-top hexagon vertices (pointy left/right, flat top/bottom) so hexes
// tile vertically touching top-to-bottom, matching the reference layout.
function hexPoints(size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(`${size * Math.cos(angle)},${size * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

// Offsets (dx, dy) for the 6 outer hexes, clockwise starting at 12 o'clock:
// top, upper-right, lower-right, bottom, lower-left, upper-left.
const OUTER_OFFSETS = [
  { x: 0, y: -(HEX_H + GAP) },
  { x: HEX_W * 0.75 + GAP * 0.6, y: -(HEX_H / 2 + GAP / 2) },
  { x: HEX_W * 0.75 + GAP * 0.6, y: HEX_H / 2 + GAP / 2 },
  { x: 0, y: HEX_H + GAP },
  { x: -(HEX_W * 0.75) - GAP * 0.6, y: HEX_H / 2 + GAP / 2 },
  { x: -(HEX_W * 0.75) - GAP * 0.6, y: -(HEX_H / 2 + GAP / 2) },
];

const CONTAINER_SIZE = (HEX_W * 0.75 + GAP * 0.6) * 2 + HEX_W;

export type Feedback = 'valid' | 'pangram' | 'invalid' | 'already_found' | 'too_short' | null;

interface HexTileProps {
  letter: string;
  isCenter?: boolean;
  onPress: () => void;
  accentColor: string;
  textColor: string;
  tileColor: string;
}

function HexTile({ letter, isCenter, onPress, accentColor, textColor, tileColor }: HexTileProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={onPress}
      style={{ width: HEX_W, height: HEX_H }}
    >
      <Svg width={HEX_W} height={HEX_H} viewBox={`${-HEX_SIZE} ${-HEX_SIZE} ${HEX_W} ${HEX_W}`} style={StyleSheet.absoluteFillObject}>
        <Polygon
          points={hexPoints(HEX_SIZE - 1.5)}
          fill={isCenter ? accentColor : tileColor}
          stroke={isCenter ? accentColor : `${accentColor}55`}
          strokeWidth={1.5}
        />
      </Svg>
      <View style={styles.hexLetterWrap} pointerEvents="none">
        <Text style={[styles.hexLetter, { color: isCenter ? '#ffffff' : textColor }]}>
          {letter.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface HexGridProps {
  outerLetters: string[]; // 6 letters, display order
  center: string;
  currentGuess: string;
  feedback: Feedback;
  onLetterPress: (letter: string) => void;
  onDelete: () => void;
  onShuffle: () => void;
  onSubmit: () => void;
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  tileColor: string;
  cardColor: string;
  borderColor: string;
}

export default function HexGrid({
  outerLetters,
  center,
  currentGuess,
  feedback,
  onLetterPress,
  onDelete,
  onShuffle,
  onSubmit,
  accentColor,
  textColor,
  tileColor,
  borderColor,
}: HexGridProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (feedback && feedback !== 'valid' && feedback !== 'pangram') {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [feedback, shakeAnim]);

  const guessColor =
    feedback === 'valid' || feedback === 'pangram'
      ? accentColor
      : feedback === 'invalid' || feedback === 'too_short' || feedback === 'already_found'
      ? '#e94560'
      : textColor;

  const feedbackMessage =
    feedback === 'pangram'
      ? 'Pangram!'
      : feedback === 'already_found'
      ? 'Already found'
      : feedback === 'too_short'
      ? 'Too short'
      : feedback === 'invalid'
      ? 'Not in word list'
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.guessRow}>
        <Animated.Text
          style={[
            styles.guessText,
            {
              color: guessColor,
              transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }) }],
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {currentGuess.length > 0
            ? currentGuess
                .toUpperCase()
                .split('')
                .map((ch, i) => (
                  <Text key={i} style={{ color: ch === center.toUpperCase() ? accentColor : textColor }}>
                    {ch}
                  </Text>
                ))
            : feedbackMessage ?? ' '}
        </Animated.Text>
      </View>

      <View style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE + HEX_H * 0.5, alignSelf: 'center' }}>
        <View style={[styles.tileWrap, { left: CONTAINER_SIZE / 2 - HEX_SIZE, top: CONTAINER_SIZE / 2 - HEX_H / 2 }]}>
          <HexTile
            letter={center}
            isCenter
            onPress={() => onLetterPress(center)}
            accentColor={accentColor}
            textColor={textColor}
            tileColor={tileColor}
          />
        </View>
        {outerLetters.map((letter, i) => {
          const offset = OUTER_OFFSETS[i];
          return (
            <View
              key={`${letter}-${i}`}
              style={[
                styles.tileWrap,
                {
                  left: CONTAINER_SIZE / 2 - HEX_SIZE + offset.x,
                  top: CONTAINER_SIZE / 2 - HEX_H / 2 + offset.y,
                },
              ]}
            >
              <HexTile
                letter={letter}
                onPress={() => onLetterPress(letter)}
                accentColor={accentColor}
                textColor={textColor}
                tileColor={tileColor}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, { borderColor }]}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Delete size={20} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shuffleButton, { borderColor }]}
          onPress={onShuffle}
          activeOpacity={0.7}
        >
          <RotateCw size={20} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.enterButton, { backgroundColor: accentColor }]}
          onPress={onSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.enterText}>Enter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 6 },
  guessRow: { minHeight: 44, justifyContent: 'center', marginBottom: 10, paddingHorizontal: 12 },
  guessText: { fontSize: 32, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  tileWrap: { position: 'absolute' },
  hexLetterWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexLetter: {
    fontSize: 30,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 18,
  },
  controlButton: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleButton: {
    borderWidth: 1.5,
    borderRadius: 999,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterButton: {
    borderRadius: 999,
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
