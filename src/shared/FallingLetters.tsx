import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface TileConfig {
  id: number;
  letter: string;
  startX: number;
  delay: number;
  duration: number;
  size: number;
  seedY: number; // if >= 0, tile starts mid-screen at this Y (pre-seeded); if -1, starts from top with delay
}

function FallingTile({ tile }: { tile: TileConfig }) {
  const totalDistance = SCREEN_HEIGHT + tile.size + 120;
  const isPreSeeded = tile.seedY >= 0;
  const translateY = useRef(new Animated.Value(isPreSeeded ? tile.seedY : -tile.size - 20)).current;

  useEffect(() => {
    const loopAnimation = () => {
      translateY.setValue(-tile.size - 20);
      Animated.timing(translateY, {
        toValue: totalDistance,
        duration: tile.duration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) loopAnimation();
      });
    };

    if (isPreSeeded) {
      // First pass: animate from mid-screen to bottom, proportionally shorter duration
      const remainingFraction = (totalDistance - tile.seedY) / totalDistance;
      const remainingDuration = remainingFraction * tile.duration;
      Animated.timing(translateY, {
        toValue: totalDistance,
        duration: remainingDuration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) loopAnimation();
      });
    } else {
      // New tile: wait for staggered delay then fall from top
      const timeout = setTimeout(loopAnimation, tile.delay);
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <Animated.View
      style={[
        styles.tileWrapper,
        {
          left: tile.startX,
          top: 0,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.tile,
          {
            width: tile.size,
            height: tile.size,
            borderRadius: tile.size * 0.18,
          },
        ]}
      >
        <Text style={[styles.letter, { fontSize: tile.size * 0.5 }]}>
          {tile.letter}
        </Text>
      </View>
    </Animated.View>
  );
}

export function FallingLetters() {
  // 10 pre-seeded tiles scattered across the screen at mount time
  const preSeeded: TileConfig[] = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
    startX: Math.random() * (SCREEN_WIDTH - 60),
    delay: 0,
    duration: 12000 + Math.random() * 8000,
    size: 40 + Math.random() * 20,
    seedY: Math.random() * SCREEN_HEIGHT * 0.85, // random position on screen
  }));

  // 5 new tiles that trickle in with wide staggered delays
  const incoming: TileConfig[] = Array.from({ length: 5 }, (_, i) => ({
    id: 10 + i,
    letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
    startX: Math.random() * (SCREEN_WIDTH - 60),
    delay: 2000 + Math.random() * 8000, // 2–10s stagger so they don't bunch up
    duration: 12000 + Math.random() * 8000,
    size: 40 + Math.random() * 20,
    seedY: -1,
  }));

  const tiles = [...preSeeded, ...incoming];

  return (
    <View style={styles.container} pointerEvents="none">
      {tiles.map((tile) => (
        <FallingTile key={tile.id} tile={tile} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  tileWrapper: {
    position: 'absolute',
  },
  tile: {
    backgroundColor: '#FFECB3',
    borderWidth: 2,
    borderColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    opacity: 0.85,
  },
  letter: {
    fontWeight: 'bold',
    color: '#5D4037',
  },
});
