import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Line } from 'react-native-svg';
import type { Position } from '../utils/pathFinder';

const GRID_SIZE = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / GRID_SIZE);
const GRID_DIM = GRID_SIZE * CELL_SIZE;

// Center pixel of a cell
function cellCenter(pos: Position) {
  return {
    x: pos.col * CELL_SIZE + CELL_SIZE / 2,
    y: pos.row * CELL_SIZE + CELL_SIZE / 2,
  };
}

interface Props {
  grid: string[][];
  onPathComplete: (path: Position[]) => void;
  disabled?: boolean;
}

export default function GridWithGesture({ grid, onPathComplete, disabled = false }: Props) {
  // selectedCells drives render; pathRef is the source-of-truth for gesture callbacks
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const pathRef = useRef<Position[]>([]);

  const getCellFromCoords = useCallback((x: number, y: number): Position | null => {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  }, []);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .runOnJS(true)
    .onStart((e) => {
      const cell = getCellFromCoords(e.x, e.y);
      const next = cell ? [cell] : [];
      pathRef.current = next;
      setSelectedCells(next);
    })
    .onUpdate((e) => {
      const cell = getCellFromCoords(e.x, e.y);
      if (!cell) return;

      const path = pathRef.current;

      // Check if we're backtracking (cell is already in path, not the last one)
      const existingIdx = path.findIndex((c) => c.row === cell.row && c.col === cell.col);

      if (existingIdx !== -1 && existingIdx !== path.length - 1) {
        // Backtrack: trim path back to this cell
        const trimmed = path.slice(0, existingIdx + 1);
        pathRef.current = trimmed;
        setSelectedCells(trimmed);
        return;
      }

      // Skip if it's already the last cell
      if (existingIdx === path.length - 1) return;

      // Otherwise append
      const next = [...path, cell];
      pathRef.current = next;
      setSelectedCells(next);
    })
    .onEnd(() => {
      const path = pathRef.current;
      pathRef.current = [];
      setSelectedCells([]);
      if (path.length >= 3) {
        onPathComplete(path);
      }
    })
    .onFinalize(() => {
      // Safety reset if gesture is cancelled
      if (pathRef.current.length > 0) {
        pathRef.current = [];
        setSelectedCells([]);
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.gridContainer, { width: GRID_DIM, height: GRID_DIM }]}>
        {/* Letter cells */}
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((letter, c) => {
              const selIndex = selectedCells.findIndex(
                (cell) => cell.row === r && cell.col === c
              );
              const isSelected = selIndex !== -1;
              return (
                <View
                  key={c}
                  style={[
                    styles.cell,
                    { width: CELL_SIZE, height: CELL_SIZE },
                    isSelected && styles.selectedCell,
                  ]}
                >
                  {isSele