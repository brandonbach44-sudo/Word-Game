import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Line } from 'react-native-svg';
import type { Position } from '../utils/pathFinder';

const GRID_SIZE = 4;
const CELL_GAP = 8;
const GRID_PADDING = 12;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48 - GRID_PADDING * 2 - CELL_GAP * (GRID_SIZE - 1)) / GRID_SIZE);
const GRID_DIM = GRID_SIZE * CELL_SIZE + CELL_GAP * (GRID_SIZE - 1);

// Center pixel of a cell (relative to the inner gesture area, offset by padding)
function cellCenter(pos: Position) {
  return {
    x: GRID_PADDING + pos.col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    y: GRID_PADDING + pos.row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
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

  // Nearest-cell-center approach: snaps to whichever cell center is closest,
  // as long as the finger is within a reasonable radius. This fixes:
  //  • First-letter misses (strict boundary rejection no longer blocks onStart)
  //  • Diagonal tracking (no gap-zone null returns mid-swipe)
  //  • Side-letter false positives (threshold prevents jumping to far cells)
  const getCellFromCoords = useCallback((x: number, y: number): Position | null => {
    const cellStep = CELL_SIZE + CELL_GAP;
    let bestDist = Infinity;
    let bestCell: Position | null = null;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cx = GRID_PADDING + col * cellStep + CELL_SIZE / 2;
        const cy = GRID_PADDING + row * cellStep + CELL_SIZE / 2;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < bestDist) {
          bestDist = dist;
          bestCell = { row, col };
        }
      }
    }

    // Only snap if within ~60% of half-cell-step — tight enough to avoid
    // accidentally grabbing adjacent cells, loose enough for natural diagonals
    const threshold = cellStep * 0.6;
    return bestDist <= threshold ? bestCell : null;
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

  const innerSize = GRID_DIM + GRID_PADDING * 2;

  return (
    <View style={styles.outerContainer}>
      <GestureDetector gesture={panGesture}>
        <View style={[styles.gridContainer, { width: innerSize, height: innerSize }]}>
          {/* Letter cells */}
          <View style={styles.cellsWrapper}>
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

          {/* Path lines — drawn on top of the grid */}
          {selectedCells.length >= 2 && (
            <Svg
              style={StyleSheet.absoluteFill}
              width={innerSize}
              height={innerSize}
              pointerEvents="none"
            >
              {selectedCells.slice(0, -1).map((pos, i) => {
                const from = cellCenter(pos);
                const to = cellCenter(selectedCells[i + 1]);
                return (
                  <Line
                    key={i}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                );
              })}
            </Svg>
          )}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignSelf: 'center',
    marginVertical: 12,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#4ecca3',
    overflow: 'hidden',
  },
  gridContainer: {
    alignSelf: 'center',
  },
  cellsWrapper: {
    padding: GRID_PADDING,
    gap: CELL_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  cell: {
    borderWidth: 1.5,
    borderColor: '#c8b89a',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f0e6',
    borderRadius: 10,
    // Subtle 3D shadow (bottom-weighted)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCell: {
    backgroundColor: '#4ecca3',
    borderColor: '#3db892',
  },
  letter: {
    fontSize: 28,
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
