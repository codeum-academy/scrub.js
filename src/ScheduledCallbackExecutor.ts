class ScheduledCallbackExecutor {
  constructor(private context: Stage|Sprite) {}

  execute(now: number, diffTime: number) {
    return (item: ScheduledCallbackItem) => {
      const state = item.state;

      if (this.context instanceof Sprite) {
        if (this.context.deleted) {
          return false;
        }

        if (this.context.stopped) {
          return true;
        }
      }

      if (item.timeout && diffTime) {
        item.timeout += diffTime;
      }

      if (!item.timeout || item.timeout <= now) {
        const result = item.callback(this.context, state);

        if (state.maxIterations) {
          state.currentIteration++;
        }

        const isFinished =
          result === false ||
          (item.timeout && !state.interval && !state.maxIterations ) ||
          (state.maxIterations && state.currentIteration >= state.maxIterations)
        ;

        if (isFinished) {
          if (item.finishCallback) {
            item.finishCallback(this.context, state);
          }

          return false;
        }

        if (state.interval) {
          item.timeout = now + state.interval;
        }
      }

      return true;
    };
  }
}
