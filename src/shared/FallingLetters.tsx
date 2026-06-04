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
}

function FallingTile({ tile }: { tile: TileConfig }) {
  const translateY = useRef(new Animated.Value(-tile.size - 20)).current;

  useEffect(() => {
    const totalDistance = SCREEN_HEIGHT + tile.size + 120;

    const startAnimation = () => {
      translateY.setValue(-tile.size - 20);
      Animated.timing(translateY, {
        toValue: totalDistance,
        duration: tile.duration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) startAnimation();
      });
    };

    const timeout = setTimeout(startAnimation, tile.delay);
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
  const tiles: TileConfig[] = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
    startX: Math.random() * (SCREEN_WIDTH - 60),
    delay: Math.random() * 12000,
    duration: 12000 + Math.random() * 8000,
    size: 40 + Math.random() * 20,
  }));

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
