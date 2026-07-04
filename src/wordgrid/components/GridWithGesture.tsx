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

// Anti-trembling: ignore finger movement within this radius of the current cell center.
// Kept small — the Voronoi midpoint is the real boundary; this just prevents jitter.
const DEAD_ZONE = CELL_STEP * 0.15;

// Extra clearance required before a backtrack fires.
// The finger must be BACKTRACK_GAP px CLOSER to the previous cell than to the current one.
// Forces a genuine reversal past the midpoint rather than a micro-wobble.
const BACKTRACK_GAP = CELL_STEP * 0.20;

// Smoothing applied to the raw touch point before it's used for cell detection
// (0 = no smoothing/raw point, 1 = frozen). At a 4-cell corner, the current cell
// and both orthogonal neighbors and the diagonal one are all momentarily
// equidistant — real finger jitter at that exact point is what causes "hooking"
// the wrong letter. Smoothing removes the jitter so the touch resolves toward
// wherever it's actually, consistently heading. The live rubber-band line still
// uses the raw point so the visual feels responsive.
const SMOOTHING_ALPHA = 0.55;

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

// Voronoi assignment: which of the 16 cells is the finger physically closest to?
// This is more robust than angle-sector math — the finger lands where it is,
// not where a 45° sector says it should be.
function getClosestCell(touchX: number, touchY: number): Position {
  let bestDistSq = Infinity;
  let bestCell: Position = { row: 0, col: 0 };
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const c = cellCenter({ row, col });
      const d = (touchX - c.x) ** 2 + (touchY - c.y) ** 2;
      if (d < bestDistSq) {
        bestDistSq = d;
        bestCell = { row, col };
      }
    }
  }
  return bestCell;
}

// True if a and b are 8-directionally adjacent (not the same cell).
function isAdjacent(a: Position, b: Position): boolean {
  return (
    Math.abs(a.row - b.row) <= 1 &&
    Math.abs(a.col - b.col) <= 1 &&
    !(a.row === b.row && a.col === b.col)
  );
}

interface Props {
  grid: string[][];
  onPathComplete: (path: Position[]) => void;
  disabled?: boolean;
}

// How long the finger must be still before the path auto-submits (ms).
const PAUSE_SUBMIT_MS = 300;

export default function GridWithGesture({ grid, onPathComplete, disabled = false }: Props) {
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [livePoint, setLivePoint] = useState<{ x: number; y: number } | null>(null);
  const pathRef = useRef<Position[]>([]);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Smoothed touch point used for cell-detection math (see SMOOTHING_ALPHA above).
  const smoothedRef = useRef<{ x: number; y: number } | null>(null);

  // Clear any pending pause-submit timer.
  const clearPauseTimer = () => {
    if (pauseTimerRef.current !== null) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };

  // Submit the current path and reset state, used by both onEnd and the pause timer.
  const submitPath = () => {
    clearPauseTimer();
    const path = pathRef.current;
    pathRef.current = [];
    setSelectedCells([]);
    setLivePoint(null);
    if (path.length >= 3) onPathComplete(path);
  };

  // Restart the pause-submit countdown. Called on every finger movement.
  const resetPauseTimer = () => {
    clearPauseTimer();
    pauseTimerRef.current = setTimeout(submitPath, PAUSE_SUBMIT_MS);
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      clearPauseTimer();
      const cell = getClosestCell(e.x, e.y);
      pathRef.current = [cell];
      setSelectedCells([cell]);
      setLivePoint({ x: e.x, y: e.y });
      smoothedRef.current = { x: e.x, y: e.y };
    })
    .onStart((_e) => {
      // onBegin already committed the starting cell — do NOT override it here.
    })
    .onUpdate((e) => {
      setLivePoint({ x: e.x, y: e.y });
      resetPauseTimer(); // restart the pause countdown on every movement

      // Update the smoothed point (EMA) used for all cell-detection math below.
      // This is what removes corner jitter without penalizing genuine diagonal moves.
      const prevSmoothed = smoothedRef.current ?? { x: e.x, y: e.y };
      const smoothed = {
        x: prevSmoothed.x + (e.x - prevSmoothed.x) * (1 - SMOOTHING_ALPHA),
        y: prevSmoothed.y + (e.y - prevSmoothed.y) * (1 - SMOOTHING_ALPHA),
      };
      smoothedRef.current = smoothed;

      const path = pathRef.current;
      if (path.length === 0) return;

      const lastCell = path[path.length - 1];
      const lastCenter = cellCenter(lastCell);
      const dx = smoothed.x - lastCenter.x;
      const dy = smoothed.y - lastCenter.y;
      const distFromLast = Math.sqrt(dx * dx + dy * dy);

      // Anti-trembling: ignore tiny movements right around the current cell center.
      if (distFromLast < DEAD_ZONE) return;

      // Voronoi: which cell is the (smoothed) finger physically closest to?
      const closest = getClosestCell(smoothed.x, smoothed.y);

      // Still in the same cell's territory — nothing to do.
      if (closest.row === lastCell.row && closest.col === lastCell.col) return;

      // We only snap to cells that are adjacent to the current last cell.
      // This prevents "jumping" across the grid on fast swipes.
      if (!isAdjacent(lastCell, closest)) return;

      const existingIdx = path.findIndex(
        (c) => c.row === closest.row && c.col === closest.col
      );

      if (existingIdx !== -1 && existingIdx !== path.length - 1) {
        // Potential backtrack — require the finger to be convincingly past the midpoint
        // toward the previous cell before trimming, so micro-wobbles don't revert.
        const closestCenter = cellCenter(closest);
        const distToClosest = Math.sqrt(
          (smoothed.x - closestCenter.x) ** 2 + (smoothed.y - closestCenter.y) ** 2
        );
        // distFromLast - distToClosest = how much closer we are to the backtrack target
        // than to the cell we're leaving. Must exceed BACKTRACK_GAP.
        if (distFromLast - distToClosest < BACKTRACK_GAP) return;

        const trimmed = path.slice(0, existingIdx + 1);
        pathRef.current = trimmed;
        setSelectedCells(trimmed);
        return;
      }

      // Already the last cell in the path — no change.
      if (existingIdx === path.length - 1) return;

      // Forward: add the new adjacent cell. No extra hysteresis needed here —
      // the EMA smoothing above already removes the corner jitter that used to
      // cause wrong-letter hooks, without adding drag on genuine diagonal moves.
      const next = [...path, closest];
      pathRef.current = next;
      setSelectedCells(next);
    })
    .onEnd(() => {
      submitPath();
    })
    .onFinalize(() => {
      // Covers cancelled gestures (e.g. incoming call interrupting the touch).
      if (pathRef.current.length > 0) submitPath();
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

          {/* Path lines + live rubber-band line */}
          {(selectedCells.length >= 2 || (selectedCells.length === 1 && livePoint)) && (
            <Svg
              style={StyleSheet.absoluteFill}
              width={innerSize}
              height={innerSize}
              pointerEvents="none"
            >
              {/* Committed path lines */}
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
              {/* Live rubber-band: last selected cell → current finger */}
              {livePoint && selectedCells.length >= 1 && (() => {
                const from = cellCenter(selectedCells[selectedCells.length - 1]);
                return (
                  <Line
                    x1={from.x}
                    y1={from.y}
                    x2={livePoint.x}
                    y2={livePoint.y}
                    stroke="rgba(255,255,255,0.40)"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray="6,5"
                  />
                );
              })()}
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
