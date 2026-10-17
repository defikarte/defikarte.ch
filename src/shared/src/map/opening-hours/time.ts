import { type MinuteOfWeek } from './types';

export const DAY_MINUTES = 1440;
export const WEEK_MINUTES = 7 * DAY_MINUTES;

// 0 = Monday ... 6 = Sunday
const dayOfWeek = (d: Date) => (d.getDay() + 6) % 7;

/**
 * Minutes since Monday 00:00 in the browser's local wall-clock time. Wall-clock minutes are used
 * deliberately, so a DST switch only shifts statuses within the affected hour.
 */
export const minuteOfWeek = (d: Date): MinuteOfWeek =>
  dayOfWeek(d) * DAY_MINUTES + d.getHours() * 60 + d.getMinutes();

/** Monday 00:00:00.000 local time of the week containing `d`. */
export const weekStart = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek(d));

/** Monday 00:00 local time of the week after the one starting at `start`. */
export const weekEnd = (start: Date): Date =>
  new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);

/** Local calendar date as "YYYY-MM-DD". */
export const toIsoDate = (d: Date): string => {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};
