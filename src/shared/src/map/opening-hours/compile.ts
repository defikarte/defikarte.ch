import opening_hours from 'opening_hours';
import { minuteOfWeek, toIsoDate, weekEnd, WEEK_MINUTES } from './time';
import {
  type CompiledSchedule,
  type CompiledWeek,
  DEFAULT_HOLIDAY_REGION,
  type HolidayRegion,
  type Interval,
} from './types';

/**
 * Converts the open intervals of one `opening_hours` value within the week starting at
 * `start` into minute-of-week intervals. Empty or unparseable values return null (= unknown).
 */
export const compileSchedule = (
  value: string,
  start: Date,
  region: HolidayRegion = DEFAULT_HOLIDAY_REGION
): CompiledSchedule => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  try {
    const end = weekEnd(start);
    const intervals = new opening_hours(trimmed, region).getOpenIntervals(start, end);

    const result: Interval[] = [];
    for (const [from, to, unknown] of intervals) {
      const startMinute = minuteOfWeek(from);
      // an interval reaching into the next week ends at the week end
      const endMinute = to.getTime() >= end.getTime() ? WEEK_MINUTES : minuteOfWeek(to);

      // can only be empty around a DST switch
      if (endMinute > startMinute) {
        result.push([startMinute, endMinute, unknown]);
      }
    }

    return result;
  } catch {
    return null;
  }
};

export const compileWeek = (
  schedules: string[],
  weekStartMs: number,
  region: HolidayRegion = DEFAULT_HOLIDAY_REGION
): CompiledWeek => {
  const start = new Date(weekStartMs);
  return {
    weekStart: toIsoDate(start),
    schedules: schedules.map(value => compileSchedule(value, start, region)),
  };
};
