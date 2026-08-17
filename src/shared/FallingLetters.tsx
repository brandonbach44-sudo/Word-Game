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
  seedY: number; // >= 0 → starts mid-screen (pre-seeded); -1 → starts from top after delay
}

function FallingTile({ tile }: { tile: TileConfig }) {
  const totalDistance = SCREEN_HEIGHT + tile.size + 120;
  const isPreSeeded = tile.seedY >= 0;
  const translateY = useRef(new Animated.Value(isPreSeeded ? tile.seedY : -tile.size - 20)).current;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    // Each loop waits a random rest before falling again — this is what
    // prevents tiles from syncing into batches over time.
    const fall = (restDelay: number) => {
      timeout = setTimeout(() => {
        translateY.setValue(-tile.size - 20);
        Animated.timing(translateY, {
          toValue: totalDistance,
          duration: tile.duration,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            // Random rest 1–4 s before next fall keeps tiles permanently spread out
            fall(1000 + Math.random() * 3000);
          }
        });
      }, restDelay);
    };

    if (isPreSeeded) {
      // First pass: animate from current mid-screen Y to bottom (proportional duration)
      const remainingFraction = (totalDistance - tile.seedY) / totalDistance;
      Animated.timing(translateY, {
        toValue: totalDistance,
        duration: remainingFraction * tile.duration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) fall(500 + Math.random() * 2000);
      });
    } else {
      // Incoming tile: staggered initial delay, then loop with random rests
      fall(tile.delay);
    }

    return () => clearTimeout(timeout);
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
  // 12 pre-seeded tiles scattered across the screen at mount — immediate visual density
  const preSeeded: TileConfig[] = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
    startX: Math.random() * (SCREEN_WIDTH - 60),
    delay: 0,
    duration: 10000 + Math.random() * 8000,
    size: 40 + Math.random() * 20,
    seedY: Math.random() * SCREEN_HEIGHT * 0.85,
  }));

  // 8 incoming tiles with tight stagger to fill gaps without bunching
  const incoming: TileConfig[] = Array.from({ length: 8 }, (_, i) => ({
    id: 12 + i,
    letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
    startX: Math.random() * (SCREEN_WIDTH - 60),
    delay: 500 + Math.random() * 5000, // 0.5–5.5 s stagger
    duration: 10000 + Math.random() * 8000,
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
