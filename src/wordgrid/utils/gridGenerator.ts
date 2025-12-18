// src/wordgrid/utils/gridGenerator.ts
import { letterFrequency } from '../data/letterFrequency';

// Weighted random letter generator
function weightedRandomLetter(): string {
  const letters = Object.keys(letterFrequency);
  const weights = Object.values(letterFrequency);
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.floor(Math.random() * total);

  for (let i = 0; i < letters.length; i++) {
    rand -= weights[i];
    if (rand < 0) return letters[i];
  }
  return 'E'; // fallback
}

// Generate a grid of given size (default 4×4)
export function generateGrid(size: number = 4): string[][] {
  const grid: string[][] = [];
  for (let row = 0; row < size; row++) {
    const rowLetters: string[] = [];
    for (let col = 0; col < size; col++) {
      rowLetters.push(weightedRandomLetter());
    }
    grid.push(rowLetters);
  }
  return grid;
}
