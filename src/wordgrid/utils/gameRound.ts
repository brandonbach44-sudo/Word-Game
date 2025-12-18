// src/wordgrid/utils/gameRound.ts
import { generateGrid } from './gridGenerator';
import { Position, validatePath } from './pathFinder';
import { calculateWordScore } from './scoring';
import { GameTimer } from './timer';

export class GameRound {
  private grid: string[][];
  private score: number = 0;
  private timer: GameTimer;

  constructor(duration: number, onTick: (remaining: number) => void, onEnd: () => void) {
    this.grid = generateGrid(4);
    this.timer = new GameTimer(duration, onTick, () => {
      onEnd();
      console.log(`Final score: ${this.score}`);
    });
  }

  start() {
    this.timer.start();
  }

  stop() {
    this.timer.stop();
  }

  getGrid() {
    return this.grid;
  }

  submitPath(path: Position[], options?: { isStreak?: boolean; isAllTile?: boolean; isLongestWord?: boolean }) {
    const { word, valid } = validatePath(this.grid, path);
    if (valid) {
      const points = calculateWordScore(word, options);
      this.score += points;
      return { word, points, total: this.score };
    }
    return { word, points: 0, total: this.score };
  }
}
