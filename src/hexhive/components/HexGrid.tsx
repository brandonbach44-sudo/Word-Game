// src/hexhive/components/HexGrid.tsx
// The honeycomb letter input: a center hex (must be used in every word)
// surrounded by 6 outer hexes, a current-guess readout above, and a
// delete/shuffle/enter control row below.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Delete, RotateCw } from 'lucide-react-native';

const HEX_SIZE = 42; // center-to-vertex radius
const HEX_W = HEX_SIZE * 2;
const HEX_H = HEX_SIZE * Math.sqrt(3);
const GAP = 4;

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
  { x: (HEX_W * 0.75) + GAP * 0.6, y: -(HEX_H / 2 + GAP / 2) },
  { x: (HEX_W * 0.75) + GAP * 0.6, y: (HEX_H / 2 + GAP / 2) },
  { x: 0, y: HEX_H + GAP },
  { x: -(HEX_W * 0.75) - GAP * 0.6, y: (HEX_H / 2 + GAP / 2) },
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
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.hexTouchable}>
      <Svg width={HEX_W} height={HEX_H} viewBox={`${-HEX_SIZE} ${-HEX_SIZE} ${HEX_W} ${HEX_W}`}>
        <Polygon
          points={hexPoints(HEX_SIZE)}
          fill={isCenter ? accentColor : tileColor}
        />
      </Svg>
      <Text style={[styles.hexLetter, { color: isCenter ? '#ffffff' : textColor }]}>
        {letter.toUpperCase()}
      </Text>
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
  cardColor,
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
            { color: guessColor, transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] },
          ]}
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

      <View style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE + HEX_H, alignSelf: 'center' }}>
        <View style={[styles.centerWrap, { left: CONTAINER_SIZE / 2 - HEX_SIZE, top: CONTAINER_SIZE / 2 - HEX_SIZE / 2 }]}>
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
                styles.centerWrap,
                {
                  left: CONTAINER_SIZE / 2 - HEX_SIZE + offset.x,
                  top: CONTAINER_SIZE / 2 - HEX_SIZE / 2 + offset.y,
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
          <Delete size={18} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButtonCircle, { borderColor }]}
          onPress={onShuffle}
          activeOpacity={0.7}
        >
          <RotateCw size={18} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { borderColor, backgroundColor: cardColor }]}
          onPress={onSubmit}
          activeOpacity={0.7}
        >
          <Text style={[styles.enterText, { color: textColor }]}>Enter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  guessRow: { minHeight: 32, justifyContent: 'center', marginBottom: 8 },
  guessText: { fontSize: 24, fontWeight: '700', letterSpacing: 1 },
  centerWrap: { position: 'absolute' },
  hexTouchable: { alignItems: 'center', justifyContent: 'center' },
  hexLetter: {
    position: 'absolute',
    fontSize: 22,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
  },
  controlButton: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonCircle: {
    borderWidth: 1.5,
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterText: { fontSize: 15, fontWeight: '600' },
});
