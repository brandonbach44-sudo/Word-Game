// src/wordgrid/components/GridWithGesture.tsx
import React, { useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { Position } from '../utils/pathFinder';

type GridProps = {
  grid: string[][];
  onPathComplete: (path: Position[]) => { success: boolean } | void;
};

export default function GridWithGesture({ grid, onPathComplete }: GridProps) {
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const [pulseColor, setPulseColor] = useState<string | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const pos = getCellFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY, grid.length);
        if (pos) setCurrentPath([pos]);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const pos = getCellFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY, grid.length);
        if (pos && !currentPath.some(p => p.row === pos.row && p.col === pos.col)) {
          setCurrentPath(prev => [...prev, pos]);
        }
      },
      onPanResponderRelease: () => {
        const result = onPathComplete(currentPath);
        if (result) {
          setPulseColor(result.success ? 'green' : 'red');
        }
        setCurrentPath([]);
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((letter, colIndex) => {
            const isSelected = currentPath.some(p => p.row === rowIndex && p.col === colIndex);
            return (
              <PulseCell
                key={colIndex}
                letter={letter}
                isSelected={isSelected}
                pulseColor={pulseColor}
              />
            );
          })}
        </View>
      ))}

      {/* Path lines */}
      <Svg style={StyleSheet.absoluteFill}>
        {currentPath.map((pos, i) => {
          if (i === 0) return null;
          const prev = currentPath[i - 1];
          const cellSize = 68;
          const x1 = prev.col * cellSize + cellSize / 2;
          const y1 = prev.row * cellSize + cellSize / 2;
          const x2 = pos.col * cellSize + cellSize / 2;
          const y2 = pos.row * cellSize + cellSize / 2;
          return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="blue" strokeWidth={4} />;
        })}
      </Svg>
    </View>
  );
}

// Animated cell component
function PulseCell({ letter, isSelected, pulseColor }: { letter: string; isSelected: boolean; pulseColor: string | null }) {
  const color = useSharedValue('#f0f0f0');

  useEffect(() => {
    if (isSelected && pulseColor) {
      color.value = withSequence(
        withTiming(pulseColor, { duration: 200 }),
        withTiming('#f0f0f0', { duration: 400 })
      );
    }
  }, [isSelected, pulseColor]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: color.value,
  }));

  return (
    <Animated.View style={[styles.cell, animatedStyle]}>
      <Text style={styles.letter}>{letter}</Text>
    </Animated.View>
  );
}

function getCellFromTouch(x: number, y: number, size: number): Position | null {
  const cellSize = 68;
  const row = Math.floor(y / cellSize);
  const col = Math.floor(x / cellSize);
  if (row >= 0 && row < size && col >= 0 && col < size) {
    return { row, col };
  }
  return null;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  row: { flexDirection: 'row' },
  cell: {
    width: 60,
    height: 60,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  letter: { fontSize: 24, fontWeight: 'bold' },
});
