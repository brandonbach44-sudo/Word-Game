// src/wordgrid/utils/pathFinder.ts
import { isValidWord } from './validator';

export type Position = { row: number; col: number };

// Check if two positions are adjacent (including diagonals)
function isAdjacent(a: Position, b: Position): boolean {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

// Build a word from a path of positions
export function buildWordFromPath(grid: string[][], path: Position[]): string {
  return path.map(pos => grid[pos.row][pos.col]).join('');
}

// Validate a path (adjacency + dictionary check)
export function validatePath(
  grid: string[][],
  path: Position[]
): { word: string; valid: boolean } {
  // Ensure all moves are adjacent
  for (let i = 1; i < path.length; i++) {
    if (!isAdjacent(path[i - 1], path[i])) {
      return { word: '', valid: false };
    }
  }

  const word = buildWordFromPath(grid, path);
  const valid = isValidWord(word);
  return { word, valid };
}
