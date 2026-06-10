import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Animated,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeySkinName, KEY_SKINS } from '../utils/keySkins';

// Gem PNG images — same assets as Word Builder
const GEM_IMAGES: Partial<Record<KeySkinName, any>> = {
  ruby:        require('../../../assets/tiles/ruby_v1.png'),
  emerald:     require('../../../assets/tiles/emerald_v1.png'),
  diamond:     require('../../../assets/tiles/diamond_v1.png'),
  legendary:   require('../../../assets/tiles/legendary_v1.png'),
  iridescence: require('../../../assets/tiles/iridescence_v1.png'),
  rose_quartz: require('../../../assets/tiles/rose_quartz_v1.png'),
};

const DEFAULT_STYLES: Record<number, { background: string; border: string; text: string }> = {
  1: { background: '#5B8FB9', border: '#4A7A9E', text: '#ffffff' }, // Soft Blue
  2: { background: '#7D9D9C', border: '#6B8A89', text: '#ffffff' }, // Sage Green
  3: { background: '#9B7EBD', border: '#8569A6', text: '#ffffff' }, // Soft Purple
  4: { background: '#D4A574', border: '#C19460', text: '#ffffff' }, // Warm Tan
  5: { background: '#E8A0A0', border: '#D68F8F', text: '#ffffff' }, // Dusty Rose
  6: { background: '#6AACB8', border: '#5899A5', text: '#ffffff' }, // Soft Teal
};

const RAINBOW_COLORS    = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff'];
const IRIDESCENT_COLORS = ['#e6e6fa', '#ffd1dc', '#b0e0e6', '#c8f7c5', '#ffeaa7', '#dda0dd'];

type KeyState = 'empty' | 'correct' | 'present' | 'absent';

interface WordleKeyProps {
  letter: string;
  keyState: KeyState;
  skin: KeySkinName;
  keyShape: 'rounded' | 'square';
  keyStyle: 'filled' | 'outline';
  width: number;
  marginHorizontal: number;
  onPress: () => void;
  // Colors passed in from game (theme + colorblind aware)
  defaultBg: string;
  defaultBorder: string;
  defaultText: string;
  correctBg: string;
  correctBorder: string;
  presentBg: string;
  presentBorder: string;
  presentText: string;
  absentBg: string;
  absentBorder: string;
  defaultVariant?: number; // 1–6
}

export const WordleKey: React.FC<WordleKeyProps> = ({
  letter,
  keyState,
  skin,
  keyShape,
  keyStyle,
  width,
  marginHorizontal,
  onPress,
  defaultBg,
  defaultBorder,
  defaultText,
  correctBg,
  correctBorder,
  presentBg,
  presentBorder,
  presentText,
  absentBg,
  absentBorder,
  defaultVariant = 1,
}) => {
  const skinConfig = KEY_SKINS[skin];
  const isRevealed = keyState !== 'empty';
  const isGem = !isRevealed && skinConfig.isGem && GEM_IMAGES[skin] !== undefined;
  const isMetal = !isRevealed && !skinConfig.isGem && skinConfig.gradient !== null;
  const isIridescence = !isRevealed && skin === 'iridescence';
  const isLegendary = !isRevealed && skin === 'legendary';
  const borderRadius = keyShape === 'rounded' ? 22 : 6;

  // Color cycling for legendary/iridescence
  const [colorIndex, setColorIndex] = useState(0);
  useEffect(() => {
    if (isLegendary || isIridescence) {
      const interval = setInterval(() => {
        setColorIndex(prev => (prev + 1) % (isLegendary ? RAINBOW_COLORS.length : IRIDESCENT_COLORS.length));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLegendary, isIridescence]);

  const animatedBorderColor = isLegendary
    ? RAINBOW_COLORS[colorIndex]
    : isIridescence
    ? IRIDESCENT_COLORS[colorIndex]
    : null;

  // Resolve colors for revealed state
  let revealedBg = defaultBg;
  let revealedBorder = defaultBorder;
  let revealedText = defaultText;
  if (keyState === 'correct') {
    revealedBg = correctBg; revealedBorder = correctBorder; revealedText = '#f9fafb';
  } else if (keyState === 'present') {
    revealedBg = presentBg; revealedBorder = presentBorder; revealedText = presentText;
  } else if (keyState === 'absent') {
    revealedBg = absentBg; revealedBorder = absentBorder; revealedText = '#111827';
  }

  const keyLabel = letter === 'BACK' ? '⌫' : letter;

  // ── REVEALED KEY (game state colors always win) ──
  if (isRevealed) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.key,
          {
            width,
            marginHorizontal,
            borderRadius,
            backgroundColor: revealedBg,
            borderColor: revealedBorder,
            transform: [{ scale: pressed ? 0.88 : 1 }],
          },
        ]}
      >
        <Text style={[styles.keyText, { color: revealedText }]}>{keyLabel}</Text>
      </Pressable>
    );
  }

  // ── OUTLINE STYLE (any skin — no background, just border) ──
  if (keyStyle === 'outline') {
    const outlineBorder = isMetal
      ? skinConfig.border
      : isGem
      ? (skinConfig.glowColor ?? defaultBorder)
      : animatedBorderColor ?? defaultBorder;
    const outlineText = isMetal ? skinConfig.border : isGem ? (skinConfig.glowColor ?? defaultText) : defaultText;
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.key,
          {
            width,
            marginHorizontal,
            borderRadius,
            backgroundColor: 'transparent',
            borderColor: outlineBorder,
            borderWidth: 2,
            transform: [{ scale: pressed ? 0.88 : 1 }],
          },
        ]}
      >
        <Text style={[styles.keyText, { color: outlineText }]}>{keyLabel}</Text>
      </Pressable>
    );
  }

  // ── METAL TIER (LinearGradient) ──
  if (isMetal && skinConfig.gradient) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.key,
          {
            width,
            marginHorizontal,
            borderRadius,
            overflow: 'hidden',
            borderColor: skinConfig.border,
            transform: [{ scale: pressed ? 0.88 : 1 }],
          },
        ]}
      >
        <LinearGradient
          colors={skinConfig.gradient as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.keyText, { color: skinConfig.letterColor }]}>{keyLabel}</Text>
      </Pressable>
    );
  }

  // ── GEM TIER (ImageBackground) ──
  if (isGem) {
    const gemImage = GEM_IMAGES[skin];
    const borderColor = animatedBorderColor ?? skinConfig.glowColor ?? defaultBorder;
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.key,
          {
            width,
            marginHorizontal,
            borderRadius,
            overflow: 'hidden',
            borderColor,
            transform: [{ scale: pressed ? 0.88 : 1 }],
          },
        ]}
      >
        <ImageBackground
          source={gemImage}
          style={[StyleSheet.absoluteFill, styles.gemBg]}
          resizeMode="cover"
        />
        <Text style={[styles.keyText, styles.gemText, { color: skinConfig.letterColor }]}>{keyLabel}</Text>
      </Pressable>
    );
  }

  // ── DEFAULT (with variant color) ──
  const variant = DEFAULT_STYLES[defaultVariant] ?? DEFAULT_STYLES[1];
  const defBg = variant.background;
  const defBorder = variant.border;
  const defText = variant.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          width,
          marginHorizontal,
          borderRadius,
          backgroundColor: defBg,
          borderColor: defBorder,
          transform: [{ scale: pressed ? 0.88 : 1 }],
        },
      ]}
    >
      <Text style={[styles.keyText, { color: defText }]}>{keyLabel}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  key: {
    height: 52,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gemBg: {
    borderRadius: 6,
  },
  gemText: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default WordleKey;
