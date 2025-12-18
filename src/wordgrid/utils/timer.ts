// src/wordgrid/utils/timer.ts
export class GameTimer {
  private duration: number; // in seconds
  private remaining: number;
  private intervalId: ReturnType<typeof setInterval> | null = null; // <-- FIXED
  private onTick: (remaining: number) => void;
  private onEnd: () => void;

  constructor(duration: number, onTick: (remaining: number) => void, onEnd: () => void) {
    this.duration = duration;
    this.remaining = duration;
    this.onTick = onTick;
    this.onEnd = onEnd;
  }

  start() {
    this.remaining = this.duration;
    this.intervalId = setInterval(() => {
      this.remaining -= 1;
      this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        this.onEnd();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.remaining = this.duration;
  }
}
