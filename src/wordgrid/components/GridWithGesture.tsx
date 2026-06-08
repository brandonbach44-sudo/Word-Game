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

// Dead zone: minimum travel from current cell center before a snap fires.
// Also the threshold for "returned to anchor" in the backtrack gate.
const DEAD_ZONE = CELL_STEP * 0.40;

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

// 8-way angle-based cell detection.
// Returns 'same' when still in the current cell's dead zone.
// Returns null when the candidate would be out of grid bounds.
// Returns a Position when a neighboring cell is detected.
//
// Flash prevention is NOT done here — it's handled by snapAnchorRef in onUpdate.
// Using angle (not proximity) means diagonals are just as easy as straight moves:
// every direction has an equal 45° sector.
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

  // Snap-anchor: the cell we most recently snapped FROM.
  //
  // WHY THIS FIXES THE FLASH:
  //   After snapping A→B, the angle computed FROM B immediately points back toward A
  //   (the finger is still between A and B). Without a gate this causes instant
  //   backtrack → re-snap → oscillation (green flash).
  //
  //   The fix: after snapping A→B we store A as the snap anchor. Any detected
  //   backtrack is blocked until the finger physically returns to within DEAD_ZONE
  //   of A. Since the finger was already outside A's dead zone when the snap fired,
  //   it must genuinely reverse all the way back before backtrack is allowed.
  //
  //   WHY THIS DOESN'T HURT DIAGONALS:
  //   The snap fires purely on angle (no proximity requirement), so diagonal cells
  //   are as easy to hit as straight ones. The anchor only prevents BACKWARD movement
  //   immediately after a snap — forward movement to C, D, etc. is never blocked.
  const snapAnchorRef = useRef<Position | null>(null);

  const resetGesture = () => {
    snapAnchorRef.current = null;
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      const cell = getNearestCell(e.x, e.y);
      pathRef.current = [cell];
      setSelectedCells([cell]);
      resetGesture();
    })
    .onStart((_e) => {
      // onBegin already committed the starting cell — do NOT override it here.
      // The old code re-computed the nearest cell at onStart time, which skipped
      // the starting letter when the user began dragging immediately after touch.
    })
    .onUpdate((e) => {
      const path = pathRef.current;
      if (path.length === 0) return;

      const lastCell = path[path.length - 1];
      const result = getCellFromAngle(lastCell, e.x, e.y);

      // Still in dead zone or out of grid bounds — no change
      if (result === 'same' || result === null) return;

      const cell = result;
      const existingIdx = path.findIndex((c) => c.row === cell.row && c.col === cell.col);

      if (existingIdx !== -1 && existingIdx !== path.length - 1) {
        // Detected a cell already in the path — potential backtrack.
        // Block it until the finger has physically returned to the snap-anchor's dead zone.
        if (snapAnchorRef.current) {
          const sac = cellCenter(snapAnchorRef.current);
          const distFromAnchor = Math.sqrt((e.x - sac.x) ** 2 + (e.y - sac.y) ** 2);
          if (distFromAnchor > DEAD_ZONE) return; // not back yet — hold
          // Finger is inside anchor's dead zone → genuine reversal, allow backtrack
          snapAnchorRef.current = null;
        }
        const trimmed = path.slice(0, existingIdx + 1);
        pathRef.current = trimmed;
        setSelectedCells(trimmed);
        return;
      }

      // Already the last cell — no change
      if (existingIdx === path.length - 1) return;

      // Forward snap: record the cell we're leaving as the new snap anchor
      snapAnchorRef.current = lastCell;
      const next = [...path, cell];
      pathRef.current = next;
      setSelectedCells(next);
    })
    .onEnd(() => {
      const path = pathRef.current;
      pathRef.current = [];
      setSelectedCells([]);
      resetGesture();
      if (path.length >= 3) onPathComplete(path);
    })
    .onFinalize(() => {
      if (pathRef.current.length > 0) {
        pathRef.current = [];
        setSelectedCells([]);
        resetGesture();
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
