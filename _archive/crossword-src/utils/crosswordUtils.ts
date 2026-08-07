import { CrosswordPuzzle, CrosswordSlot } from "../data/crossword_puzzles";

export const GRID_SIZE = 7;

// ── Seeded daily order (same pattern as Wordle) ──
// Keeps "which puzzle appears on which day" decoupled from the raw array
// order in crossword_puzzles.ts, so edits/additions to that file later can't
// accidentally reshuffle which puzzle a user already saw on a given day
// (beyond appending new puzzles at the end, which is safe).
function mulberry32(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDailyOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  const rand = mulberry32(0xc0ffee);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

let _dailyOrderCache: number[] | null = null;
export function getDailyOrder(length: number): number[] {
  if (!_dailyOrderCache || _dailyOrderCache.length !== length) {
    _dailyOrderCache = buildDailyOrder(length);
  }
  return _dailyOrderCache;
}

export function getDailyIndex(puzzleCount: number, date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayNumber = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / msPerDay
  );
  return Math.abs(dayNumber) % puzzleCount;
}

export function getPuzzleForDate(puzzles: CrosswordPuzzle[], date = new Date()): CrosswordPuzzle {
  const order = getDailyOrder(puzzles.length);
  const idx = getDailyIndex(puzzles.length, date);
  return puzzles[order[idx]];
}

export function getTodayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getSecondsUntilNextMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

export function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
}

// ── Grid geometry ──

export type CellMeta = {
  row: number;
  col: number;
  black: boolean;
  number: number | null;
  acrossSlotIdx: number | null;
  downSlotIdx: number | null;
};

export type GridMeta = {
  cells: CellMeta[][]; // [row][col]
  answers: string[][]; // correct letter per cell, "" for black
};

export function buildGridMeta(puzzle: CrosswordPuzzle): GridMeta {
  const blackSet = new Set(puzzle.black.map(([r, c]) => `${r},${c}`));
  const cells: CellMeta[][] = Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => ({
      row: r,
      col: c,
      black: blackSet.has(`${r},${c}`),
      number: null,
      acrossSlotIdx: null,
      downSlotIdx: null,
    }))
  );

  const answers: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "")
  );

  puzzle.slots.forEach((slot, slotIdx) => {
    for (let i = 0; i < slot.answer.length; i++) {
      const r = slot.dir === "A" ? slot.row : slot.row + i;
      const c = slot.dir === "A" ? slot.col + i : slot.col;
      answers[r][c] = slot.answer[i];
      if (slot.dir === "A") cells[r][c].acrossSlotIdx = slotIdx;
      else cells[r][c].downSlotIdx = slotIdx;
    }
  });

  // Standard crossword numbering: scan row-major, number any cell that is
  // the start of an across or down entry.
  let num = 1;
  const startCells = new Set<string>();
  puzzle.slots.forEach((slot) => startCells.add(`${slot.row},${slot.col}`));
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (cells[r][c].black) continue;
      if (startCells.has(`${r},${c}`)) {
        cells[r][c].number = num;
        num++;
      }
    }
  }

  return { cells, answers };
}

export function createEmptyFilled(): string[][] {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => ""));
}

export function isGridComplete(filled: string[][], answers: string[][], black: Set<string>): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (black.has(`${r},${c}`)) continue;
      if (!filled[r][c] || filled[r][c] !== answers[r][c]) return false;
    }
  }
  return true;
}

export function countMistakes(filled: string[][], answers: string[][], black: Set<string>): number {
  let mistakes = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (black.has(`${r},${c}`)) continue;
      if (filled[r][c] && filled[r][c] !== answers[r][c]) mistakes++;
    }
  }
  return mistakes;
}

export function blackSetOf(puzzle: CrosswordPuzzle): Set<string> {
  return new Set(puzzle.black.map(([r, c]) => `${r},${c}`));
}

export function getSlotCells(slot: CrosswordSlot): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = 0; i < slot.answer.length; i++) {
    const r = slot.dir === "A" ? slot.row : slot.row + i;
    const c = slot.dir === "A" ? slot.col + i : slot.col;
    cells.push([r, c]);
  }
  return cells;
}
