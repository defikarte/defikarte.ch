import { minuteOfWeek } from './time';
import { type CompiledWeek, type MinuteOfWeek, OH_STATUS, type OpeningHoursStatus } from './types';

const statusOfSchedule = (
  schedule: CompiledWeek['schedules'][number],
  minute: MinuteOfWeek
): OpeningHoursStatus => {
  if (schedule === null) {
    return OH_STATUS.UNKNOWN;
  }

  for (const [start, end, unknown] of schedule) {
    if (minute >= start && minute < end) {
      return unknown ? OH_STATUS.UNKNOWN : OH_STATUS.OPEN;
    }
  }

  return OH_STATUS.CLOSED;
};

/** One status character per schedule (index = oh_idx), see {@link OpeningHoursStatus}. */
export const statusAt = (compiled: CompiledWeek, now: Date): string => {
  const minute = minuteOfWeek(now);
  return compiled.schedules.map(schedule => statusOfSchedule(schedule, minute)).join('');
};

/**
 * Recomputes the status string only when the time has crossed an interval boundary of any
 * schedule since the last computation, so the per-minute tick is nearly free.
 */
export class StatusTracker {
  public readonly compiled: CompiledWeek;
  // sorted, unique start and end minutes of all intervals
  private readonly boundaries: MinuteOfWeek[];
  private lastMinute: MinuteOfWeek | null = null;

  constructor(compiled: CompiledWeek) {
    this.compiled = compiled;

    const boundaries = new Set<MinuteOfWeek>();
    for (const schedule of compiled.schedules) {
      for (const [start, end] of schedule ?? []) {
        boundaries.add(start);
        boundaries.add(end);
      }
    }
    this.boundaries = [...boundaries].sort((a, b) => a - b);
  }

  /** Returns the new status string, or null if nothing can have changed since the last call. */
  public update(now: Date): string | null {
    const minute = minuteOfWeek(now);
    if (this.lastMinute !== null && !this.hasCrossedBoundary(this.lastMinute, minute)) {
      return null;
    }

    this.lastMinute = minute;
    return statusAt(this.compiled, now);
  }

  /** true if a boundary b with previous < b <= current exists */
  public hasCrossedBoundary(previous: MinuteOfWeek, current: MinuteOfWeek): boolean {
    if (current === previous) {
      return false;
    }
    // the clock went backwards (e.g. changed by the user) - recompute to be safe
    if (current < previous) {
      return true;
    }

    // binary search for the first boundary > previous
    let low = 0;
    let high = this.boundaries.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.boundaries[mid] <= previous) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low < this.boundaries.length && this.boundaries[low] <= current;
  }
}
