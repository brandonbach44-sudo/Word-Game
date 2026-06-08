// app/wordgrid/components/GridWithGesture.tsx
import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Line } from 'react-native-svg';
import type { Position } from '../utils/pathFinder';

const GRID_SIZE = 4;
const CELL_GAP = 8;
const GRID_PADDING = 12;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor(
  (SCREEN_WIDTH - 48 - GRID_PADDING * 2 - CELL_GAP * (GRID_SIZE - 1)) / GRID_SIZE
);
const CELL_STEP = CELL_SIZE + CELL_GAP;
const GRID_DIM = GRID_SIZE * CELL_SIZE + CELL_GAP * (GRID_SIZE - 1);

// Serif "I" — renders with top and bottom horizontal bars so it's
// clearly distinguishable from lowercase "l"
function SerifI({ color }: { color: string }) {
  const barW = 18;
  const stemW = 4;
  const stemH = 16;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: barW, height: stemW, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: stemW, height: stemH, backgroundColor: color }} />
      <View style={{ width: barW, height: stemW, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

// Center pixel of a cell (relative to the inner gesture area, offset by padding)
function cellCenter(pos: Position) {
  return {
    x: GRID_PADDING + pos.col * CELL_STEP + CELL_SIZE / 2,
    y: GRID_PADDING + pos.row * CELL_STEP + CELL_SIZE / 2,
  };
}

// Find the nearest cell to a raw touch coordinate (used for initial tap).
function getNearestCell(x: number, y: number): Position {
  let bestDist = Infinity;
  let bestCell: Position = { row: 0, col: 0 };
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cx = GRID_PADDING + col * CELL_STEP + CELL_SIZE / 2;
      const cy = GRID_PADDING + row * CELL_STEP + CELL_SIZE / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestCell = { row, col };
      }
    }
  }
  return bestCell;
}

// Midpoint-rule next-cell selection.
//
// A neighbor cell is selected when the finger is physically CLOSER to it than to
// the current cell. This is the only threshold that is geometrically self-correcting:
//
//   • You cannot simultaneously be closer to B than A AND closer to A than B,
//     so forward-snap and backtrack-snap can never both fire in the same frame.
//     This eliminates the flash without any extra state or commit gates.
//
//   • Diagonals work correctly because proximity is computed per-cell, not by
//     angle. The diagonal neighbor wins when the finger is genuinely in its
//     territory, with no tiebreaking bias.
//
//   • The adjacency constraint (max 1 step in each axis) prevents the finger
//     from jumping across the grid.
//
// Returns the neighbor that the finger has crossed into, or null if the finger
// is still closest to the current cell (no change needed).
function getNextCell(x: number, y: number, lastCell: Position): Position | null {
  const lastCenter = cellCenter(lastCell);
  const distToLast = Math.sqrt((x - lastCenter.x) ** 2 + (y - lastCenter.y) ** 2);

  // A neighbor must beat this distance (be strictly closer than the current cell).
  let bestDist = distToLast;
  let bestCell: Position | null = null;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const dr = Math.abs(row - lastCell.row);
      const dc = Math.abs(col - lastCell.col);
      // Only 8-directional neighbors; skip the current cell itself
      if (dr > 1 || dc > 1 || (dr === 0 && dc === 0)) continue;

      const cx = GRID_PADDING + col * CELL_STEP + CELL_SIZE / 2;
      const cy = GRID_PADDING + row * CELL_STEP + CELL_SIZE / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist < bestDist) {
        bestDist = dist;
        bestCell = { row, col };
      }
    }
  }

  return bestCell;
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

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      // onBegin fires instantly on touch — snap to nearest cell unconditionally
      const cell = getNearestCell(e.x, e.y);
      const next = [cell];
      pathRef.current = next;
      setSelectedCells(next);
    })
    .onUpdate((e) => {
      const path = pathRef.current;
      if (path.length === 0) return;

      const lastCell = path[path.length - 1];
      const cell = getNextCell(e.x, e.y, lastCell);

      // Finger is still closest to the current cell — no change
      if (!cell) return;

      // Backtracking: cell already exists earlier in the path
      const existingIdx = path.findIndex((c) => c.row === cell.row && c.col === cell.col);
      if (existingIdx !== -1 && existingIdx !== path.length - 1) {
        const trimmed = path.slice(0, existingIdx + 1);
        pathRef.current = trimmed;
        setSelectedCells(trimmed);
        return;
      }

      // Already the last cell — no change
      if (existingIdx === path.length - 1) return;

      // Append new cell
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
      // Safety reset if gesture is cancelled mid-drag
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
                      {letter === 'I' ? (
                        <SerifI color={isSelected ? '#fff' : '#3d2e1c'} />
                      ) : (
                        <Text style={[styles.letter, isSelected && styles.selectedLetter]}>
                          {letter}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Path lines between selected cells */}
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
                    strokeWidth={7}
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
