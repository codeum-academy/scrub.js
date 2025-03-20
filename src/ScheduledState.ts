class ScheduledState  {
  interval: number;
  maxIterations?: number;
  currentIteration?: number;

  constructor(interval: number, maxIterations?: number, currentIteration?: number) {
    this.interval = interval;
    this.maxIterations = maxIterations;
    this.currentIteration = currentIteration;
  }
}
