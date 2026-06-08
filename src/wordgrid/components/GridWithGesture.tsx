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

// Dead zone: minimum travel from current cell center before we look for the next cell.
// Small = responsive feel. The high-water-mark gate (not proximity) prevents flash.
const DEAD_ZONE = CELL_STEP * 0.35;

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

// Angle-only cell detection with high-water-mark backtrack gate.
//
// APPROACH:
//   Snap fires purely on angle (8-way, 45° sectors) once the finger leaves the dead
//   zone. There is NO proximity requirement — this keeps diagonals easy to hit.
//
//   Flash prevention: After each forward snap, we record how far the finger was from
//   the *previous* cell at snap time (snapDistRef). We also track the maximum distance
//   the finger has ever been from the previous cell (maxDistRef / highWaterRef).
//   Backtracking is only allowed once the finger's current distance from the previous
//   cell drops BELOW snapDistRef — meaning it has reversed past the snap point.
//   Because the finger is still moving forward right after a snap, backtrack is blocked
//   for that brief moment → no flash, no oscillation.
//
// Returns:
//   'same'   → still inside current cell's dead zone
//   null     → outside dead zone but high-water-mark gate blocks backtrack
//   Position → snap to this cell
function getCellFromAngle(
  lastCell: Position,
  touchX: number,
  touchY: number
): Position | 'same' | null {
  const center = cellCenter(lastCell);
  const dx = touchX - center.x;
  const dy = touchY - center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < DEAD_ZONE) return 'same';

  const ux = dx / dist;
  const uy = dy / dist;

  const S2 = 1 / Math.sqrt(2);
  const DIRS = [
    { dr: -1, dc:  0, nx:  0,  ny: -1  }, // N
    { dr: -1, dc:  1, nx:  S2, ny: -S2 }, // NE
    { dr:  0, dc:  1, nx:  1,  ny:  0  }, // E
    { dr:  1, dc:  1, nx:  S2, ny:  S2 }, // SE
    { dr:  1, dc:  0, nx:  0,  ny:  1  }, // S
    { dr:  1, dc: -1, nx: -S2, ny:  S2 }, // SW
    { dr:  0, dc: -1, nx: -1,  ny:  0  }, // W
    { dr: -1, dc: -1, nx: -S2, ny: -S2 }, // NW
  ] as const;

  let bestDot = -Infinity;
  let bestDr = 0;
  let bestDc = 0;
  for (const dir of DIRS) {
    const dot = dir.nx * ux + dir.ny * uy;
    if (dot > bestDot) {
      bestDot = dot;
      bestDr = dir.dr;
      bestDc = dir.dc;
    }
  }

  const newRow = lastCell.row + bestDr;
  const newCol = lastCell.col + bestDc;
  if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) return null;

  return { row: newRow, col: newCol };
}

interface Props {
  grid: string[][];
  onPathComplete: (path: Position[]) => void;
  disabled?: boolean;
}

export default function GridWithGesture({ grid, onPathComplete, disabled = false }: Props) {
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const pathRef = useRef<Position[]>([]);

  // High-water-mark refs: prevent backtrack-flash right after a forward snap.
  // snapDistRef  — distance from prev cell at snap time (the "snap point")
  // highWaterRef — max distance achieved from prev cell since last snap
  const snapDistRef = useRef<number>(0);
  const highWaterRef = useRef<number>(0);

  const resetHighWater = () => {
    snapDistRef.current = 0;
    highWaterRef.current = 0;
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      const cell = getNearestCell(e.x, e.y);
      pathRef.current = [cell];
      setSelectedCells([cell]);
      resetHighWater();
    })
    .onStart((e) => {
      // If the finger moved slightly before RNGH activation and landed on a different
      // cell, update without clearing the path.
      const cell = getNearestCell(e.x, e.y);
      const path = pathRef.current;
      const alreadyFirst =
        path.length > 0 && path[0].row === cell.row && path[0].col === cell.col;
      if (!alreadyFirst) {
        pathRef.current = [cell];
        setSelectedCells([cell]);
        resetHighWater();
      }
    })
    .onUpdate((e) => {
      const path = pathRef.current;
      if (path.length === 0) return;

      const lastCell = path[path.length - 1];
      const result = getCellFromAngle(lastCell, e.x, e.y);

      if (result === 'same') {
        // Inside dead zone — reset high water (finger is firmly on current cell)
        resetHighWater();
        return;
      }

      if (result === null) return; // out of bounds

      const cell = result;

      // Compute current distance from last cell center (for high-water-mark)
      const lc = cellCenter(lastCell);
      const distFromLast = Math.sqrt((e.x - lc.x) ** 2 + (e.y - lc.y) ** 2);
      highWaterRef.current = Math.max(highWaterRef.current, distFromLast);

      const existingIdx = path.findIndex((c) => c.row === cell.row && c.col === cell.col);

      if (existingIdx !== -1 && existingIdx !== path.length - 1) {
        // Finger is pointing toward a previous cell — potential backtrack.
        // Only allow if finger has retreated back past the snap point.
        if (highWaterRef.current > 0 && distFromLast >= snapDistRef.current) return;
        // Genuine backtrack confirmed
        const trimmed = path.slice(0, existingIdx + 1);
        pathRef.current = trimmed;
        setSelectedCells(trimmed);
        resetHighWater();
        return;
      }

      // Already the last cell — no change
      if (existingIdx === path.length - 1) return;

      // Forward snap: record distance at snap time and reset high water
      snapDistRef.current = distFromLast;
      highWaterRef.current = distFromLast;

      const next = [...path, cell];
      pathRef.current = next;
      setSelectedCells(next);
    })
    .onEnd(() => {
      const path = pathRef.current;
      pathRef.current = [];
      setSelectedCells([]);
      resetHighWater();
      if (path.length >= 3) onPathComplete(path);
    })
    .onFinalize(() => {
      if (pathRef.current.length > 0) {
        pathRef.current = [];
        setSelectedCells([]);
        resetHighWater();
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
