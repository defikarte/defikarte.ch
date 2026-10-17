const MINUTE_MS = 60 * 1000;

/**
 * Calls `onTick` at every full minute and whenever the page becomes visible again (e.g. the app
 * returns from the background), so time-dependent AED availability stays up to date.
 */
export class AvailabilityTicker {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onTick: () => void;

  constructor(onTick: () => void) {
    this.onTick = onTick;
  }

  start() {
    if (this.timeoutId !== null || this.intervalId !== null) {
      return;
    }

    // align with the minute boundary, as opening hours change on full minutes
    this.timeoutId = setTimeout(
      () => {
        this.timeoutId = null;
        this.onTick();
        this.intervalId = setInterval(this.onTick, MINUTE_MS);
      },
      MINUTE_MS - (Date.now() % MINUTE_MS)
    );

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  stop() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.onTick();
    }
  };
}
