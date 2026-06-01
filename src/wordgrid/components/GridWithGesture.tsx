import React, { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Position } from '../utils/pathFinder';

const GRID_SIZE = 4;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / GRID_SIZE);

interface Props {
  grid: string[][];
  onPathComplete: (path: Position[]) => void;
  disabled?: boolean;
}

export default function GridWithGesture({ grid, onPathComplete, disabled = false }: Props) {
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);

  const getCellFromCoords = useCallback((x: number, y: number): Position | null => {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  }, []);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart((e) => {
      const cell = getCellFromCoords(e.x, e.y);
      if (cell) setSelectedCells([cell]);
    })
    .onUpdate((e) => {
      const cell = getCellFromCoords(e.x, e.y);
      if (!cell) return;
      setSelectedCells((prev) => {
        const exists = prev.some((c) => c.row === cell.row && c.col === cell.col);
        if (exists) return prev;
        return [...prev, cell];
      });
    })
    .onEnd(() => {
      const path = selectedCells;
      setSelectedCells([]);
      if (path.length >= 3) {
        onPathComplete(path);
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={[
          styles.gridContainer,
          { width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE },
        ]}
      >
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
                  {isSelected && (
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexText}>{selIndex + 1}</Text>
                    </View>
                  )}
                  <Text style={[styles.letter, isSelected && styles.selectedLetter]}>
                    {letter}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    alignSelf: 'center',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 2,
    borderColor: '#c8b89a',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f0e6',
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: '#4ecca3',
    borderColor: '#3db892',
  },
  letter: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3d2e1c',
  },
  selectedLetter: {
    color: '#fff',
  },
  indexBadge: {
    position: 'absolute',
    top: 3,
    right: 5,
  },
  indexText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
});
